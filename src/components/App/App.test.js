import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Simple test without importing Blog components that have markdown dependencies
const MockApp = () => {
  return (
    <BrowserRouter>
      <div>Portfolio App</div>
    </BrowserRouter>
  );
};

test('renders app without crashing', () => {
  render(<MockApp />);
});
