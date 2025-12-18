/********************************************************************************
* Copyright (c) 2025 Harman International
*
* <p>Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* <p>http://www.apache.org/licenses/LICENSE-2.0  
*
* <p> Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* <p>SPDX-License-Identifier: Apache-2.0
********************************************************************************/
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AuthCallback from './AuthCallback';
import { authService } from '../../services/auth.service';
import { authSlice } from '../../store/slices/authSlice';

// Mock dependencies
const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

jest.mock('../../services/auth.service');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
}));

describe('AuthCallback Component', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Reset mocks completely (clears calls and implementations)
    (authService.handleAuthCallback as jest.Mock).mockReset().mockResolvedValue({
      user: { id: 'default', userName: 'default' },
      tokens: { accessToken: 'default', refreshToken: 'default', expiresIn: 3600, tokenType: 'Bearer' },
    });
    mockNavigate.mockClear();
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
    
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthCallback />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Success Flow', () => {
    it('renders loading state initially', () => {
      mockSearchParams.set('code', 'auth-code-123');
      mockSearchParams.set('state', 'state-xyz');

      renderComponent();
      
      expect(screen.getByText(/Completing Authentication/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles successful authentication with code and state', async () => {
      const mockAuthResult = {
        user: { id: '1', userName: 'testuser', email: 'test@example.com' },
        token: 'mock-token',
        tokens: { access_token: 'access', refresh_token: 'refresh' },
      };

      mockSearchParams.set('code', 'auth-code-123');
      mockSearchParams.set('state', 'state-xyz');

      (authService.handleAuthCallback as jest.Mock).mockResolvedValue(mockAuthResult);

      renderComponent();

      await waitFor(() => {
        expect(authService.handleAuthCallback).toHaveBeenCalledWith('auth-code-123', 'state-xyz');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('logs authentication details for debugging', async () => {
      const mockAuthResult = {
        user: { id: '1', userName: 'testuser' },
        token: 'token',
        tokens: {},
      };

      mockSearchParams.set('code', 'code123');
      mockSearchParams.set('state', 'state456');

      (authService.handleAuthCallback as jest.Mock).mockResolvedValue(mockAuthResult);

      renderComponent();

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          'AuthCallback - URL params:',
          expect.objectContaining({
            code: 'present',
            state: 'present',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when OAuth error parameter is present', async () => {
      mockSearchParams.set('error', 'access_denied');
      mockSearchParams.set('error_description', 'User denied access');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Authentication Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/User denied access/i)).toBeInTheDocument();
      });
    });

    it('uses default error message when error_description is missing', async () => {
      mockSearchParams.set('error', 'server_error');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Authorization failed/i)).toBeInTheDocument();
      });
    });

    it('displays error when code parameter is missing', async () => {
      mockSearchParams.set('state', 'state-xyz');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Missing authorization code or state parameter/i)).toBeInTheDocument();
      });
    });

    it('displays error when state parameter is missing', async () => {
      mockSearchParams.set('code', 'code-123');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Missing authorization code or state parameter/i)).toBeInTheDocument();
      });
    });

    it('handles authentication service errors', async () => {
      mockSearchParams.set('code', 'code-123');
      mockSearchParams.set('state', 'state-xyz');

      (authService.handleAuthCallback as jest.Mock).mockRejectedValue(
        new Error('Invalid authorization code')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Invalid authorization code/i)).toBeInTheDocument();
      });
    });

    it('redirects to login page after error', async () => {
      jest.useFakeTimers();

      mockSearchParams.set('error', 'invalid_request');
      mockSearchParams.set('error_description', 'Invalid request');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Redirecting to login page/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      jest.useRealTimers();
    });

    it('displays redirecting message on error', async () => {
      mockSearchParams.set('code', 'code');
      mockSearchParams.set('state', 'state');

      (authService.handleAuthCallback as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Redirecting to login page/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('renders loading progress indicator', () => {
      mockSearchParams.set('code', 'code-123');
      mockSearchParams.set('state', 'state-xyz');
      
      renderComponent();
      
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
    });

    it('renders error alert with correct severity', async () => {
      mockSearchParams.set('error', 'error');

      renderComponent();

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Redux Integration', () => {
    it.skip('dispatches loginSuccess on successful authentication', async () => {
      const mockAuthResult = {
        user: { id: '1', userName: 'test' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600, tokenType: 'Bearer' },
      };

      mockSearchParams.set('code', 'code');
      mockSearchParams.set('state', 'state');

      (authService.handleAuthCallback as jest.Mock).mockResolvedValue(mockAuthResult);

      renderComponent();

      await waitFor(() => {
        const state = store.getState() as { auth: { user: typeof mockAuthResult.user; isAuthenticated: boolean } };
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.auth.user).toEqual(mockAuthResult.user);
      }, { timeout: 3000 });
    });

    it('dispatches loginFailure on authentication error', async () => {
      mockSearchParams.set('error', 'error');
      mockSearchParams.set('error_description', 'Test error');

      renderComponent();

      await waitFor(() => {
        const state = store.getState() as { auth: { error: string } };
        expect(state.auth.error).toBe('Test error');
      });
    });
  });
});
