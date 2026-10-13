import type { UseFormRegister } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginForm } from '@/features/auth/components/login-form';
import { PasswordInput } from '@/components/ui/password-input';
import { AppHeader } from '@/components/layouts/app-header';

const mockLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/features/auth/hooks', () => ({
  useLogin: () => ({ login: mockLogin, isLoading: false, error: null }),
  useAuth: () => ({ logout: mockLogout, isLoading: false }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}));

describe('LoginForm', () => {
  it('renders the Sign In heading and email field', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });
});

describe('PasswordInput', () => {
  it('toggles input type between password and text', async () => {
    const user = userEvent.setup();
    const register = ((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })) as unknown as UseFormRegister<Record<string, never>>;

    render(<PasswordInput name="password" label="Password" register={register} placeholder="Enter your password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('AppHeader', () => {
  it('renders a logout button', () => {
    render(<AppHeader />);

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
