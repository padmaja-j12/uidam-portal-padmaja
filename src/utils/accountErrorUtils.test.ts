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
import { getAccountErrorMessage } from './accountErrorUtils';

describe('accountErrorUtils', () => {
  describe('getAccountErrorMessage', () => {
    describe('Error instance handling', () => {
      it('should return error message from Error instance', () => {
        const error = new Error('Custom error message');
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toBe('Custom error message');
      });

      it('should return error message for different operation types', () => {
        const error = new Error('Test error');
        const operations: Array<'create' | 'update' | 'delete' | 'fetch'> = [
          'create',
          'update',
          'delete',
          'fetch'
        ];

        operations.forEach(op => {
          const message = getAccountErrorMessage(error, { operation: op });
          expect(message).toBe('Test error');
        });
      });
    });

    describe('Status code handling - Create operation', () => {
      it('should return 400 message for create with invalid data', () => {
        const error = { status: 400 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toContain('Invalid account data');
      });

      it('should return 401 message for create unauthorized', () => {
        const error = { status: 401 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toContain('not authorized');
      });

      it('should return 403 message for create forbidden', () => {
        const error = { status: 403 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toContain('do not have permission');
      });

      it('should return 409 message for create conflict', () => {
        const error = { status: 409 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toContain('already exists');
      });

      it('should return 500 message for create server error', () => {
        const error = { status: 500 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toContain('Server error');
      });
    });

    describe('Status code handling - Update operation', () => {
      it('should return 400 message for update with invalid data', () => {
        const error = { status: 400 };
        const message = getAccountErrorMessage(error, {
          operation: 'update'
        });

        expect(message).toContain('Invalid account data');
      });

      it('should return 404 message for update not found', () => {
        const error = { status: 404 };
        const message = getAccountErrorMessage(error, {
          operation: 'update'
        });

        expect(message).toContain('Account not found');
      });
    });

    describe('Status code handling - Delete operation', () => {
      it('should return 400 message for delete with invalid request', () => {
        const error = { status: 400 };
        const message = getAccountErrorMessage(error, {
          operation: 'delete'
        });

        expect(message).toContain('Invalid request');
      });

      it('should return 404 message for delete not found', () => {
        const error = { status: 404 };
        const message = getAccountErrorMessage(error, {
          operation: 'delete'
        });

        expect(message).toContain('Account not found');
      });
    });

    describe('Status code handling - Fetch operation', () => {
      it('should return 400 message for fetch with invalid request', () => {
        const error = { status: 400 };
        const message = getAccountErrorMessage(error, {
          operation: 'fetch'
        });

        expect(message).toContain('Invalid request');
      });

      it('should return 401 message for fetch unauthorized', () => {
        const error = { status: 401 };
        const message = getAccountErrorMessage(error, {
          operation: 'fetch'
        });

        expect(message).toContain('not authorized');
      });

      it('should return 403 message for fetch forbidden', () => {
        const error = { status: 403 };
        const message = getAccountErrorMessage(error, {
          operation: 'fetch'
        });

        expect(message).toContain('do not have permission');
      });

      it('should return 404 message for fetch not found', () => {
        const error = { status: 404 };
        const message = getAccountErrorMessage(error, {
          operation: 'fetch'
        });

        expect(message).toContain('Account not found');
      });
    });

    describe('Custom messages handling', () => {
      it('should use custom messages when provided', () => {
        const error = { status: 400 };
        const customMessages = {
          400: 'Custom error message for 400'
        };
        const message = getAccountErrorMessage(error, {
          operation: 'create',
          customMessages
        });

        expect(message).toBe('Custom error message for 400');
      });

      it('should fall back to default when custom message not found', () => {
        const error = { status: 409 };
        const customMessages = {
          400: 'Custom 400 error'
        };
        const message = getAccountErrorMessage(error, {
          operation: 'create',
          customMessages
        });

        expect(message).toContain('already exists');
      });

      it('should override default messages with custom ones', () => {
        const error = { status: 500 };
        const customMessages = {
          500: 'Database connection failed'
        };
        const message = getAccountErrorMessage(error, {
          operation: 'create',
          customMessages
        });

        expect(message).toBe('Database connection failed');
      });
    });

    describe('Fallback handling', () => {
      it('should return fallback message for unknown status code', () => {
        const error = { status: 999 };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });

      it('should return fallback message for update operation', () => {
        const error = { status: 999 };
        const message = getAccountErrorMessage(error, {
          operation: 'update'
        });

        expect(message).toBe('Failed to update account');
      });

      it('should return fallback message for delete operation', () => {
        const error = { status: 999 };
        const message = getAccountErrorMessage(error, {
          operation: 'delete'
        });

        expect(message).toBe('Failed to delete account');
      });

      it('should return fallback message for fetch operation', () => {
        const error = { status: 999 };
        const message = getAccountErrorMessage(error, {
          operation: 'fetch'
        });

        expect(message).toBe('Failed to fetch account');
      });
    });

    describe('Edge cases', () => {
      it('should handle null error', () => {
        const message = getAccountErrorMessage(null, {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });

      it('should handle undefined error', () => {
        const message = getAccountErrorMessage(undefined, {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });

      it('should handle string error', () => {
        const message = getAccountErrorMessage('String error', {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });

      it('should handle number error', () => {
        const message = getAccountErrorMessage(404, {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });

      it('should handle object without status', () => {
        const error = { message: 'Some error', code: 'ERR_001' };
        const message = getAccountErrorMessage(error, {
          operation: 'create'
        });

        expect(message).toBe('Failed to create account');
      });
    });
  });
});
