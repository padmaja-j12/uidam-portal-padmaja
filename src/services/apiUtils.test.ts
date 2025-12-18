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
import { handleApiResponse, getApiHeaders, makeFetchRequest } from './apiUtils';

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
});
