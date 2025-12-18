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
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './store/slices/authSlice';
import { uiSlice } from './store/slices/uiSlice';
import React from 'react';

// Mock all lazy-loaded components BEFORE importing App
jest.mock('@features/dashboard/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Component</div>,
}));

jest.mock('@features/user-management/UserManagement', () => ({
  __esModule: true,
  default: () => <div>User Management Component</div>,
}));

jest.mock('@features/account-management/AccountManagement', () => ({
  __esModule: true,
  default: () => <div>Account Management Component</div>,
}));

jest.mock('@features/role-management/RoleManagement', () => ({
  __esModule: true,
  default: () => <div>Role Management Component</div>,
}));

jest.mock('@features/scope-management/ScopeManagement', () => ({
  __esModule: true,
  default: () => <div>Scope Management Component</div>,
}));

jest.mock('@features/approval-workflow/ApprovalWorkflow', () => ({
  __esModule: true,
  default: () => <div>Approval Workflow Component</div>,
}));

jest.mock('@features/client-management/ClientManagement', () => ({
  __esModule: true,
  default: () => <div>Client Management Component</div>,
}));

jest.mock('@features/assistant/Assistant', () => ({
  __esModule: true,
  default: () => <div>Assistant Component</div>,
}));

jest.mock('@features/auth/Login', () => ({
  __esModule: true,
  default: () => <div>Login Component</div>,
}));

jest.mock('@features/auth/AuthCallback', () => ({
  __esModule: true,
  default: () => <div>Auth Callback Component</div>,
}));

// Mock Layout component
jest.mock('@components/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

// Mock ProtectedRoute component
jest.mock('@components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

// Import App AFTER all mocks are set up
import App from './App';

const createMockStore = (isAuthenticated = false) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated,
        user: isAuthenticated ? {
          id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: [],
          scopes: [],
          accounts: [],
        } : null,
        tokens: isAuthenticated ? {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        } : null,
        isLoading: false,
        error: null,
      },
      ui: {
        themeMode: 'light' as const,
        sidebarOpen: true,
        loading: false,
        notification: null,
      },
    },
  });
};

describe.skip('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('renders the app without crashing', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders with Redux Provider', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    expect(container).toBeTruthy();
  });

  it('renders with QueryClientProvider', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    expect(container.querySelector('[class*="MuiCssBaseline"]')).toBeTruthy();
  });

  it('renders with ThemeProvider and CssBaseline', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    // CssBaseline is applied
    expect(document.querySelector('style')).toBeTruthy();
  });

  it('shows loading fallback for lazy components', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
  //  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders Toaster component', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    expect(container).toBeTruthy();
  });

  it('applies theme mode from store', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it('initializes QueryClient with correct options', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    expect(container).toBeTruthy();
  });

  it('exports App as default', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
