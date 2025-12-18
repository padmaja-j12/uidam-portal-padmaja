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
  processUserAccount,
  initializeAccountRoleMappings,
  calculateAccountRoleOperations,
  canApproveAccountRoleChanges,
  getAccountToggleTooltip,
  updateRoleSelection,
  toggleAccountSelection,
  loadAvailableAccounts,
  loadAvailableRoles,
  AccountRoleMapping
} from './accountRoleUtils';
import { Account, AccountService } from '../services/accountService';
import { AccountStatus } from '../types';
import { RoleService } from '../services/role.service';
import { User as ServiceUser } from '../services/userService';

jest.mock('../services/accountService');
jest.mock('../services/role.service');
jest.mock('./logger');

describe('accountRoleUtils', () => {
  const mockAccount: Account = {
    id: 'acc-001',
    accountName: 'Test Account',
    roles: ['ADMIN', 'USER'],
    status: AccountStatus.ACTIVE,
    createdBy: 'admin',
    createDate: new Date().toISOString()
  };

  const mockUser: ServiceUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    userName: 'johndoe',
    status: 'ACTIVE',
    accounts: [
      { account: 'Test Account', roles: ['ADMIN'] }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processUserAccount', () => {
    it('should add found account to mappings', () => {
      const mappings: AccountRoleMapping[] = [];
      const processedAccountIds = new Set<string>();

      processUserAccount(
        { account: 'Test Account', roles: ['ADMIN'] },
        [mockAccount],
        mappings,
        processedAccountIds
      );

      expect(mappings).toHaveLength(1);
      expect(mappings[0]).toEqual({
        accountId: mockAccount.id,
        accountName: mockAccount.accountName,
        originalRoles: ['ADMIN'],
        selectedRoles: ['ADMIN'],
        defaultRoles: mockAccount.roles,
        isNewAccount: false,
        isDefaultAccount: false,
        isAccountSelected: true
      });
      expect(processedAccountIds.has(mockAccount.id)).toBe(true);
    });

    it('should add account by ID if name not found', () => {
      const mappings: AccountRoleMapping[] = [];
      const processedAccountIds = new Set<string>();

      processUserAccount(
        { account: 'acc-001', roles: ['USER'] },
        [mockAccount],
        mappings,
        processedAccountIds
      );

      expect(mappings).toHaveLength(1);
      expect(mappings[0].accountId).toBe('acc-001');
      expect(mappings[0].isNewAccount).toBe(false);
    });

    it('should handle account not found in available accounts', () => {
      const mappings: AccountRoleMapping[] = [];
      const processedAccountIds = new Set<string>();

      processUserAccount(
        { account: 'Unknown Account', roles: ['ADMIN'] },
        [mockAccount],
        mappings,
        processedAccountIds
      );

      expect(mappings).toHaveLength(1);
      expect(mappings[0].accountId).toBe('Unknown Account');
      expect(mappings[0].defaultRoles).toEqual([]);
      expect(processedAccountIds.has('Unknown Account')).toBe(true);
    });
  });

  describe('initializeAccountRoleMappings', () => {
    it('should initialize mappings for user with existing accounts', () => {
      const mappings = initializeAccountRoleMappings(mockUser, [mockAccount]);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].accountId).toBe(mockAccount.id);
      expect(mappings[0].isNewAccount).toBe(false);
      expect(mappings[0].isAccountSelected).toBe(true);
    });

    it('should add available accounts not in user accounts', () => {
      const mockAccount2: Account = {
        id: 'acc-002',
        accountName: 'Other Account',
        roles: ['VIEWER'],
        status: AccountStatus.ACTIVE,
        createdBy: 'admin',
        createDate: new Date().toISOString()
      };

      const mappings = initializeAccountRoleMappings(mockUser, [mockAccount, mockAccount2]);

      expect(mappings).toHaveLength(2);
      const newAccountMapping = mappings.find(m => m.accountId === 'acc-002');
      expect(newAccountMapping?.isNewAccount).toBe(true);
      expect(newAccountMapping?.isAccountSelected).toBe(false);
    });

    it('should handle user with no existing accounts', () => {
      const userWithoutAccounts: ServiceUser = {
        ...mockUser,
        accounts: []
      };

      const mappings = initializeAccountRoleMappings(userWithoutAccounts, [mockAccount]);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].isNewAccount).toBe(true);
      expect(mappings[0].isAccountSelected).toBe(false);
    });

    it('should handle user with undefined accounts', () => {
      const userWithUndefinedAccounts: ServiceUser = {
        ...mockUser,
        accounts: undefined
      };

      const mappings = initializeAccountRoleMappings(userWithUndefinedAccounts, [mockAccount]);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].isNewAccount).toBe(true);
    });
  });

  describe('calculateAccountRoleOperations', () => {
    it('should calculate role additions when roles are selected', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: ['USER'],
          selectedRoles: ['USER', 'ADMIN'],
          defaultRoles: ['ADMIN', 'USER'],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const operations = calculateAccountRoleOperations(mappings);

      expect(operations).toContainEqual(
        expect.objectContaining({
          op: 'add',
          path: expect.stringContaining('acc-001'),
          value: 'ADMIN'
        })
      );
    });

    it('should calculate role removals when roles are deselected', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: ['USER', 'ADMIN'],
          selectedRoles: ['USER'],
          defaultRoles: ['ADMIN', 'USER'],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const operations = calculateAccountRoleOperations(mappings);

      expect(operations).toContainEqual(
        expect.objectContaining({
          op: 'remove',
          path: expect.stringContaining('acc-001')
        })
      );
    });

    it('should remove all roles when account is deselected', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: ['USER', 'ADMIN'],
          selectedRoles: ['USER', 'ADMIN'],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: false
        }
      ];

      const operations = calculateAccountRoleOperations(mappings);

      expect(operations).toHaveLength(2);
      expect(operations.every(op => op.op === 'remove')).toBe(true);
    });

    it('should handle no changes scenario', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: ['USER'],
          selectedRoles: ['USER'],
          defaultRoles: ['ADMIN', 'USER'],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const operations = calculateAccountRoleOperations(mappings);

      expect(operations).toHaveLength(0);
    });
  });

  describe('canApproveAccountRoleChanges', () => {
    it('should return true when at least one account is selected', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: [],
          selectedRoles: ['ADMIN'],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      expect(canApproveAccountRoleChanges(mappings)).toBe(true);
    });

    it('should return false when no accounts are selected', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: [],
          selectedRoles: [],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: false
        }
      ];

      expect(canApproveAccountRoleChanges(mappings)).toBe(false);
    });

    it('should return false for empty mappings', () => {
      expect(canApproveAccountRoleChanges([])).toBe(false);
    });
  });

  describe('getAccountToggleTooltip', () => {
    it('should return removal tooltip when account is selected', () => {
      const mapping: AccountRoleMapping = {
        accountId: 'acc-001',
        accountName: 'Test Account',
        originalRoles: [],
        selectedRoles: ['ADMIN'],
        defaultRoles: [],
        isNewAccount: false,
        isDefaultAccount: false,
        isAccountSelected: true
      };

      const tooltip = getAccountToggleTooltip(mapping);

      expect(tooltip).toContain('remove');
    });

    it('should return grant tooltip when account is not selected', () => {
      const mapping: AccountRoleMapping = {
        accountId: 'acc-001',
        accountName: 'Test Account',
        originalRoles: [],
        selectedRoles: [],
        defaultRoles: [],
        isNewAccount: false,
        isDefaultAccount: false,
        isAccountSelected: false
      };

      const tooltip = getAccountToggleTooltip(mapping);

      expect(tooltip).toContain('grant');
    });
  });

  describe('updateRoleSelection', () => {
    it('should update role selection for specific account', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: [],
          selectedRoles: ['USER'],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const updated = updateRoleSelection(mappings, 'acc-001', ['ADMIN', 'USER']);

      expect(updated[0].selectedRoles).toEqual(['ADMIN', 'USER']);
    });

    it('should not affect other accounts', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account 1',
          originalRoles: [],
          selectedRoles: ['USER'],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        },
        {
          accountId: 'acc-002',
          accountName: 'Test Account 2',
          originalRoles: [],
          selectedRoles: ['VIEWER'],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const updated = updateRoleSelection(mappings, 'acc-001', ['ADMIN']);

      expect(updated[0].selectedRoles).toEqual(['ADMIN']);
      expect(updated[1].selectedRoles).toEqual(['VIEWER']);
    });
  });

  describe('toggleAccountSelection', () => {
    it('should set selected roles to default roles when selecting', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: [],
          selectedRoles: [],
          defaultRoles: ['ADMIN', 'USER'],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: false
        }
      ];

      const updated = toggleAccountSelection(mappings, 'acc-001', true);

      expect(updated[0].isAccountSelected).toBe(true);
      expect(updated[0].selectedRoles).toEqual(['ADMIN', 'USER']);
    });

    it('should clear selected roles when deselecting', () => {
      const mappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-001',
          accountName: 'Test Account',
          originalRoles: [],
          selectedRoles: ['ADMIN', 'USER'],
          defaultRoles: ['ADMIN', 'USER'],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true
        }
      ];

      const updated = toggleAccountSelection(mappings, 'acc-001', false);

      expect(updated[0].isAccountSelected).toBe(false);
      expect(updated[0].selectedRoles).toEqual([]);
    });
  });

  describe('loadAvailableAccounts', () => {
    it('should load accounts from API with success response', async () => {
      (AccountService.getAllAccounts as jest.Mock).mockResolvedValue({
        success: true,
        data: { content: [mockAccount] }
      });

      const accounts = await loadAvailableAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual(mockAccount);
    });

    it('should handle direct array response format', async () => {
      (AccountService.getAllAccounts as jest.Mock).mockResolvedValue([mockAccount]);

      const accounts = await loadAvailableAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual(mockAccount);
    });

    it('should return empty array on API error', async () => {
      (AccountService.getAllAccounts as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const accounts = await loadAvailableAccounts();

      expect(accounts).toEqual([]);
    });

    it('should handle undefined response', async () => {
      (AccountService.getAllAccounts as jest.Mock).mockResolvedValue(undefined);

      const accounts = await loadAvailableAccounts();

      expect(accounts).toEqual([]);
    });
  });

  describe('loadAvailableRoles', () => {
    it('should load roles from role service', async () => {
      const mockRole = { id: 'role-001', name: 'ADMIN' };
      (RoleService.prototype.getRoles as jest.Mock).mockResolvedValue({
        content: [mockRole]
      });

      const roles = await loadAvailableRoles();

      expect(roles).toHaveLength(1);
    });

    it('should return empty array on API error', async () => {
      (RoleService.prototype.getRoles as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const roles = await loadAvailableRoles();

      expect(roles).toEqual([]);
    });

    it('should handle undefined response content', async () => {
      (RoleService.prototype.getRoles as jest.Mock).mockResolvedValue({});

      const roles = await loadAvailableRoles();

      expect(roles).toEqual([]);
    });
  });
});
