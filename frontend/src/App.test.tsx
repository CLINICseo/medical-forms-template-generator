import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders medical forms text', () => {
  render(<App />);
  const element = screen.getByText(/Medical Forms/i);
  expect(element).toBeInTheDocument();
});
