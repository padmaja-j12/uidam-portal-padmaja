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
 * Test file for types/index.ts
 * 
 * Note: This file contains only TypeScript type definitions and interfaces.
 * Type definitions don't require runtime tests as they are compile-time only.
 * 
 * Coverage: TypeScript types are validated during compilation, not at runtime.
 * The TypeScript compiler ensures type safety across the codebase.
 */

import {
  User,
  UserV2,
  Role,
  Scope,
  Account,
  OAuthClient,
  UserStatus,
  AccountStatus,
  ClientStatus,
  ApprovalType,
  ApprovalStatus,
} from './index';

describe('Type Definitions', () => {
  it('should have valid type definitions (compile-time check)', () => {
    // This test passes if the file compiles successfully
    // TypeScript ensures type correctness at compile time
    expect(true).toBe(true);
  });

  describe('Enum Values', () => {
    it('should export UserStatus enum values', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.PENDING).toBe('PENDING');
      expect(UserStatus.BLOCKED).toBe('BLOCKED');
      expect(UserStatus.REJECTED).toBe('REJECTED');
      expect(UserStatus.DELETED).toBe('DELETED');
      expect(UserStatus.DEACTIVATED).toBe('DEACTIVATED');
    });

    it('should export AccountStatus enum values', () => {
      expect(AccountStatus.ACTIVE).toBe('ACTIVE');
      expect(AccountStatus.INACTIVE).toBe('INACTIVE');
      expect(AccountStatus.SUSPENDED).toBe('SUSPENDED');
      expect(AccountStatus.DELETED).toBe('DELETED');
    });

    it('should export ClientStatus enum values', () => {
      expect(ClientStatus.ACTIVE).toBe('ACTIVE');
      expect(ClientStatus.INACTIVE).toBe('INACTIVE');
      expect(ClientStatus.SUSPENDED).toBe('SUSPENDED');
    });

    it('should export ApprovalType enum values', () => {
      expect(ApprovalType.USER_REGISTRATION).toBe('USER_REGISTRATION');
      expect(ApprovalType.ROLE_ASSIGNMENT).toBe('ROLE_ASSIGNMENT');
      expect(ApprovalType.SCOPE_ASSIGNMENT).toBe('SCOPE_ASSIGNMENT');
      expect(ApprovalType.ACCOUNT_ACCESS).toBe('ACCOUNT_ACCESS');
    });

    it('should export ApprovalStatus enum values', () => {
      expect(ApprovalStatus.PENDING).toBe('PENDING');
      expect(ApprovalStatus.APPROVED).toBe('APPROVED');
      expect(ApprovalStatus.REJECTED).toBe('REJECTED');
    });
  });

  describe('Type Usage Examples', () => {
    it('should allow creating User objects with correct types', () => {
      const mockUser: User = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        isExternalUser: false,
        isEmailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(mockUser.userName).toBe('testuser');
      expect(mockUser.status).toBe('ACTIVE');
    });

    it('should allow creating Role objects with correct types', () => {
      const mockRole: Role = {
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        scopes: [],
      };

      expect(mockRole.id).toBe(1);
      expect(mockRole.name).toBe('Admin');
    });

    it('should allow creating Scope objects with correct types', () => {
      const mockScope: Scope = {
        id: '1',
        name: 'read',
        description: 'Read access',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isSystemScope: false,
        administrative: false,
        predefined: true,
      };

      expect(mockScope.name).toBe('read');
      expect(mockScope.predefined).toBe(true);
    });

    it('should allow creating Account objects with correct types', () => {
      const mockAccount: Account = {
        id: '1',
        accountName: 'Test Account',
        roles: ['Admin'],
        status: AccountStatus.ACTIVE,
        createdBy: 'admin',
        createDate: '2024-01-01T00:00:00Z',
      };

      expect(mockAccount.accountName).toBe('Test Account');
      expect(mockAccount.status).toBe('ACTIVE');
    });

    it('should allow creating OAuthClient objects with correct types', () => {
      const mockClient: OAuthClient = {
        clientId: 'client-1',
        clientName: 'Test Client',
        grantTypes: ['authorization_code'],
        scopes: ['openid'],
        redirectUris: ['https://example.com/callback'],
        status: ClientStatus.ACTIVE,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(mockClient.clientId).toBe('client-1');
      expect(mockClient.status).toBe('ACTIVE');
    });

    it('should allow UserV2 to extend User with accountRoleMappings', () => {
      const mockUserV2: UserV2 = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        isExternalUser: false,
        isEmailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        accountRoleMappings: [
          {
            accountId: 'acc-1',
            accountName: 'Account 1',
            roleIds: ['1'],
            roleNames: ['Admin'],
          },
        ],
      };

      expect(mockUserV2.accountRoleMappings).toHaveLength(1);
      expect(mockUserV2.accountRoleMappings[0].accountId).toBe('acc-1');
    });
  });
});
