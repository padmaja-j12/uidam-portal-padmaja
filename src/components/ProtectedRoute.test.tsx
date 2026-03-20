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
// Mock the config modules FIRST before any imports
jest.mock('@config/runtimeConfig', () => ({
  getConfig: jest.fn(() => ({
    REACT_APP_TOKEN_STORAGE_KEY: 'uidam_admin_token',
    REACT_APP_REFRESH_TOKEN_STORAGE_KEY: 'uidam_admin_refresh_token',
  })),
  loadRuntimeConfig: jest.fn(),
  loadConfig: jest.fn(),
}));

// Mock tokenManager so we can control refresh behaviour
jest.mock('@/utils/tokenManager', () => ({
  shouldRefreshToken: jest.fn().mockReturnValue(false),
  handleTokenRefresh: jest.fn().mockResolvedValue(null),
}));

import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from './ProtectedRoute';
import { authSlice } from '@store/slices/authSlice';
import { uiSlice } from '@store/slices/uiSlice';
import { shouldRefreshToken, handleTokenRefresh } from '@/utils/tokenManager';

const mockShouldRefreshToken = shouldRefreshToken as jest.Mock;
const mockHandleTokenRefresh = handleTokenRefresh as jest.Mock;

// Mock Navigate component
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => {
    mockNavigate(to, replace);
    return <div data-testid="navigate">{`Redirecting to ${to}`}</div>;
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Clear localStorage to prevent state pollution from authSlice initialization
    localStorage.clear();
  });

  const createMockStore = (isAuthenticated: boolean) => {
    // Set up localStorage before creating the store since authSlice reads from it during initialization
    if (isAuthenticated) {
      localStorage.setItem('uidam_admin_token', 'test-token');
      localStorage.setItem('uidam_admin_refresh_token', 'refresh-token');
      localStorage.setItem('uidam_user_profile', JSON.stringify({
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['USER'],
        scopes: ['read'],
        accounts: ['account1']
      }));
      localStorage.setItem('uidam_token_expires_at', String(Date.now() + 3600000)); // 1 hour from now
    }
    
    return configureStore({
      reducer: {
        auth: authSlice.reducer,
        ui: uiSlice.reducer,
      },
    });
  };

  describe('when user is authenticated', () => {
    it.skip('should render children', () => {
      const store = createMockStore(true);
      
      const { getByText, queryByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
      expect(queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it.skip('should render multiple children', () => {
      const store = createMockStore(true);
      
      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>First Child</div>
              <div>Second Child</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(getByText('First Child')).toBeInTheDocument();
      expect(getByText('Second Child')).toBeInTheDocument();
    });

    it.skip('should render complex children components', () => {
      const store = createMockStore(true);
      const ComplexComponent = () => (
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to the dashboard</p>
        </div>
      );
      
      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <ComplexComponent />
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(getByText('Dashboard')).toBeInTheDocument();
      expect(getByText('Welcome to the dashboard')).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    it('should redirect to login', () => {
      const store = createMockStore(false);
      
      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('should not render children when redirecting', () => {
      const store = createMockStore(false);
      
      const { queryByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should use replace navigation', () => {
      const store = createMockStore(false);
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });
  });

  describe('integration with routing', () => {
    it.skip('should work within Routes component', () => {
      const store = createMockStore(true);
      
      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <div>Home Page</div>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </Provider>
      );

      expect(getByText('Home Page')).toBeInTheDocument();
    });
  });

  describe('authentication state changes', () => {
    it.skip('should react to authentication state', () => {
      const store = createMockStore(false);
      
      const { rerender, queryByText, getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
      expect(getByTestId('navigate')).toBeInTheDocument();

      // Update to authenticated state
      const authenticatedStore = createMockStore(true);
      rerender(
        <Provider store={authenticatedStore}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      expect(queryByText('Protected Content')).toBeInTheDocument();
    });
  });

  // ─── Token refresh async paths ───────────────────────────────────────────

  describe('token refresh flow', () => {
    const createAuthenticatedStore = () =>
      configureStore({
        reducer: { auth: authSlice.reducer, ui: uiSlice.reducer },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: 'user-1',
              userName: 'testuser',
              email: 'test@test.com',
              firstName: 'Test',
              lastName: 'User',
              status: 'ACTIVE' as const,
              accounts: [],
              roles: [],
              scopes: [],
            },
            tokens: {
              accessToken: 'test-token',
              refreshToken: 'refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
            error: null,
            loading: false,
          },
          ui: {
            sidebarOpen: true,
            themeMode: 'light' as const,
            loading: false,
            notification: null,
          },
        },
      });

    beforeEach(() => {
      mockShouldRefreshToken.mockReturnValue(false);
      mockHandleTokenRefresh.mockResolvedValue(null);
      jest.clearAllMocks();
    });

    it('renders children immediately when isAuthenticated is true in store', async () => {
      const store = createAuthenticatedStore();
      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Authenticated Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );
      await waitFor(() => expect(getByText('Authenticated Content')).toBeInTheDocument());
    });

    it('redirects when token refresh fails and no valid token found', async () => {
      const store = createMockStore(false);
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockRejectedValue(new Error('refresh error'));

      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByTestId('navigate')).toBeInTheDocument());
    });

    it('redirects when token refresh returns null', async () => {
      const store = createMockStore(false);
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockResolvedValue(null);

      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByTestId('navigate')).toBeInTheDocument());
    });
  });

  // ─── Lines 56-109: scenarios that require tokens in localStorage ─────────

  describe('token in localStorage paths', () => {
    const createUnauthenticatedStore = () =>
      configureStore({
        reducer: { auth: authSlice.reducer, ui: uiSlice.reducer },
        preloadedState: {
          auth: {
            isAuthenticated: false,
            isLoading: false,
            user: null,
            tokens: null,
            error: null,
            loading: false,
          },
          ui: {
            sidebarOpen: true,
            themeMode: 'light' as const,
            loading: false,
            notification: null,
          },
        },
      });

    beforeEach(() => {
      jest.clearAllMocks();
      // Provide token AND refreshToken so the early-return on line 49-53 is NOT hit
      localStorage.setItem('uidam_admin_token', 'old-token');
      localStorage.setItem('uidam_admin_refresh_token', 'old-refresh');
    });

    it('dispatches loginSuccess and renders children when refresh succeeds', async () => {
      // Also provide profile data so the if(userProfile && newRefreshToken && expiresAt) branch is hit
      localStorage.setItem('uidam_user_profile', JSON.stringify({
        id: 'user-1', userName: 'testuser', email: 'test@test.com',
        firstName: 'Test', lastName: 'User', status: 'ACTIVE',
        accounts: [], roles: [], scopes: [],
      }));
      localStorage.setItem('uidam_token_expires_at', String(Date.now() + 3600000));

      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockResolvedValue('new-access-token');

      const store = createUnauthenticatedStore();

      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByText('Protected Content')).toBeInTheDocument());
    });

    it('redirects when refresh succeeds but userProfile is missing from localStorage', async () => {
      // No userProfile / expiresAt → falls through to setShouldRedirect(true)
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockResolvedValue('new-access-token');

      const store = createUnauthenticatedStore();

      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByTestId('navigate')).toBeInTheDocument());
    });

    it('restores Redux state from localStorage (page-refresh scenario)', async () => {
      // Token is valid (should not refresh), but Redux auth state is empty
      localStorage.setItem('uidam_user_profile', JSON.stringify({
        id: 'user-1', userName: 'testuser', email: 'test@test.com',
        firstName: 'Test', lastName: 'User', status: 'ACTIVE',
        accounts: [], roles: [], scopes: [],
      }));
      localStorage.setItem('uidam_token_expires_at', String(Date.now() + 3600000));

      mockShouldRefreshToken.mockReturnValue(false);

      const store = createUnauthenticatedStore();

      const { getByText } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByText('Protected Content')).toBeInTheDocument());
    });

    it('redirects when token valid but no userProfile in localStorage', async () => {
      // shouldRefreshToken=false, but no userProfile → store stays unauthenticated → redirect
      mockShouldRefreshToken.mockReturnValue(false);

      const store = createUnauthenticatedStore();

      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByTestId('navigate')).toBeInTheDocument());
    });

    it('redirects when handleTokenRefresh throws (catch path)', async () => {
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockRejectedValue(new Error('network error on refresh'));

      const store = createUnauthenticatedStore();

      const { getByTestId } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => expect(getByTestId('navigate')).toBeInTheDocument());
    });
  });
});
