/**
 * Frontend Test Example - Login Component
 * Using React Testing Library and Vitest
 * 
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

// Mock the API module
vi.mock('../utils/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

const mockLogin = vi.fn();

// Mock AuthContext
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      isAuthenticated: false,
    }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithRouter(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Form should show required validation
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeRequired();
    });
  });

  it('calls login API with correct credentials', async () => {
    const { authAPI } = await import('../utils/api');
    const mockResponse = {
      data: {
        token: 'test-token-123',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'pharmacist',
        },
      },
    };
    
    vi.mocked(authAPI.login).mockResolvedValue(mockResponse);
    
    renderWithRouter(<Login />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on failed login', async () => {
    const { authAPI } = await import('../utils/api');
    
    vi.mocked(authAPI.login).mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });
    
    renderWithRouter(<Login />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const { authAPI } = await import('../utils/api');
    
    // Create a promise that we can wait on
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    
    vi.mocked(authAPI.login).mockReturnValue(loginPromise as any);
    
    renderWithRouter(<Login />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    
    // Resolve the promise
    resolveLogin!({
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test', email: 'test@example.com', role: 'pharmacist' },
      },
    });
  });
});
