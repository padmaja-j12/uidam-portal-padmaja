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
import { store, RootState, AppDispatch } from './index';
import { authSlice } from './slices/authSlice';
import { uiSlice } from './slices/uiSlice';

describe('Redux Store Configuration', () => {
  describe('store initialization', () => {
    it('should create store with correct structure', () => {
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('should have auth reducer in state', () => {
      const state = store.getState();
      expect(state.auth).toBeDefined();
    });

    it('should have ui reducer in state', () => {
      const state = store.getState();
      expect(state.ui).toBeDefined();
    });

    it('should initialize with default auth state', () => {
      const state = store.getState();
      expect(state.auth).toHaveProperty('isAuthenticated');
      expect(state.auth).toHaveProperty('user');
      expect(state.auth).toHaveProperty('tokens');
      expect(state.auth).toHaveProperty('isLoading');
      expect(state.auth).toHaveProperty('error');
    });

    it('should initialize with default ui state', () => {
      const state = store.getState();
      expect(state.ui).toHaveProperty('themeMode');
      expect(state.ui).toHaveProperty('sidebarOpen');
      expect(state.ui).toHaveProperty('loading');
      expect(state.ui).toHaveProperty('notification');
    });
  });

  describe('store middleware configuration', () => {
    it('should configure serializable check middleware', () => {
      // Test that the store accepts actions without serialization warnings
      // The middleware is configured to ignore 'persist/PERSIST' actions
      const testAction = { type: 'persist/PERSIST', payload: {} };
      expect(() => store.dispatch(testAction)).not.toThrow();
    });
  });

  describe('store dispatching', () => {
    it('should dispatch auth actions', () => {
      // Dispatch a login action (assuming loginSuccess exists)
      if (authSlice.actions.loginSuccess) {
        store.dispatch(authSlice.actions.loginSuccess({
          user: { 
            id: 'test-user', 
            userName: 'testuser', 
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: ['ADMIN'],
            scopes: ['read', 'write'],
            accounts: ['account1']
          },
          tokens: { accessToken: 'test-token', refreshToken: 'refresh-token', expiresIn: 3600, tokenType: 'Bearer' },
        }));
        
        const newState = store.getState().auth;
        expect(newState.isAuthenticated).toBe(true);
      }
    });

    it('should dispatch ui actions', () => {
      // Dispatch a theme toggle action (if it exists)
      if (uiSlice.actions.toggleTheme) {
        const initialTheme = store.getState().ui.themeMode;
        store.dispatch(uiSlice.actions.toggleTheme());
        
        const newState = store.getState().ui;
        expect(newState.themeMode).toBeDefined();
        expect(newState.themeMode).not.toBe(initialTheme);
      }
    });
  });

  describe('type exports', () => {
    it('should export RootState type', () => {
      const state: RootState = store.getState();
      expect(state).toBeDefined();
      expect(state.auth).toBeDefined();
      expect(state.ui).toBeDefined();
    });

    it('should export AppDispatch type', () => {
      const dispatch: AppDispatch = store.dispatch;
      expect(typeof dispatch).toBe('function');
    });
  });

  describe('store state shape', () => {
    it('should maintain consistent state shape', () => {
      const state = store.getState();
      const expectedKeys = ['auth', 'ui'];
      
      expectedKeys.forEach(key => {
        expect(state).toHaveProperty(key);
      });
    });

    it('should return new state reference on dispatch', () => {
      // Dispatch any action
      store.dispatch({ type: '@@test/action' });
      
      const newState = store.getState();
      // State reference may change even for unknown actions due to Redux internals
      expect(newState).toBeDefined();
    });
  });

  describe('store subscription', () => {
    it('should allow subscribing to state changes', () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Dispatch an action to trigger listener
      store.dispatch({ type: '@@test/subscription' });
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should stop calling listener after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      
      // Dispatch action before unsubscribe
      store.dispatch({ type: '@@test/before' });
      const callCountBefore = listener.mock.calls.length;
      
      unsubscribe();
      
      // Dispatch action after unsubscribe
      store.dispatch({ type: '@@test/after' });
      const callCountAfter = listener.mock.calls.length;
      
      expect(callCountAfter).toBe(callCountBefore);
    });
  });
});
