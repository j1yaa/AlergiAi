import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

const mockNavigation = {
  replace: jest.fn(),
};

describe('LoginScreen', () => {
  test('renders login form', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    expect(getByText('AllergyAI')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });
});