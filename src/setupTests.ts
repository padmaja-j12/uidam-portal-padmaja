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
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Polyfill for TextEncoder and TextDecoder (needed for crypto operations in tests)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill for crypto (needed for PKCE operations in tests)
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: false,
  configurable: false,
});

// Polyfill for btoa and atob (needed for base64 encoding in tests)
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  // Mock implementation - no actual observation needed in tests
  disconnect(): void {
    // No-op: Mock disconnect method
  }
  observe(): void {
    // No-op: Mock observe method
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {
    // No-op: Mock unobserve method
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  // Mock implementation - no actual observation needed in tests
  disconnect(): void {
    // No-op: Mock disconnect method
  }
  observe(): void {
    // No-op: Mock observe method
  }
  unobserve(): void {
    // No-op: Mock unobserve method
  }
} as any;

// Suppress console errors/warnings/logs in tests (optional - remove if you want to see all errors)
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Suppress expected console.error messages during tests
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('User filter API error:') ||
       args[0].includes('Password reset request failed:') ||
       args[0].includes('Failed to decode JWT token:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Suppress expected console.warn messages during tests
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Could not extract user_id from token') ||
       args[0].includes('Could not extract user_id from token for password reset'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Suppress expected console.log messages during tests
  console.log = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Received 401, attempting token refresh') ||
       args[0].includes('Decoded user_id from token') ||
       args[0].includes('Added user-id header'))
    ) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});
