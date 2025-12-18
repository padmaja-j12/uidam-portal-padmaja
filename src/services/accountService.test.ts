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
import { AccountService, Account, UserAccountRoleMapping, AssignUserToAccountRequest } from './accountService';
import { AccountStatus } from '../types';
import { userManagementApi } from './api-client';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock userManagementApi
jest.mock('./api-client', () => ({
  userManagementApi: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }
}));

jest.mock('./apiUtils', () => ({
  getApiHeaders: jest.fn(() => ({
    'Content-Type': 'application/json'
  })),
  handleApiResponse: jest.fn(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../config/app.config', () => ({
  API_CONFIG: {
    API_BASE_URL: 'http://localhost:8080/api'
  }
}));

const mockUserManagementApi = userManagementApi as jest.Mocked<typeof userManagementApi>;

describe('AccountService', () => {
  const mockAccount: Account = {
    id: 'acc-001',
    accountName: 'Test Account',
    roles: ['ADMIN'],
    status: AccountStatus.ACTIVE,
    createdBy: 'admin',
    createDate: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      const result = await AccountService.createAccount({
        accountName: 'New Account'
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('acc-001');
    });

    it('should handle HTTP error on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValueOnce('Invalid')
      });

      const result = await AccountService.createAccount({
        accountName: 'Test'
      });

      expect(result.success).toBe(false);
    });

    it('should handle network error on create', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await AccountService.createAccount({
        accountName: 'Test'
      });

      expect(result.success).toBe(false);
    });

    it('should handle JSON parse error on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValueOnce(new Error('Bad JSON'))
      });

      const result = await AccountService.createAccount({
        accountName: 'Test'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getAccount', () => {
    it('should retrieve account', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      const result = await AccountService.getAccount('acc-001');

      expect(result.success).toBe(true);
      expect(result.data?.accountName).toBe('Test Account');
    });

    it('should handle 404 on get', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValueOnce('Not found')
      });

      const result = await AccountService.getAccount('acc-999');

      expect(result.success).toBe(false);
    });

    it('should handle network error on get', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network issue'));

      const result = await AccountService.getAccount('acc-001');

      expect(result.success).toBe(false);
    });
  });

  describe('updateAccount', () => {
    it('should handle error on update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValueOnce('')
      });

      const result = await AccountService.updateAccount('acc-001', {});

      expect(result.success).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('should handle error on delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: jest.fn().mockResolvedValueOnce('')
      });

      const result = await AccountService.deleteAccount('acc-001');

      expect(result.success).toBe(false);
    });
  });

  describe('HTTP Methods', () => {
    it('should use POST for create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.createAccount({ accountName: 'New' });

      expect(mockFetch.mock.calls[0][1]?.method).toBe('POST');
    });

    it('should use GET for retrieve', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.getAccount('acc-001');

      expect(mockFetch.mock.calls[0][1]?.method).toBe('GET');
    });

    it('should use POST for update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.updateAccount('acc-001', {});

      expect(mockFetch.mock.calls[0][1]?.method).toBe('POST');
    });

    it('should use DELETE for delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({})
      });

      await AccountService.deleteAccount('acc-001');

      expect(mockFetch.mock.calls[0][1]?.method).toBe('DELETE');
    });
  });

  describe('API Endpoints', () => {
    it('should call correct endpoint for create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.createAccount({ accountName: 'New' });

      expect(mockFetch.mock.calls[0][0]).toContain('/v1/accounts');
    });

    it('should call correct endpoint for get', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.getAccount('acc-001');

      expect(mockFetch.mock.calls[0][0]).toContain('/v1/accounts/acc-001');
    });

    it('should call correct endpoint for update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      await AccountService.updateAccount('acc-001', {});

      expect(mockFetch.mock.calls[0][0]).toContain('/v1/accounts/acc-001');
    });

    it('should call correct endpoint for delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({})
      });

      await AccountService.deleteAccount('acc-001');

      expect(mockFetch.mock.calls[0][0]).toContain('/v1/accounts/acc-001');
    });
  });

  describe('Error Codes', () => {
    it('should handle 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValueOnce('Invalid data')
      });

      const result = await AccountService.createAccount({ accountName: 'Bad' });

      expect(result.success).toBe(false);
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValueOnce('Auth failed')
      });

      const result = await AccountService.getAccount('acc-001');

      expect(result.success).toBe(false);
    });

    it('should handle 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: jest.fn().mockResolvedValueOnce('Access denied')
      });

      const result = await AccountService.updateAccount('acc-001', {});

      expect(result.success).toBe(false);
    });

    it('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValueOnce('Server error')
      });

      const result = await AccountService.deleteAccount('acc-001');

      expect(result.success).toBe(false);
    });

    it('should handle 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValueOnce('Account not found')
      });

      const result = await AccountService.getAccount('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not Found');
    });

    it('should handle 405 Method Not Allowed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
        text: jest.fn().mockResolvedValueOnce('Method not allowed')
      });

      const result = await AccountService.createAccount({ accountName: 'Test' });

      expect(result.success).toBe(false);
    });
  });

  describe('Response Handling', () => {
    it('should handle successful update with text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce('Account updated successfully')
      });

      const result = await AccountService.updateAccount('acc-001', { accountName: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('Account updated successfully');
    });

    it('should handle successful delete with text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce('Account deleted successfully')
      });

      const result = await AccountService.deleteAccount('acc-001');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Account deleted successfully');
    });

    it('should handle error instance in catch block', async () => {
      const error = new Error('Custom error message');
      mockFetch.mockRejectedValueOnce(error);

      const result = await AccountService.createAccount({ accountName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error message');
    });

    it('should handle non-Error exception in catch block', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await AccountService.getAccount('acc-001');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get account');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty accountName in create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ ...mockAccount, accountName: '' })
      });

      const result = await AccountService.createAccount({ accountName: '' });

      expect(result.success).toBe(true);
    });

    it('should handle undefined optional fields in create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      const result = await AccountService.createAccount({
        accountName: 'Test',
        parentId: undefined,
        roles: undefined,
        description: undefined
      });

      expect(result.success).toBe(true);
    });

    it('should handle empty update object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce('Updated')
      });

      const result = await AccountService.updateAccount('acc-001', {});

      expect(result.success).toBe(true);
    });

    it('should handle special characters in accountId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockAccount)
      });

      const result = await AccountService.getAccount('acc-001-special_chars');

      expect(result.success).toBe(true);
      expect(mockFetch.mock.calls[0][0]).toContain('acc-001-special_chars');
    });
  });

  describe('filterAccounts', () => {
    it('should filter accounts successfully', async () => {
      const mockResponse = {
        items: [mockAccount],
        totalElements: 1
      };
      mockUserManagementApi.post.mockResolvedValueOnce(mockResponse);

      const result = await AccountService.filterAccounts(
        { status: ['ACTIVE'] },
        { pageNumber: 0, pageSize: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toHaveLength(1);
      expect(mockUserManagementApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/accounts/filter'),
        { status: ['ACTIVE'] }
      );
    });

    it('should handle filterAccounts error', async () => {
      mockUserManagementApi.post.mockRejectedValueOnce(new Error('Filter failed'));

      const result = await AccountService.filterAccounts({ status: ['ACTIVE'] });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Filter failed');
    });

    it('should build query parameters correctly', async () => {
      mockUserManagementApi.post.mockResolvedValueOnce({ items: [] });

      await AccountService.filterAccounts(
        { roles: ['ADMIN', 'USER'] },
        { pageNumber: 1, pageSize: 20, sortBy: 'ACCOUNT_NAMES', sortOrder: 'ASC' }
      );

      const callUrl = mockUserManagementApi.post.mock.calls[0][0];
      expect(callUrl).toContain('pageNumber=1');
      expect(callUrl).toContain('pageSize=20');
      expect(callUrl).toContain('sortBy=ACCOUNT_NAMES');
      expect(callUrl).toContain('sortOrder=ASC');
    });
  });

  describe('getAllAccounts', () => {
    it('should get all accounts with default filter', async () => {
      const mockResponse = {
        items: [mockAccount],
        totalElements: 1
      };
      mockUserManagementApi.post.mockResolvedValueOnce(mockResponse);

      const result = await AccountService.getAllAccounts();

      expect(result.success).toBe(true);
      expect(mockUserManagementApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/accounts/filter'),
        {}
      );
    });

    it('should pass parameters to getAllAccounts', async () => {
      mockUserManagementApi.post.mockResolvedValueOnce({ items: [] });

      await AccountService.getAllAccounts({ pageNumber: 2, pageSize: 50 });

      const callUrl = mockUserManagementApi.post.mock.calls[0][0];
      expect(callUrl).toContain('pageNumber=2');
      expect(callUrl).toContain('pageSize=50');
    });
  });

  describe('getAccountsByStatus', () => {
    it('should get accounts by status', async () => {
      const mockResponse = {
        items: [mockAccount],
        totalElements: 1
      };
      mockUserManagementApi.post.mockResolvedValueOnce(mockResponse);

      const result = await AccountService.getAccountsByStatus([AccountStatus.ACTIVE]);

      expect(result.success).toBe(true);
      expect(mockUserManagementApi.post).toHaveBeenCalledWith(
        expect.anything(),
        { status: [AccountStatus.ACTIVE] }
      );
    });
  });

  describe('getChildAccounts', () => {
    it('should get child accounts of a parent', async () => {
      const mockResponse = {
        items: [mockAccount],
        totalElements: 1
      };
      mockUserManagementApi.post.mockResolvedValueOnce(mockResponse);

      const result = await AccountService.getChildAccounts('parent-001');

      expect(result.success).toBe(true);
      expect(mockUserManagementApi.post).toHaveBeenCalledWith(
        expect.anything(),
        { parentIds: ['parent-001'] }
      );
    });
  });

  describe('searchAccountsByName', () => {
    it('should search accounts by name', async () => {
      const mockResponse = {
        items: [mockAccount],
        totalElements: 1
      };
      mockUserManagementApi.post.mockResolvedValueOnce(mockResponse);

      const result = await AccountService.searchAccountsByName(['Test'], {
        searchType: 'CONTAINS',
        pageSize: 10
      });

      expect(result.success).toBe(true);
      expect(mockUserManagementApi.post).toHaveBeenCalledWith(
        expect.stringContaining('searchType=CONTAINS'),
        { accountNames: ['Test'] }
      );
    });
  });

  describe('User Account Role Mapping', () => {
    const mockMapping: UserAccountRoleMapping = {
      userId: 'user-001',
      accountId: 'acc-001',
      roleIds: ['role-001'],
      status: 'ACTIVE',
      assignedAt: '2024-01-01T00:00:00Z',
      assignedBy: 'admin'
    };

    describe('assignUserToAccount', () => {
      it('should assign user to account successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            ok: true,
            data: mockMapping
          })
        });

        const assignment: AssignUserToAccountRequest = {
          userId: 'user-001',
          accountId: 'acc-001',
          roleIds: ['role-001']
        };

        const result = await AccountService.assignUserToAccount(assignment);

        expect(result.data).toEqual(mockMapping);
      });

      it('should handle assignUserToAccount error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Assignment failed')
        });

        await expect(AccountService.assignUserToAccount({
          userId: 'user-001',
          accountId: 'acc-001',
          roleIds: []
        })).rejects.toThrow();
      });
    });

    describe('getUserAccountMappings', () => {
      it('should get user account mappings successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce([mockMapping])
        });

        const result = await AccountService.getUserAccountMappings('user-001');

        expect(result).toHaveLength(1);
        expect(result[0].userId).toBe('user-001');
      });

      it('should handle getUserAccountMappings error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: jest.fn().mockResolvedValueOnce('Failed')
        });

        await expect(AccountService.getUserAccountMappings('user-001')).rejects.toThrow();
      });
    });

    describe('getAccountUserMappings', () => {
      it('should get account user mappings successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce([mockMapping])
        });

        const result = await AccountService.getAccountUserMappings('acc-001');

        expect(result).toHaveLength(1);
        expect(result[0].accountId).toBe('acc-001');
      });

      it('should handle getAccountUserMappings error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: jest.fn().mockResolvedValueOnce('Failed')
        });

        await expect(AccountService.getAccountUserMappings('acc-001')).rejects.toThrow();
      });
    });

    describe('updateUserAccountRoles', () => {
      it('should update user account roles successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            ok: true,
            data: mockMapping
          })
        });

        const result = await AccountService.updateUserAccountRoles('user-001', 'acc-001', {
          roleIds: ['role-002']
        });

        expect(result.data).toEqual(mockMapping);
      });

      it('should handle updateUserAccountRoles error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Update failed')
        });

        await expect(AccountService.updateUserAccountRoles('user-001', 'acc-001', {
          roleIds: []
        })).rejects.toThrow();
      });
    });

    describe('removeUserFromAccount', () => {
      it('should remove user from account successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            ok: true,
            message: 'Removed successfully'
          })
        });

        const result = await AccountService.removeUserFromAccount('user-001', 'acc-001');

        expect(result.message).toBe('Removed successfully');
      });

      it('should handle removeUserFromAccount error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Remove failed')
        });

        await expect(AccountService.removeUserFromAccount('user-001', 'acc-001')).rejects.toThrow();
      });
    });

    describe('bulkAssignUsersToAccount', () => {
      it('should bulk assign users to account successfully', async () => {
        const mockResponse = {
          successful: ['user-001', 'user-002'],
          failed: []
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            ok: true,
            data: mockResponse
          })
        });

        const assignments: AssignUserToAccountRequest[] = [
          { userId: 'user-001', accountId: 'acc-001', roleIds: ['role-001'] },
          { userId: 'user-002', accountId: 'acc-001', roleIds: ['role-001'] }
        ];

        const result = await AccountService.bulkAssignUsersToAccount('acc-001', assignments);

        expect(result.data).toEqual(mockResponse);
      });

      it('should handle bulkAssignUsersToAccount error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Bulk assignment failed')
        });

        await expect(AccountService.bulkAssignUsersToAccount('acc-001', [])).rejects.toThrow();
      });
    });
  });
});
