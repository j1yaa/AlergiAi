import prisma from './database';
import { hashPassword } from './database';

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const johnPassword = await hashPassword('password');
  const janePassword = await hashPassword('password123');

  const john = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: johnPassword,
      allergens: JSON.stringify(['peanuts', 'shellfish']),
    },
  });

  const jane = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: janePassword,
      allergens: JSON.stringify(['dairy', 'gluten']),
    },
  });

  // Create sample meals
  const meal1 = await prisma.meal.create({
    data: {
      userId: john.id,
      description: 'Grilled chicken salad with mixed greens',
      ingredients: JSON.stringify(['chicken', 'lettuce', 'tomatoes', 'cucumber']),
      allergens: JSON.stringify([]),
      riskScore: 10,
      advice: 'This meal appears safe for your dietary restrictions.',
    },
  });

  const meal2 = await prisma.meal.create({
    data: {
      userId: john.id,
      description: 'Peanut butter toast with banana',
      ingredients: JSON.stringify(['bread', 'peanut butter', 'banana']),
      allergens: JSON.stringify(['peanuts', 'gluten']),
      riskScore: 85,
      advice: 'High allergen risk detected! Contains peanuts and gluten.',
    },
  });

  // Create sample alerts
  await prisma.alert.create({
    data: {
      userId: john.id,
      mealId: meal2.id,
      severity: 'high',
      allergens: JSON.stringify(['peanuts']),
      note: 'High peanut content detected in meal',
    },
  });

  await prisma.alert.create({
    data: {
      userId: john.id,
      mealId: meal1.id,
      severity: 'low',
      allergens: JSON.stringify([]),
      note: 'Safe meal - no allergens detected',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });