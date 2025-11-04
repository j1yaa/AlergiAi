import { validateUser, createUser, users } from '../src/data';

describe('Authentication', () => {
  beforeEach(() => {
    // Reset users to initial state
    Object.keys(users).forEach(key => {
      if (!['john@example.com', 'jane@example.com'].includes(key)) {
        delete users[key];
      }
    });
  });

  describe('validateUser', () => {
    test('returns user for valid credentials', () => {
      const user = validateUser('john@example.com', 'password');
      expect(user).toBeTruthy();
      expect(user?.email).toBe('john@example.com');
      expect(user?.name).toBe('John Doe');
    });

    test('returns null for invalid email', () => {
      const user = validateUser('nonexistent@example.com', 'password');
      expect(user).toBeNull();
    });

    test('returns null for invalid password', () => {
      const user = validateUser('john@example.com', 'wrongpassword');
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    test('creates new user successfully', () => {
      const newUser = createUser('Test User', 'test@example.com', 'password123', ['peanuts']);
      
      expect(newUser).toBeTruthy();
      expect(newUser?.name).toBe('Test User');
      expect(newUser?.email).toBe('test@example.com');
      expect(newUser?.allergens).toEqual(['peanuts']);
      expect(users['test@example.com']).toBeTruthy();
    });

    test('returns null for existing user', () => {
      const existingUser = createUser('John Doe', 'john@example.com', 'newpassword');
      expect(existingUser).toBeNull();
    });

    test('creates user with empty allergens by default', () => {
      const newUser = createUser('Test User', 'test2@example.com', 'password123');
      expect(newUser?.allergens).toEqual([]);
    });
  });
});