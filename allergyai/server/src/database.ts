import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default prisma;

// Database helper functions
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createUser = async (name: string, email: string, password: string, allergens: string[] = []) => {
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      allergens: JSON.stringify(allergens),
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const validateUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  
  const isValid = await comparePassword(password, user.password);
  return isValid ? user : null;
};

export const createMeal = async (userId: string, description: string, analysis: any) => {
  return prisma.meal.create({
    data: {
      userId,
      description,
      ingredients: JSON.stringify(analysis.ingredients),
      allergens: JSON.stringify(analysis.allergens),
      riskScore: analysis.riskScore,
      advice: analysis.advice,
    },
  });
};

export const createAlert = async (userId: string, mealId: string, severity: string, allergens: string[], note: string) => {
  return prisma.alert.create({
    data: {
      userId,
      mealId,
      severity,
      allergens: JSON.stringify(allergens),
      note,
    },
  });
};

export const getUserMeals = async (userId: string, limit = 10) => {
  return prisma.meal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const getUserAlerts = async (userId: string, status?: string, page = 1, pageSize = 20) => {
  const where: any = { userId };
  
  if (status === 'flagged') {
    where.severity = { in: ['medium', 'high'] };
  }
  
  const skip = (page - 1) * pageSize;
  
  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { meal: true },
    }),
    prisma.alert.count({ where }),
  ]);
  
  return { alerts, total };
};