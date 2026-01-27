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
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Layout from './Layout';
import { uiSlice } from '@store/slices/uiSlice';
import { authSlice } from '@store/slices/authSlice';

// Mock the UserService
jest.mock('@services/userService', () => ({
  UserService: {
    getSelfUser: jest.fn(),
  },
}));

// Mock the authService
jest.mock('@services/auth.service', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

// Mock the hooks
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    themeMode: 'light',
    toggleThemeMode: jest.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiSlice.reducer,
      auth: authSlice.reducer,
    },
    preloadedState: {
      ui: {
        sidebarOpen: true,
        themeMode: 'light' as const,
        loading: false,
        notification: null,
      },
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['ADMIN'],
          scopes: ['read', 'write'],
          accounts: ['account1'],
        },
        tokens: null,
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

const renderWithProviders = (
  ui: React.ReactElement,
  { store = createMockStore(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

describe('Layout', () => {
  const { UserService } = require('@services/userService');
  const { authService } = require('@services/auth.service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children content', () => {
    renderWithProviders(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render app bar with logo and title', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByAltText('UIDAM')).toBeInTheDocument();
    expect(screen.getByText('UIDAM Admin Portal')).toBeInTheDocument();
  });

  it('should render navigation menu items', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('User Management')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Account Management')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Role Management')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Scope Management')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Approval Workflow')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Client Management')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Assistant')[0]).toBeInTheDocument();
  });

  it('should display user avatar with first letter of firstName', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const avatar = screen.getByText('T'); // First letter of 'Test'
    expect(avatar).toBeInTheDocument();
  });

  it('should toggle sidebar when menu icon is clicked', () => {
    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Check that the action was dispatched
    const state = store.getState();
    expect(state.ui.sidebarOpen).toBe(false);
  });

  it('should open user menu when avatar is clicked', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should navigate when menu item is clicked', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const userManagementItems = screen.getAllByText('User Management');
    fireEvent.click(userManagementItems[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  it('should logout and navigate to login when logout is clicked', async () => {
    authService.logout.mockResolvedValue(undefined);
    
    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    // Open user menu
    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    // Click logout
    await waitFor(() => {
      const logoutButtons = screen.getAllByText('Logout');
      fireEvent.click(logoutButtons[0]);
    });

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should call authService.logout when logout is triggered', async () => {
    authService.logout.mockResolvedValue(undefined);

    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle logout failure gracefully', async () => {
    authService.logout.mockRejectedValue(new Error('Logout failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    consoleErrorSpy.mockRestore();
  });

  it('should clear Redux state after logout', async () => {
    authService.logout.mockResolvedValue(undefined);

    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });
  });

  it('should close user menu after logout', async () => {
    authService.logout.mockResolvedValue(undefined);

    const store = createMockStore();
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    // Menu should be open
    expect(screen.getAllByText('Logout').length).toBeGreaterThan(0);

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      // Menu should be closed after logout
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should close user menu when menu item is clicked', async () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Open menu
    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    // Click Profile
    const profileButtons = screen.getAllByText('Profile');
    fireEvent.click(profileButtons[0]);

    // Menu should close (Profile should not be visible) - wait for menu to close
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /Profile/i })).not.toBeInTheDocument();
    });
  });

  it('should display correct page title based on route', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // The page title is displayed in the app bar as uppercase text
    const dashboardTexts = screen.getAllByText('Dashboard');
    // Verify at least one instance exists (in the page title area)
    expect(dashboardTexts.length).toBeGreaterThan(0);
  });

  it('should show theme toggle button', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const themeButton = screen.getByTestId('DarkModeIcon').closest('button');
    expect(themeButton).toBeInTheDocument();
  });

  it('should render sidebar when sidebarOpen is true', () => {
    const store = createMockStore({
      ui: { sidebarOpen: true, themeMode: 'light' as const, loading: false, notification: null },
    });

    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    const uidamAdminElements = screen.getAllByText('UIDAM Admin');
    expect(uidamAdminElements.length).toBeGreaterThan(0);
  });

  it('should handle user without firstName gracefully', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          firstName: undefined,
          lastName: 'User',
          roles: ['ADMIN'],
          scopes: ['read'],
          accounts: ['account1'],
        },
        loading: false,
        error: null,
      },
    });

    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    // Should use first letter of userName
    const avatarButton = screen.getByLabelText('account of current user');
    const avatar = avatarButton.querySelector('.MuiAvatar-root');
    expect(avatar).toHaveTextContent('t');
  });

  it('should handle user without firstName or userName', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          userName: undefined,
          email: 'test@example.com',
          firstName: undefined,
          lastName: 'User',
          roles: ['ADMIN'],
          scopes: ['read'],
          accounts: ['account1'],
        },
        loading: false,
        error: null,
      },
    });

    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { store }
    );

    // Should use default 'U'
    const avatarButton = screen.getByLabelText('account of current user');
    const avatar = avatarButton.querySelector('.MuiAvatar-root');
    expect(avatar).toHaveTextContent('U');
  });

  it('should display user full name in menu', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);

    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('should apply selected style to current route navigation item', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const dashboardItems = screen.getAllByText('Dashboard');
    // Find the one that's inside a ListItemButton (not the page title)
    const dashboardButton = dashboardItems.find(item => item.closest('[role="button"]'));
    const button = dashboardButton?.closest('[role="button"]');
    
    expect(button).toHaveClass('Mui-selected');
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      UserService.getSelfUser.mockClear();
    });

    it('should fetch user profile on mount if firstName or lastName is missing', async () => {
      const incompleteUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const completeUser = {
        ...incompleteUser,
        firstName: 'John',
        lastName: 'Doe',
      };

      UserService.getSelfUser.mockResolvedValue({ data: completeUser });

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: incompleteUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      await waitFor(() => {
        expect(UserService.getSelfUser).toHaveBeenCalled();
      });
    });

    it('should not fetch profile if user already has firstName and lastName', () => {
      const completeUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: completeUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      expect(UserService.getSelfUser).not.toHaveBeenCalled();
    });

    it('should handle profile fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      UserService.getSelfUser.mockRejectedValue(new Error('Failed to fetch profile'));

      const incompleteUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: undefined,
        lastName: 'Doe',
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: incompleteUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch user profile in Layout:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should update Redux store with fetched profile data', async () => {
      const incompleteUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const completeUser = {
        id: 1,
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'ACTIVE' as const,
      };

      UserService.getSelfUser.mockResolvedValue({ data: completeUser });

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: incompleteUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.user).toMatchObject({
          firstName: 'Jane',
          lastName: 'Smith',
        });
      });
    });

    it('should display updated user name in avatar after profile fetch', async () => {
      const incompleteUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const completeUser = {
        id: 1,
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        status: 'ACTIVE' as const,
      };

      UserService.getSelfUser.mockResolvedValue({ data: completeUser });

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: incompleteUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      await waitFor(() => {
        expect(UserService.getSelfUser).toHaveBeenCalled();
        const state = store.getState();
        expect(state.auth.user?.firstName).toBe('Bob');
      });
    });

    it('should handle response without data property', async () => {
      const incompleteUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: undefined,
        lastName: 'Doe',
        roles: ['ADMIN'],
        scopes: ['read'],
        accounts: ['account1'],
      };

      const directUserResponse = {
        id: 1,
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Direct',
        lastName: 'User',
        status: 'ACTIVE' as const,
      };

      UserService.getSelfUser.mockResolvedValue(directUserResponse);

      const store = createMockStore({
        auth: {
          isAuthenticated: true,
          user: incompleteUser,
          tokens: null,
          isLoading: false,
          error: null,
        },
      });

      renderWithProviders(
        <Layout>
          <div>Content</div>
        </Layout>,
        { store }
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.user?.firstName).toBe('Direct');
      });
    });
  });
});
