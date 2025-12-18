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
/**
 * Utility functions for JsonPatch operations used in V2 API calls
 */

export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: any;
}

/**
 * Creates a JsonPatch operation to change user status
 */
export const createStatusChangeOperation = (newStatus: string): JsonPatchOperation => ({
  op: 'replace',
  path: '/status',
  value: newStatus
});

/**
 * Creates a JsonPatch operation to add a role to an account
 */
export const createAddRoleOperation = (accountId: string, roleName: string): JsonPatchOperation => ({
  op: 'add',
  path: `/account/${accountId}/roleName`,
  value: roleName
});

/**
 * Creates a JsonPatch operation to remove a role from an account
 * For REMOVE operations, the role name should be in the path, not the value
 */
export const createRemoveRoleOperation = (accountId: string, roleName: string): JsonPatchOperation => ({
  op: 'remove',
  path: `/account/${accountId}/${roleName}`,
  value: null
});

/**
 * Validates a JsonPatch operation for correctness
 */
export const validateJsonPatchOperation = (operation: JsonPatchOperation): boolean => {
  if (!operation.path || !['add', 'remove', 'replace'].includes(operation.op)) {
    return false;
  }
  
  // Status operations must have a value
  if (operation.path === '/status' && !operation.value) {
    return false;
  }
  
  // Add operations must have a value
  if (operation.op === 'add' && !operation.value) {
    return false;
  }
  
  // Remove operations don't need a value (role is in the path)
  return true;
};

/**
 * Validates an array of JsonPatch operations
 */
export const validateJsonPatchOperations = (operations: JsonPatchOperation[]): {
  isValid: boolean;
  invalidOperations: JsonPatchOperation[];
} => {
  const invalidOperations = operations.filter(op => !validateJsonPatchOperation(op));
  return {
    isValid: invalidOperations.length === 0,
    invalidOperations
  };
};
