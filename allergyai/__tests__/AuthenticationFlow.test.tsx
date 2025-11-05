import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../src/api/client');

const mockNavigation = {
  navigate: jest.fn(),
};

const mockOnLogin = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginScreen', () => {
    test('renders login form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      expect(getByText('AllergyAI')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
      expect(getByText('Create account')).toBeTruthy();
    });

    test('validates empty email', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const loginButton = getByText('Login');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Email is required');
      });
    });

    test('validates invalid email format', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const emailInput = getByPlaceholderText('Email');
      const loginButton = getByText('Login');
      
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a valid email address');
      });
    });

    test('validates empty password', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const emailInput = getByPlaceholderText('Email');
      const loginButton = getByText('Login');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(loginButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Password is required');
      });
    });

    test('navigates to register screen', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const createAccountLink = getByText('Create account');
      fireEvent.press(createAccountLink);
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    test('fills demo credentials when demo account is tapped', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const demoAccount = getByText('john@example.com / password');
      fireEvent.press(demoAccount);
      
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      
      expect(emailInput.props.value).toBe('john@example.com');
      expect(passwordInput.props.value).toBe('password');
    });
  });

  describe('RegisterScreen', () => {
    test('renders registration form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      expect(getByText('Create Account')).toBeTruthy();
      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Password (min 6 characters)')).toBeTruthy();
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
    });

    test('validates empty name', async () => {
      const { getByText } = render(
        <RegisterScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const createButton = getByText('Create Account');
      fireEvent.press(createButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Name is required');
      });
    });

    test('validates password length', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), '123');
      
      const createButton = getByText('Create Account');
      fireEvent.press(createButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Password must be at least 6 characters');
      });
    });

    test('validates password confirmation', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'different');
      
      const createButton = getByText('Create Account');
      fireEvent.press(createButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Passwords do not match');
      });
    });

    test('navigates to login screen', () => {
      const { getByText } = render(
        <RegisterScreen navigation={mockNavigation} onLogin={mockOnLogin} />
      );
      
      const signInLink = getByText('Already have an account? Sign In');
      fireEvent.press(signInLink);
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
});