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
import {
  createStatusChangeOperation,
  createAddRoleOperation,
  createRemoveRoleOperation,
  validateJsonPatchOperation,
  validateJsonPatchOperations,
  JsonPatchOperation
} from './jsonPatchUtils';

describe('jsonPatchUtils', () => {
  describe('createStatusChangeOperation', () => {
    it('should create status change operation', () => {
      const operation = createStatusChangeOperation('ACTIVE');

      expect(operation).toEqual({
        op: 'replace',
        path: '/status',
        value: 'ACTIVE'
      });
    });

    it('should work with different status values', () => {
      const statuses = ['INACTIVE', 'PENDING', 'ARCHIVED'];

      statuses.forEach(status => {
        const operation = createStatusChangeOperation(status);
        expect(operation.value).toBe(status);
        expect(operation.path).toBe('/status');
        expect(operation.op).toBe('replace');
      });
    });
  });

  describe('createAddRoleOperation', () => {
    it('should create add role operation', () => {
      const operation = createAddRoleOperation('acc-001', 'ADMIN');

      expect(operation).toEqual({
        op: 'add',
        path: '/account/acc-001/roleName',
        value: 'ADMIN'
      });
    });

    it('should handle different account IDs and roles', () => {
      const operation = createAddRoleOperation('acc-123', 'USER');

      expect(operation.path).toBe('/account/acc-123/roleName');
      expect(operation.value).toBe('USER');
      expect(operation.op).toBe('add');
    });

    it('should handle special characters in account ID', () => {
      const operation = createAddRoleOperation('acc-2024-001', 'VIEWER');

      expect(operation.path).toContain('acc-2024-001');
    });
  });

  describe('createRemoveRoleOperation', () => {
    it('should create remove role operation', () => {
      const operation = createRemoveRoleOperation('acc-001', 'ADMIN');

      expect(operation).toEqual({
        op: 'remove',
        path: '/account/acc-001/ADMIN',
        value: null
      });
    });

    it('should include role name in path', () => {
      const operation = createRemoveRoleOperation('acc-002', 'USER');

      expect(operation.path).toContain('acc-002');
      expect(operation.path).toContain('USER');
    });

    it('should always have null value', () => {
      const operation = createRemoveRoleOperation('acc-001', 'ADMIN');

      expect(operation.value).toBeNull();
    });
  });

  describe('validateJsonPatchOperation', () => {
    it('should validate valid add operation', () => {
      const operation: JsonPatchOperation = {
        op: 'add',
        path: '/account/acc-001/roleName',
        value: 'ADMIN'
      };

      expect(validateJsonPatchOperation(operation)).toBe(true);
    });

    it('should validate valid remove operation', () => {
      const operation: JsonPatchOperation = {
        op: 'remove',
        path: '/account/acc-001/ADMIN'
      };

      expect(validateJsonPatchOperation(operation)).toBe(true);
    });

    it('should validate valid replace operation with status', () => {
      const operation: JsonPatchOperation = {
        op: 'replace',
        path: '/status',
        value: 'ACTIVE'
      };

      expect(validateJsonPatchOperation(operation)).toBe(true);
    });

    it('should reject operation without path', () => {
      const operation: JsonPatchOperation = {
        op: 'add',
        path: ''
      };

      expect(validateJsonPatchOperation(operation)).toBe(false);
    });

    it('should reject operation with invalid op', () => {
      const operation = {
        op: 'invalid',
        path: '/account/acc-001/ADMIN',
        value: 'ADMIN'
      } as unknown as JsonPatchOperation;

      expect(validateJsonPatchOperation(operation)).toBe(false);
    });

    it('should reject status operation without value', () => {
      const operation: JsonPatchOperation = {
        op: 'replace',
        path: '/status'
      };

      expect(validateJsonPatchOperation(operation)).toBe(false);
    });

    it('should reject add operation without value', () => {
      const operation: JsonPatchOperation = {
        op: 'add',
        path: '/account/acc-001/roleName'
      };

      expect(validateJsonPatchOperation(operation)).toBe(false);
    });

    it('should allow remove operation without value', () => {
      const operation: JsonPatchOperation = {
        op: 'remove',
        path: '/account/acc-001/ADMIN'
      };

      expect(validateJsonPatchOperation(operation)).toBe(true);
    });

    it('should validate replace operation on non-status path', () => {
      const operation: JsonPatchOperation = {
        op: 'replace',
        path: '/account/acc-001/roleName',
        value: 'USER'
      };

      expect(validateJsonPatchOperation(operation)).toBe(true);
    });
  });

  describe('validateJsonPatchOperations', () => {
    it('should return isValid true for all valid operations', () => {
      const operations: JsonPatchOperation[] = [
        { op: 'add', path: '/account/acc-001/roleName', value: 'ADMIN' },
        { op: 'remove', path: '/account/acc-001/USER' },
        { op: 'replace', path: '/status', value: 'ACTIVE' }
      ];

      const result = validateJsonPatchOperations(operations);

      expect(result.isValid).toBe(true);
      expect(result.invalidOperations).toHaveLength(0);
    });

    it('should identify invalid operations', () => {
      const operations: JsonPatchOperation[] = [
        { op: 'add', path: '/account/acc-001/roleName', value: 'ADMIN' },
        { op: 'add', path: '/account/acc-001/roleName' }, // Missing value
        { op: 'remove', path: '/account/acc-001/USER' }
      ];

      const result = validateJsonPatchOperations(operations);

      expect(result.isValid).toBe(false);
      expect(result.invalidOperations).toHaveLength(1);
    });

    it('should return empty invalid operations array when all valid', () => {
      const operations: JsonPatchOperation[] = [
        { op: 'replace', path: '/status', value: 'INACTIVE' }
      ];

      const result = validateJsonPatchOperations(operations);

      expect(result.invalidOperations).toEqual([]);
    });

    it('should handle empty operations array', () => {
      const result = validateJsonPatchOperations([]);

      expect(result.isValid).toBe(true);
      expect(result.invalidOperations).toHaveLength(0);
    });

    it('should identify all invalid operations in mixed array', () => {
      const operations: JsonPatchOperation[] = [
        { op: 'add', path: '' }, // Invalid: no path
        { op: 'replace', path: '/status' }, // Invalid: no value for status
        { op: 'add', path: '/test' }, // Invalid: no value for add
        { op: 'remove', path: '/account/acc-001/ADMIN' } // Valid
      ];

      const result = validateJsonPatchOperations(operations);

      expect(result.isValid).toBe(false);
      expect(result.invalidOperations).toHaveLength(3);
    });
  });
});
