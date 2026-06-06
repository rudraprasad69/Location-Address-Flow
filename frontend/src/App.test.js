import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: () => Promise.resolve({ data: [] }),
    post: () => Promise.resolve({ data: {} }),
    put: () => Promise.resolve({ data: {} }),
    delete: () => Promise.resolve({ data: {} })
  },
  get: () => Promise.resolve({ data: [] }),
  post: () => Promise.resolve({ data: {} }),
  put: () => Promise.resolve({ data: {} }),
  delete: () => Promise.resolve({ data: {} })
}));

test('renders Location Address Flow header', async () => {
  render(<App />);
  const headerElement = screen.getByText(/Location Address Flow/i);
  expect(headerElement).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /Saved Addresses/i })).toBeInTheDocument();
  });
});
