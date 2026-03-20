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
// Mock tokenManager BEFORE importing apiUtils so fetchWithTokenRefresh picks it up
jest.mock('@/utils/tokenManager', () => ({
  handleTokenRefresh: jest.fn(),
  shouldRefreshToken: jest.fn().mockReturnValue(false),
}));

import { handleApiResponse, getApiHeaders, makeFetchRequest, fetchWithTokenRefresh, parseJsonSafe } from './apiUtils';
import { handleTokenRefresh, shouldRefreshToken } from '@/utils/tokenManager';

const mockShouldRefreshToken = shouldRefreshToken as jest.Mock;
const mockHandleTokenRefresh = handleTokenRefresh as jest.Mock;

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

// Mock crypto.randomUUID to return consistent value
const originalRandomUUID = crypto.randomUUID;

describe('apiUtils', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = jest.fn();
    // Mock crypto.randomUUID to return consistent test UUID
    crypto.randomUUID = jest.fn(() => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') as typeof crypto.randomUUID;
  });

  afterEach(() => {
    // Restore original randomUUID
    crypto.randomUUID = originalRandomUUID;
  });

  describe('handleApiResponse', () => {
    it('should parse successful JSON response', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      } as unknown as Response;

      const result = await handleApiResponse(mockResponse);
      
      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error for failed response with JSON error', async () => {
      const mockError = { message: 'Invalid request' };
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue(JSON.stringify(mockError))
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, 'Test')).rejects.toThrow('Invalid request');
      // Note: console.error is called internally but we don't assert on it as it's globally mocked
    });

    it('should throw error for failed response with error field', async () => {
      const mockError = { error: 'Not found' };
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValue(JSON.stringify(mockError))
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Not found');
    });

    it('should throw error for failed response with details field', async () => {
      const mockError = { details: 'Validation failed' };
      const mockResponse = {
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: jest.fn().mockResolvedValue(JSON.stringify(mockError))
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Validation failed');
    });

    it('should use text response when JSON parsing fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Server error occurred')
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Server error occurred');
    });

    it('should use default error message when no error details available', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: jest.fn().mockResolvedValue('')
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('HTTP error! status: 503');
    });

    it('should include context in error logging', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized access')
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse, 'Authentication')).rejects.toThrow('Unauthorized access');
      // Note: console.error is called internally with context but we don't assert on it as it's globally mocked
    });
  });

  describe('getApiHeaders', () => {
    it('should return basic headers without token', () => {
      const headers = getApiHeaders();
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Correlation-ID': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      });
    });

    it('should include Authorization header when token exists', () => {
      localStorageMock.setItem('uidam_admin_token', 'test-token-123');
      
      const headers = getApiHeaders();
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer test-token-123',
        'X-Correlation-ID': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      });
    });

    it('should not include Authorization header when token is null', () => {
      localStorageMock.removeItem('uidam_admin_token');
      
      const headers = getApiHeaders();
      
      expect(headers).not.toHaveProperty('Authorization');
    });
  });

  describe('makeFetchRequest', () => {
    it('should make successful request and return data', async () => {
      const mockData = { success: true, id: 1 };
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(mockData)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await makeFetchRequest('https://api.test.com/endpoint', {}, 'test operation');

      expect(result).toEqual({
        success: true,
        data: mockData
      });
      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }));
    });

    it('should handle failed request', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid data')
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await makeFetchRequest('https://api.test.com/endpoint', {}, 'create user');

      expect(result).toEqual({
        success: false,
        error: 'Failed to create user: Bad Request'
      });
    });

    it('should handle non-JSON response', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('Success')
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await makeFetchRequest('https://api.test.com/endpoint', {}, 'test operation');

      expect(result).toEqual({
        success: true,
        data: 'Success'
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const result = await makeFetchRequest('https://api.test.com/endpoint', {}, 'fetch data');

      expect(result).toEqual({
        success: false,
        error: 'Network failure'
      });
      // Note: console.error is called internally but we don't assert on it as it's globally mocked
    });

    it('should merge custom headers with default headers', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({})
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await makeFetchRequest(
        'https://api.test.com/endpoint',
        { headers: { 'X-Custom-Header': 'custom-value' } },
        'test'
      );

      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        })
      }));
    });

    it('should include Authorization header when token is present', async () => {
      localStorageMock.setItem('uidam_admin_token', 'auth-token');
      
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({})
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await makeFetchRequest('https://api.test.com/endpoint', {}, 'test');

      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer auth-token'
        })
      }));
    });

    it('should handle error when not instance of Error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('String error');

      const result = await makeFetchRequest('https://api.test.com/endpoint', {}, 'test operation');

      expect(result).toEqual({
        success: false,
        error: 'Failed to test operation'
      });
    });
  });

  describe('getApiHeaders — JWT user_id extraction', () => {
    it('extracts user_id from a valid JWT and adds user-id header', () => {
      // Build a minimal JWT with user_id claim
      const payload = btoa(JSON.stringify({ user_id: 'uid-42', sub: 'testuser' }));
      const fakeJwt = `header.${payload}.signature`;
      localStorageMock.setItem('uidam_admin_token', fakeJwt);

      const headers = getApiHeaders() as Record<string, string>;

      expect(headers['user-id']).toBe('uid-42');
    });

    it('falls back to userId claim when user_id is absent', () => {
      const payload = btoa(JSON.stringify({ userId: 'uid-99' }));
      const fakeJwt = `header.${payload}.signature`;
      localStorageMock.setItem('uidam_admin_token', fakeJwt);

      const headers = getApiHeaders() as Record<string, string>;

      expect(headers['user-id']).toBe('uid-99');
    });

    it('does not add user-id header when JWT has no id claim', () => {
      const payload = btoa(JSON.stringify({ name: 'John' }));
      const fakeJwt = `header.${payload}.signature`;
      localStorageMock.setItem('uidam_admin_token', fakeJwt);

      const headers = getApiHeaders() as Record<string, string>;

      expect(headers['user-id']).toBeUndefined();
    });

    it('proceeds without user-id when JWT is malformed', () => {
      localStorageMock.setItem('uidam_admin_token', 'not-a-valid-jwt');
      // Should not throw
      expect(() => getApiHeaders()).not.toThrow();
    });
  });

  describe('parseJsonSafe', () => {
    it('parses normal JSON without modification', () => {
      const json = JSON.stringify({ id: 123, name: 'Test' });
      const result = parseJsonSafe<{ id: number; name: string }>(json);
      expect(result).toEqual({ id: 123, name: 'Test' });
    });

    it('preserves large numeric id values as strings', () => {
      const json = '{"id": 12345678901234567890, "name": "BigId"}';
      const result = parseJsonSafe<{ id: string; name: string }>(json);
      // The large number should be a quoted string, not a corrupted float
      expect(typeof result.id).toBe('string');
      expect(result.id).toBe('12345678901234567890');
    });

    it('only quotes id values with 16+ digits', () => {
      const json = '{"id": 123456789012345, "name": "SmallId"}';
      const result = parseJsonSafe<{ id: number; name: string }>(json);
      // 15 digits — should not be quoted (stays as number)
      expect(typeof result.id).toBe('number');
    });
  });

  describe('fetchWithTokenRefresh', () => {
    beforeEach(() => {
      mockShouldRefreshToken.mockReturnValue(false);
      mockHandleTokenRefresh.mockResolvedValue(null);
    });

    it('makes request normally when token is not expired', async () => {
      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchWithTokenRefresh('https://api.test.com/data', { method: 'GET' });

      expect(result).toBe(mockResponse);
      expect(mockHandleTokenRefresh).not.toHaveBeenCalled();
    });

    it('refreshes token before request when token is expired', async () => {
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockResolvedValue('new-access-token');
      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchWithTokenRefresh('https://api.test.com/data', {});

      expect(mockHandleTokenRefresh).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('throws when token is expired and refresh fails', async () => {
      mockShouldRefreshToken.mockReturnValue(true);
      mockHandleTokenRefresh.mockResolvedValue(null); // refresh failed

      await expect(
        fetchWithTokenRefresh('https://api.test.com/data', {})
      ).rejects.toThrow('Authentication required - token refresh failed');
    });

    it('retries with new token on 401 response', async () => {
      mockHandleTokenRefresh.mockResolvedValue('refreshed-token');
      const unauthorizedResponse = { ok: false, status: 401 };
      const retryResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce(retryResponse);

      const result = await fetchWithTokenRefresh('https://api.test.com/protected', {});

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe(retryResponse);
    });

    it('throws when 401 and token refresh fails during retry', async () => {
      mockHandleTokenRefresh.mockResolvedValue(null);
      const unauthorizedResponse = { ok: false, status: 401 };
      (global.fetch as jest.Mock).mockResolvedValue(unauthorizedResponse);

      await expect(
        fetchWithTokenRefresh('https://api.test.com/protected', {})
      ).rejects.toThrow('Authentication failed - please log in again');
    });
  });

  describe('decodeJwtToken', () => {
    // Import the function (it's not imported at the top — add a local import)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { decodeJwtToken } = require('./apiUtils');

    it('returns the decoded payload from a valid JWT', () => {
      // Build a minimal JWT: header.payload.signature
      const payload = { sub: 'user-1', tenantId: 'tenant-abc', exp: 9999999999 };
      const encoded = btoa(JSON.stringify(payload));
      const token = `eyJhbGciOiJSUzI1NiJ9.${encoded}.signature`;

      const result = decodeJwtToken(token);

      expect(result).toMatchObject({ sub: 'user-1', tenantId: 'tenant-abc' });
    });

    it('returns null for a malformed token', () => {
      const result = decodeJwtToken('not.a.valid.jwt.at.all');
      expect(result).toBeNull();
    });

    it('returns null for a token with non-base64 payload', () => {
      const result = decodeJwtToken('header.!!!invalid!!!.sig');
      expect(result).toBeNull();
    });
  });

  describe('getTenantIdFromToken', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getTenantIdFromToken } = require('./apiUtils');

    it('returns null when no token is stored', () => {
      localStorageMock.clear();
      expect(getTenantIdFromToken()).toBeNull();
    });

    it('returns tenantId field from JWT payload', () => {
      const payload = { sub: 'user-1', tenantId: 'tenant-xyz' };
      const token = `hdr.${btoa(JSON.stringify(payload))}.sig`;
      localStorageMock.setItem('uidam_admin_token', token);

      expect(getTenantIdFromToken()).toBe('tenant-xyz');
    });

    it('returns tenant_id field when tenantId is absent', () => {
      const payload = { sub: 'user-1', tenant_id: 'tid-123' };
      const token = `hdr.${btoa(JSON.stringify(payload))}.sig`;
      localStorageMock.setItem('uidam_admin_token', token);

      expect(getTenantIdFromToken()).toBe('tid-123');
    });

    it('returns null when neither tenantId nor tenant_id is present', () => {
      const payload = { sub: 'user-1' };
      const token = `hdr.${btoa(JSON.stringify(payload))}.sig`;
      localStorageMock.setItem('uidam_admin_token', token);

      expect(getTenantIdFromToken()).toBeNull();
    });
  });
});
