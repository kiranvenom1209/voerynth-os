import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginScreen from './LoginScreen';
import { AccentColorProvider } from '../context/AccentColorContext';

const renderLogin = (props = {}) => render(
  <AccentColorProvider>
    <LoginScreen onConnect={vi.fn()} {...props} />
  </AccentColorProvider>
);

describe('LoginScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows in-app validation instead of silently ignoring empty credentials', () => {
    const onConnect = vi.fn();
    renderLogin({ onConnect });

    fireEvent.click(screen.getByRole('button', { name: /connect to system/i }));
    fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

    expect(screen.getByText(/enter the control hub url and access token/i)).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('clears errors and submits credentials once both fields are present', () => {
    const onConnect = vi.fn();
    const onClearError = vi.fn();
    renderLogin({
      onConnect,
      onClearError,
      connectionError: 'Connection failed',
    });

    fireEvent.click(screen.getByRole('button', { name: /connect to system/i }));
    expect(screen.getByText('Connection failed')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('http://controlhub.local:8123'), {
      target: { value: 'https://control.example' },
    });
    fireEvent.change(screen.getByPlaceholderText('eyJhbG...'), {
      target: { value: 'token-value' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

    expect(onClearError).toHaveBeenCalled();
    expect(onConnect).toHaveBeenCalledWith('https://control.example', 'token-value');
  });
});
