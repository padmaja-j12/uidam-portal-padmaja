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
import { configureStore } from '@reduxjs/toolkit';
import { AuthUser } from '@/types';

// Mock the config modules BEFORE importing authSlice
jest.mock('@config/runtimeConfig', () => ({
  getConfig: jest.fn(() => ({
    REACT_APP_TOKEN_STORAGE_KEY: 'uidam_admin_token',
    REACT_APP_REFRESH_TOKEN_STORAGE_KEY: 'uidam_admin_refresh_token',
  })),
  loadRuntimeConfig: jest.fn(),
  loadConfig: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// NOW import authSlice after mocks are set up
import {
  authSlice,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError
} from './authSlice';

// Type for the test store
type TestStore = ReturnType<typeof configureStore<{
  auth: ReturnType<typeof authSlice.reducer>;
}>>;

describe('authSlice', () => {
  let store: TestStore;

  const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    id: '123',
    userName: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['USER'],
    scopes: ['read:users'],
    accounts: ['account1'],
    ...overrides
  });

  beforeEach(() => {
    localStorageMock.clear();
    store = configureStore({
      reducer: {
        auth: authSlice.reducer
      }
    });
  });

  it('should have correct initial state when no stored data', () => {
    const state = store.getState().auth;
    
    expect(state).toEqual({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  });

  it.skip('should initialize from localStorage if valid data exists', () => {
    const futureTime = Date.now() + 3600000; // 1 hour in future
    const mockUser = createMockUser();

    localStorageMock.setItem('uidam_admin_token', 'test-token');
    localStorageMock.setItem('uidam_admin_refresh_token', 'test-refresh-token');
    localStorageMock.setItem('uidam_user_profile', JSON.stringify(mockUser));
    localStorageMock.setItem('uidam_token_expires_at', futureTime.toString());

    // Create new store to trigger initialization
    const newStore = configureStore({
      reducer: {
        auth: authSlice.reducer
      }
    });

    const state = newStore.getState().auth;
    
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens?.accessToken).toBe('test-token');
    expect(state.tokens?.refreshToken).toBe('test-refresh-token');
  });

  it('should not initialize from localStorage if token is expired', () => {
    const pastTime = Date.now() - 1000; // 1 second in past
    const mockUser = createMockUser();

    localStorageMock.setItem('uidam_admin_token', 'test-token');
    localStorageMock.setItem('uidam_admin_refresh_token', 'test-refresh-token');
    localStorageMock.setItem('uidam_user_profile', JSON.stringify(mockUser));
    localStorageMock.setItem('uidam_token_expires_at', pastTime.toString());

    const newStore = configureStore({
      reducer: {
        auth: authSlice.reducer
      }
    });

    const state = newStore.getState().auth;
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });

  it('should handle loginStart action', () => {
    store.dispatch(loginStart());
    const state = store.getState().auth;
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loginSuccess action', () => {
    const mockUser = createMockUser();

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer' as const
    };

    store.dispatch(loginSuccess({ user: mockUser, tokens: mockTokens }));
    const state = store.getState().auth;
    
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loginFailure action', () => {
    const errorMessage = 'Invalid credentials';
    
    store.dispatch(loginFailure(errorMessage));
    const state = store.getState().auth;
    
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it('should handle logout action', () => {
    const mockUser = createMockUser();

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer' as const
    };

    // First login
    store.dispatch(loginSuccess({ user: mockUser, tokens: mockTokens }));
    
    // Set items in localStorage
    localStorageMock.setItem('uidam_admin_token', 'token');
    localStorageMock.setItem('uidam_admin_refresh_token', 'refresh');
    localStorageMock.setItem('uidam_token_expires_at', Date.now().toString());
    localStorageMock.setItem('uidam_user_profile', JSON.stringify(mockUser));
    
    // Then logout
    store.dispatch(logout());
    const state = store.getState().auth;
    
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Check localStorage is cleared
    expect(localStorageMock.getItem('uidam_admin_token')).toBeNull();
    expect(localStorageMock.getItem('uidam_admin_refresh_token')).toBeNull();
    expect(localStorageMock.getItem('uidam_token_expires_at')).toBeNull();
    expect(localStorageMock.getItem('uidam_user_profile')).toBeNull();
  });

  it('should handle updateUser action', () => {
    const initialUser = createMockUser();
    const updatedUser = createMockUser({
      userName: 'updateduser',
      email: 'updated@example.com',
      roles: ['USER', 'ADMIN']
    });

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer' as const
    };

    store.dispatch(loginSuccess({ user: initialUser, tokens: mockTokens }));
    store.dispatch(updateUser(updatedUser));
    
    const state = store.getState().auth;
    
    expect(state.user).toEqual(updatedUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle clearError action', () => {
    store.dispatch(loginFailure('Some error'));
    expect(store.getState().auth.error).toBe('Some error');
    
    store.dispatch(clearError());
    const state = store.getState().auth;
    
    expect(state.error).toBeNull();
  });

  it('should maintain authentication state through multiple actions', () => {
    const mockUser = createMockUser();

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer' as const
    };

    // Login
    store.dispatch(loginStart());
    expect(store.getState().auth.isLoading).toBe(true);
    
    store.dispatch(loginSuccess({ user: mockUser, tokens: mockTokens }));
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.isLoading).toBe(false);
    
    // Update user
    const updatedUser = createMockUser({ userName: 'newusername' });
    store.dispatch(updateUser(updatedUser));
    expect(store.getState().auth.user?.userName).toBe('newusername');
    expect(store.getState().auth.isAuthenticated).toBe(true);
    
    // Logout
    store.dispatch(logout());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.setItem('uidam_admin_token', 'token');
    localStorageMock.setItem('uidam_user_profile', 'invalid-json{');
    
    const newStore = configureStore({
      reducer: {
        auth: authSlice.reducer
      }
    });

    const state = newStore.getState().auth;
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
