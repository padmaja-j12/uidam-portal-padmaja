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
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTheme } from './useTheme';
import { uiSlice } from '@store/slices/uiSlice';

const createMockStore = (initialTheme: 'light' | 'dark' = 'light') => {
  return configureStore({
    reducer: {
      ui: uiSlice.reducer,
    },
    preloadedState: {
      ui: {
        themeMode: initialTheme,
        sidebarOpen: true,
        loading: false,
        notification: null,
      },
    },
  });
};

describe('useTheme', () => {
  it('should return initial theme mode', () => {
    const store = createMockStore('light');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.themeMode).toBe('light');
  });

  it('should toggle theme from light to dark', () => {
    const store = createMockStore('light');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.toggleThemeMode();
    });

    expect(result.current.themeMode).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    const store = createMockStore('dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.toggleThemeMode();
    });

    expect(result.current.themeMode).toBe('light');
  });

  it('should set theme to dark using setTheme', () => {
    const store = createMockStore('light');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.themeMode).toBe('dark');
  });

  it('should set theme to light using setTheme', () => {
    const store = createMockStore('dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.themeMode).toBe('light');
  });

  it('should handle multiple toggles correctly', () => {
    const store = createMockStore('light');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('dark');

    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('light');

    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('dark');
  });

  it('should override toggle with setTheme', () => {
    const store = createMockStore('light');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.themeMode).toBe('light');
  });
});
