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
import {
  uiSlice,
  toggleTheme,
  setThemeMode,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  showNotification,
  hideNotification,
} from './uiSlice';

// Type for the test store
type TestStore = ReturnType<typeof configureStore<{
  ui: ReturnType<typeof uiSlice.reducer>;
}>>;

describe('uiSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ui: uiSlice.reducer
      }
    });
  });

  it('should have correct initial state', () => {
    const state = store.getState().ui;
    
    expect(state).toEqual({
      themeMode: 'light',
      sidebarOpen: true,
      loading: false,
      notification: null,
    });
  });

  describe('theme actions', () => {
    it('should toggle theme from light to dark', () => {
      store.dispatch(toggleTheme());
      const state = store.getState().ui;
      
      expect(state.themeMode).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      // First set to dark
      store.dispatch(setThemeMode('dark'));
      // Then toggle
      store.dispatch(toggleTheme());
      const state = store.getState().ui;
      
      expect(state.themeMode).toBe('light');
    });

    it('should set theme mode to light', () => {
      store.dispatch(setThemeMode('light'));
      const state = store.getState().ui;
      
      expect(state.themeMode).toBe('light');
    });

    it('should set theme mode to dark', () => {
      store.dispatch(setThemeMode('dark'));
      const state = store.getState().ui;
      
      expect(state.themeMode).toBe('dark');
    });
  });

  describe('sidebar actions', () => {
    it('should toggle sidebar from open to closed', () => {
      store.dispatch(toggleSidebar());
      const state = store.getState().ui;
      
      expect(state.sidebarOpen).toBe(false);
    });

    it('should toggle sidebar from closed to open', () => {
      // First close
      store.dispatch(setSidebarOpen(false));
      // Then toggle
      store.dispatch(toggleSidebar());
      const state = store.getState().ui;
      
      expect(state.sidebarOpen).toBe(true);
    });

    it('should set sidebar open to true', () => {
      store.dispatch(setSidebarOpen(true));
      const state = store.getState().ui;
      
      expect(state.sidebarOpen).toBe(true);
    });

    it('should set sidebar open to false', () => {
      store.dispatch(setSidebarOpen(false));
      const state = store.getState().ui;
      
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('loading actions', () => {
    it('should set loading to true', () => {
      store.dispatch(setLoading(true));
      const state = store.getState().ui;
      
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      store.dispatch(setLoading(false));
      const state = store.getState().ui;
      
      expect(state.loading).toBe(false);
    });

    it('should toggle loading state multiple times', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().ui.loading).toBe(true);
      
      store.dispatch(setLoading(false));
      expect(store.getState().ui.loading).toBe(false);
      
      store.dispatch(setLoading(true));
      expect(store.getState().ui.loading).toBe(true);
    });
  });

  describe('notification actions', () => {
    it('should show success notification', () => {
      const notification = {
        message: 'Operation successful',
        severity: 'success' as const
      };
      
      store.dispatch(showNotification(notification));
      const state = store.getState().ui;
      
      expect(state.notification).toEqual({
        open: true,
        message: 'Operation successful',
        severity: 'success',
      });
    });

    it('should show error notification', () => {
      const notification = {
        message: 'Something went wrong',
        severity: 'error' as const
      };
      
      store.dispatch(showNotification(notification));
      const state = store.getState().ui;
      
      expect(state.notification).toEqual({
        open: true,
        message: 'Something went wrong',
        severity: 'error',
      });
    });

    it('should show warning notification', () => {
      const notification = {
        message: 'Please be careful',
        severity: 'warning' as const
      };
      
      store.dispatch(showNotification(notification));
      const state = store.getState().ui;
      
      expect(state.notification).toEqual({
        open: true,
        message: 'Please be careful',
        severity: 'warning',
      });
    });

    it('should show info notification', () => {
      const notification = {
        message: 'For your information',
        severity: 'info' as const
      };
      
      store.dispatch(showNotification(notification));
      const state = store.getState().ui;
      
      expect(state.notification).toEqual({
        open: true,
        message: 'For your information',
        severity: 'info',
      });
    });

    it('should hide notification', () => {
      // First show a notification
      store.dispatch(showNotification({
        message: 'Test message',
        severity: 'info'
      }));
      
      // Then hide it
      store.dispatch(hideNotification());
      const state = store.getState().ui;
      
      expect(state.notification).toBeNull();
    });

    it('should replace existing notification with new one', () => {
      // Show first notification
      store.dispatch(showNotification({
        message: 'First message',
        severity: 'info'
      }));
      
      // Show second notification
      store.dispatch(showNotification({
        message: 'Second message',
        severity: 'error'
      }));
      
      const state = store.getState().ui;
      
      expect(state.notification).toEqual({
        open: true,
        message: 'Second message',
        severity: 'error',
      });
    });
  });

  describe('combined state changes', () => {
    it('should handle multiple state changes correctly', () => {
      // Change theme
      store.dispatch(toggleTheme());
      expect(store.getState().ui.themeMode).toBe('dark');
      
      // Close sidebar
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(false);
      
      // Show loading
      store.dispatch(setLoading(true));
      expect(store.getState().ui.loading).toBe(true);
      
      // Show notification
      store.dispatch(showNotification({
        message: 'Test',
        severity: 'success'
      }));
      expect(store.getState().ui.notification?.message).toBe('Test');
      
      // Verify all changes persisted
      const finalState = store.getState().ui;
      expect(finalState.themeMode).toBe('dark');
      expect(finalState.sidebarOpen).toBe(false);
      expect(finalState.loading).toBe(true);
      expect(finalState.notification?.open).toBe(true);
    });

    it('should maintain independent state for each property', () => {
      // Set various states
      store.dispatch(setThemeMode('dark'));
      store.dispatch(setSidebarOpen(false));
      store.dispatch(setLoading(true));
      store.dispatch(showNotification({
        message: 'Test notification',
        severity: 'warning'
      }));
      
      // Change theme but verify others remain unchanged
      store.dispatch(setThemeMode('light'));
      
      const state = store.getState().ui;
      expect(state.themeMode).toBe('light');
      expect(state.sidebarOpen).toBe(false);
      expect(state.loading).toBe(true);
      expect(state.notification?.message).toBe('Test notification');
    });
  });
});
