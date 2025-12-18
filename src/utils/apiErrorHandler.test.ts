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
import { handleApiError } from './apiErrorHandler';
import { logger } from './logger';

jest.mock('./logger');

describe('apiErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should throw error after logging response error details', () => {
      const error = new Error('Test error');
      const response = {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Invalid request' }
      };
      (error as any).response = response;

      expect(() => handleApiError(error, 'TEST')).toThrow('Test error');
      expect(logger.error).toHaveBeenCalledWith('=== TEST SERVICE ERROR DETAILS ===');
      expect(logger.error).toHaveBeenCalledWith('Error message:', 'Test error');
      expect(logger.error).toHaveBeenCalledWith('Response status:', 400);
      expect(logger.error).toHaveBeenCalledWith('Response statusText:', 'Bad Request');
      expect(logger.error).toHaveBeenCalledWith('Response data:', response.data);
    });

    it('should log request error details when response is missing', () => {
      const error = new Error('Network error');
      const request = { readyState: 0, status: 0, statusText: '', responseURL: '' };
      const config = {
        url: 'https://api.example.com/test',
        method: 'GET',
        baseURL: 'https://api.example.com',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        data: null
      };
      (error as any).request = request;
      (error as any).config = config;

      expect(() => handleApiError(error, 'API')).toThrow('Network error');
      expect(logger.debug).toHaveBeenCalledWith('Request error details:', expect.objectContaining({
        url: 'https://api.example.com/test',
        method: 'GET'
      }));
      expect(logger.debug).toHaveBeenCalledWith('XMLHttpRequest details:', expect.objectContaining({
        readyState: 0,
        status: 0
      }));
    });

    it('should log error code and name', () => {
      const error = new Error('Test error');
      error.name = 'CustomError';
      (error as any).code = 'ERR_NETWORK';
      (error as any).response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {}
      };

      expect(() => handleApiError(error)).toThrow();
      expect(logger.error).toHaveBeenCalledWith('Error code:', 'ERR_NETWORK');
      expect(logger.error).toHaveBeenCalledWith('Error name:', 'CustomError');
    });

    it('should use default context value', () => {
      const error = new Error('Default context test');
      (error as any).response = { status: 500, statusText: 'Error', data: {} };

      expect(() => handleApiError(error)).toThrow();
      expect(logger.error).toHaveBeenCalledWith('=== API SERVICE ERROR DETAILS ===');
    });

    it('should use custom context value', () => {
      const error = new Error('Custom context test');
      (error as any).response = { status: 500, statusText: 'Error', data: {} };

      expect(() => handleApiError(error, 'CUSTOM')).toThrow();
      expect(logger.error).toHaveBeenCalledWith('=== CUSTOM SERVICE ERROR DETAILS ===');
    });

    it('should log response data keys when response data is an object', () => {
      const error = new Error('Test error');
      const responseData = { message: 'Error', code: 'ERR_001', details: {} };
      (error as any).response = {
        status: 400,
        statusText: 'Bad Request',
        data: responseData
      };

      expect(() => handleApiError(error)).toThrow();
      expect(logger.debug).toHaveBeenCalledWith('Response data type:', 'object');
      expect(logger.debug).toHaveBeenCalledWith('Response data keys:', ['message', 'code', 'details']);
      expect(logger.debug).toHaveBeenCalledWith('Response data stringified:', JSON.stringify(responseData, null, 2));
    });

    it('should not log response data keys when response data is not an object', () => {
      const error = new Error('Test error');
      (error as any).response = {
        status: 400,
        statusText: 'Bad Request',
        data: 'String error message'
      };

      expect(() => handleApiError(error)).toThrow();
      expect(logger.debug).toHaveBeenCalledWith('Response data type:', 'string');
      // Should not call with keys when data is a string
      expect(logger.debug).not.toHaveBeenCalledWith(
        'Response data keys:',
        expect.anything()
      );
    });

    it('should log end marker after error logging', () => {
      const error = new Error('Test error');
      (error as any).response = { status: 500, statusText: 'Error', data: {} };

      expect(() => handleApiError(error)).toThrow();
      expect(logger.error).toHaveBeenCalledWith('=== END ERROR DETAILS ===');
    });

    it('should handle error without response or request', () => {
      const error = new Error('Generic error');

      expect(() => handleApiError(error)).toThrow();
      expect(logger.error).toHaveBeenCalledWith('Error message:', 'Generic error');
    });

    it('should handle error with request but no config', () => {
      const error = new Error('Request error');
      const request = { readyState: 4, status: 0, statusText: '', responseURL: '' };
      (error as any).request = request;
      (error as any).config = undefined;

      expect(() => handleApiError(error)).toThrow();
      expect(logger.debug).toHaveBeenCalledWith('Request error details:', expect.objectContaining({
        url: undefined
      }));
    });
  });
});
