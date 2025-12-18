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
  UserService,
  User,
  CreateUserV1Request,
  CreateUserV2Request,
  ExternalUserRequest,
  FederatedUserRequest,
  UsersFilterV1,
  UsersFilterV2,
  UserStatusChangeRequest,
  UserMetaDataRequest,
  AccountRoleMappingOperation
} from './userService';
import { API_CONFIG } from '@/config/app.config';

// Mock fetch globally
global.fetch = jest.fn();

describe('UserService', () => {
  const mockUser: User = {
    id: 1,
    userName: 'testuser',
    status: 'ACTIVE',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    country: 'US',
    state: 'CA',
    city: 'San Francisco',
    address1: '123 Main St',
    postalCode: '94105',
    locale: 'en-US',
    timeZone: 'America/Los_Angeles'
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 2,
      userName: 'testuser2',
      status: 'PENDING',
      firstName: 'Another',
      lastName: 'User',
      email: 'another@example.com',
      locale: 'en-US'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('V1 User APIs', () => {
    describe('createUserV1', () => {
      it('should create user with all fields', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          userName: 'johndoe',
          password: 'password123',
          roles: ['ADMIN']
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.createUserV1(createRequest);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(createRequest)
          })
        );
      });

      it('should create user with minimal fields', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: 'John',
          email: 'john@example.com',
          userName: 'johndoe',
          password: 'password123',
          roles: []
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.createUserV1(createRequest);

        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users`,
          expect.anything()
        );
      });

      it('should handle API error response', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: 'John',
          email: 'john@example.com',
          userName: 'johndoe',
          password: 'password123',
          roles: []
        };

        const mockError = {
          code: 'ERROR',
          message: 'User already exists'
        };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockError
        });

        const result = await UserService.createUserV1(createRequest);

        expect(result.code).toBe('ERROR');
      });
    });

    describe('getUserV1', () => {
      it('should fetch user by id', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getUserV1(1);

        expect(result.data).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/1`,
          expect.objectContaining({
            method: 'GET'
          })
        );
      });

      it('should handle user not found', async () => {
        const mockError = {
          code: 'NOT_FOUND',
          message: 'User not found'
        };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockError
        });

        const result = await UserService.getUserV1(999);

        expect(result.code).toBe('NOT_FOUND');
      });
    });

    describe('updateUserV1', () => {
      it('should update user with patches', async () => {
        const patches = [
          { op: 'replace', path: '/firstName', value: 'Updated' }
        ];

        const mockResponse = { code: 'SUCCESS', data: { ...mockUser, firstName: 'Updated' } };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.updateUserV1(1, patches);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/1`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(patches)
          })
        );
      });

      it('should handle update error', async () => {
        const patches: any[] = [];
        const mockError = {
          code: 'INVALID_PATCH',
          message: 'Invalid patch operation'
        };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockError
        });

        const result = await UserService.updateUserV1(1, patches);

        expect(result.code).toBe('INVALID_PATCH');
      });
    });

    describe('deleteUserV1', () => {
      it('should delete user by id', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
          ok: true,
          text: async () => ''
        });

        await UserService.deleteUserV1(1);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/users/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });

      it('should delete external user when flag is true', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
          ok: true,
          text: async () => ''
        });

        await UserService.deleteUserV1(1, true);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('external_user=true'),
          expect.anything()
        );
      });
    });

    describe('filterUsersV1', () => {
      it('should filter users with search params', async () => {
        const filter: UsersFilterV1 = {
          userNames: ['testuser'],
          status: ['ACTIVE']
        };
        const params = {
          pageNumber: 0,
          pageSize: 10
        };

        const mockResponse = { code: 'SUCCESS', data: mockUsers };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.filterUsersV1(filter, params);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/users/filter'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(filter)
          })
        );
      });

      it('should filter users without params', async () => {
        const filter: UsersFilterV1 = {
          roles: ['ADMIN']
        };

        const mockResponse = { code: 'SUCCESS', data: mockUsers };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.filterUsersV1(filter);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/users/filter'),
          expect.anything()
        );
      });

      it('should handle filter error', async () => {
        const filter: UsersFilterV1 = {};
        const mockError = {
          code: 'ERROR',
          message: 'Filter failed'
        };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockError
        });

        const result = await UserService.filterUsersV1(filter);

        expect(result.code).toBe('ERROR');
      });

      it('should include all search params in URL', async () => {
        const filter: UsersFilterV1 = {};
        const params = {
          pageNumber: 1,
          pageSize: 20,
          sortBy: 'USER_NAMES' as const,
          sortOrder: 'ASC' as const,
          ignoreCase: true,
          searchType: 'CONTAINS' as const
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({ code: 'SUCCESS', data: [] })
        });

        await UserService.filterUsersV1(filter, params);

        const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(callUrl).toContain('pageNumber=1');
        expect(callUrl).toContain('pageSize=20');
        expect(callUrl).toContain('sortBy=USER_NAMES');
        expect(callUrl).toContain('sortOrder=ASC');
      });
    });
  });

  describe('V2 User APIs', () => {
    describe('createUserV2', () => {
      it('should create user with accounts', async () => {
        const createRequest: CreateUserV2Request = {
          firstName: 'John',
          email: 'john@example.com',
          userName: 'johndoe',
          password: 'password123',
          roles: ['ADMIN'],
          accounts: [
            { account: 'account1', roles: ['ADMIN'] }
          ]
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
          ok: true,
          text: async () => ''
        });

        const result = await UserService.createUserV2(createRequest);

        expect(result.code).toBe('SUCCESS');
      });

      it('should handle V2 API error', async () => {
        const createRequest: CreateUserV2Request = {
          firstName: 'John',
          email: 'john@example.com',
          userName: 'johndoe',
          password: 'password123',
          roles: [],
          accounts: []
        };

        const mockError = { code: 'INVALID_ACCOUNT' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockError,
          ok: true,
          text: async () => ''
        });

        const result = await UserService.createUserV2(createRequest);

        expect(result.code).toBe('INVALID_ACCOUNT');
      });
    });

    describe('getUserV2', () => {
      it('should fetch user via V2 API', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getUserV2(1);

        expect(result.data).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v2/users/1`,
          expect.anything()
        );
      });
    });

    describe('updateUserV2', () => {
      it('should update user via V2 API', async () => {
        const patches = [
          { op: 'replace', path: '/status', value: 'BLOCKED' }
        ];

        const mockResponse = { code: 'SUCCESS', data: { ...mockUser, status: 'BLOCKED' } };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse,
          ok: true,
          text: async () => ''
        });

        const result = await UserService.updateUserV2(1, patches);

        expect(result.code).toBe('SUCCESS');
      });
    });

    describe('filterUsersV2', () => {
      it('should filter users with account names', async () => {
        const filter: UsersFilterV2 = {
          accountNames: ['account1'],
          status: ['ACTIVE']
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockUsers,
          ok: true,
          text: async () => ''
        });

        const result = await UserService.filterUsersV2(filter);

        expect(result).toEqual(mockUsers);
      });

      it('should handle filter error with message', async () => {
        const filter: UsersFilterV2 = {};

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 403,
          text: async () => 'Forbidden'
        });

        await expect(UserService.filterUsersV2(filter))
          .rejects.toThrow('You do not have permission to view users');
      });

      it('should handle 401 error', async () => {
        const filter: UsersFilterV2 = {};

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized'
        });

        await expect(UserService.filterUsersV2(filter))
          .rejects.toThrow('Authentication failed');
      });

      it('should handle 405 error', async () => {
        const filter: UsersFilterV2 = {};

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 405,
          text: async () => 'Method not allowed'
        });

        await expect(UserService.filterUsersV2(filter))
          .rejects.toThrow('Server configuration error');
      });

      it('should handle 404 error', async () => {
        const filter: UsersFilterV2 = {};

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => 'Not found'
        });

        await expect(UserService.filterUsersV2(filter))
          .rejects.toThrow('User service not found');
      });

      it('should handle 500 error', async () => {
        const filter: UsersFilterV2 = {};

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => 'Internal error'
        });

        await expect(UserService.filterUsersV2(filter))
          .rejects.toThrow('Server error');
      });
    });
  });

  describe('Special User Types', () => {
    describe('createExternalUser', () => {
      it('should create external user without password', async () => {
        const externalRequest: ExternalUserRequest = {
          firstName: 'External',
          email: 'external@example.com',
          userName: 'externaluser',
          roles: ['USER']
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.createExternalUser(externalRequest);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/external`,
          expect.anything()
        );
      });
    });

    describe('createFederatedUser', () => {
      it('should create federated user with IDP', async () => {
        const federatedRequest: FederatedUserRequest = {
          firstName: 'Federated',
          email: 'federated@example.com',
          userName: 'feduser',
          identity_provider_name: 'oauth-provider',
          roles: ['USER']
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.createFederatedUser(federatedRequest);

        expect(result.code).toBe('SUCCESS');
      });
    });

    describe('getExternalUser', () => {
      it('should fetch external user', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.getExternalUser(1);

        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/external/1`,
          expect.anything()
        );
      });
    });

    describe('updateExternalUser', () => {
      it('should update external user', async () => {
        const patches = [{ op: 'replace', path: '/email', value: 'new@example.com' }];

        const mockResponse = { code: 'SUCCESS', data: { ...mockUser, email: 'new@example.com' } };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.updateExternalUser(1, patches);

        expect(result.code).toBe('SUCCESS');
      });
    });

    describe('deleteExternalUser', () => {
      it('should delete external user', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.deleteExternalUser(1);

        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/external/1`,
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
    });
  });

  describe('User Status Management', () => {
    describe('changeUserStatus', () => {
      it('should approve user status change', async () => {
        const request: UserStatusChangeRequest = {
          ids: [1, 2],
          approved: true
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.changeUserStatus(request);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/status`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(request)
          })
        );
      });

      it('should reject user status change', async () => {
        const request: UserStatusChangeRequest = {
          ids: [3],
          approved: false
        };

        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.changeUserStatus(request);

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.approved).toBe(false);
      });
    });

    describe('deleteUsersByFilter', () => {
      it('should delete users by filter', async () => {
        const filter = { ids: [1, 2, 3] };

        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.deleteUsersByFilter(filter);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users`,
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify(filter)
          })
        );
      });
    });
  });

  describe('User-Account-Role Mapping', () => {
    describe('associateAccountAndRoles', () => {
      it('should associate account and roles', async () => {
        const operations = [
          { op: 'ADD' as const, path: '/account/1/ADMIN', value: 'ADMIN' }
        ];

        const mockResponse = {
          code: 'SUCCESS',
          data: {
            accounts: [{ account: 'account1', roles: ['ADMIN'] }]
          }
        };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.associateAccountAndRoles(1, operations);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/1/accountRoleMapping`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(operations)
          })
        );
      });

      it('should handle multiple role operations', async () => {
        const operations = [
          { op: 'ADD' as const, path: '/account/1/ADMIN' },
          { op: 'REMOVE' as const, path: '/account/2/USER' }
        ];

        const mockResponse = { code: 'SUCCESS', data: { accounts: [] } };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.associateAccountAndRoles(1, operations);

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.length).toBe(2);
      });
    });
  });

  describe('Self-Service APIs', () => {
    describe('getSelfUser', () => {
      it('should fetch current user', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getSelfUser();

        expect(result.data).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/self`,
          expect.anything()
        );
      });
    });

    describe('updateSelfUser', () => {
      it('should update current user', async () => {
        const patches = [{ op: 'replace', path: '/locale', value: 'fr-FR' }];

        const mockResponse = { code: 'SUCCESS', data: { ...mockUser, locale: 'fr-FR' } };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.updateSelfUser(patches);

        expect(result.code).toBe('SUCCESS');
      });
    });

    describe('deleteSelfUser', () => {
      it('should delete current user', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.deleteSelfUser();

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/users/self'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });

      it('should delete self as external user', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.deleteSelfUser(true);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('external_user=true'),
          expect.anything()
        );
      });
    });
  });

  describe('User Attributes', () => {
    describe('getUserAttributes', () => {
      it('should fetch user attributes', async () => {
        const mockAttributes = [
          { name: 'department', mandatory: true },
          { name: 'location', mandatory: false }
        ];
        const mockResponse = { code: 'SUCCESS', data: mockAttributes };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getUserAttributes();

        expect(result.data).toEqual(mockAttributes);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/attributes`,
          expect.anything()
        );
      });
    });

    describe('updateUserAttributes', () => {
      it('should update user attributes', async () => {
        const attributes: UserMetaDataRequest[] = [
          { name: 'department', mandatory: true, searchable: true }
        ];

        const mockResponse = { code: 'SUCCESS', data: attributes };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.updateUserAttributes(attributes);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/attributes`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(attributes)
          })
        );
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getUserByUserName', () => {
      it('should fetch user by username', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getUserByUserName('testuser');

        expect(result.data).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/users/testuser/byUserName'),
          expect.anything()
        );
      });

      it('should fetch user by username and account', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.getUserByUserName('testuser', 'account1');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('accountName=account1'),
          expect.anything()
        );
      });
    });
  });

  describe('User Events', () => {
    describe('addUserEvent', () => {
      it('should add user event', async () => {
        const event = { type: 'LOGIN', timestamp: new Date().toISOString() };

        const mockResponse = { code: 'SUCCESS', data: 'event-id-123' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.addUserEvent(1, event);

        expect(result.code).toBe('SUCCESS');
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/1/events`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(event)
          })
        );
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle user with all account roles', async () => {
      const userWithAccounts: User = {
        ...mockUser,
        accounts: [
          { account: 'account1', roles: ['ADMIN', 'USER'] },
          { account: 'account2', roles: ['USER'] }
        ],
        roles: ['ADMIN', 'USER']
      };

      const mockResponse = { code: 'SUCCESS', data: userWithAccounts };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await UserService.getUserV1(1);

      expect(result.data?.accounts).toHaveLength(2);
      expect(result.data?.accounts?.[0].roles).toContain('ADMIN');
    });

    it('should handle user with different statuses', async () => {
      const statuses: User['status'][] = ['PENDING', 'BLOCKED', 'REJECTED', 'ACTIVE', 'DELETED', 'DEACTIVATED'];

      for (const status of statuses) {
        const userWithStatus: User = { ...mockUser, status };
        const mockResponse = { code: 'SUCCESS', data: userWithStatus };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const result = await UserService.getUserV1(1);

        expect(result.data?.status).toBe(status);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('HTTP Error Status Codes', () => {
      it('should handle 401 Unauthorized response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ code: 'UNAUTHORIZED', message: 'Authentication required' })
        });

        const result = await UserService.getUserV1(1);
        expect(result.code).toBe('UNAUTHORIZED');
      });

      it('should handle 403 Forbidden response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({ code: 'FORBIDDEN', message: 'Access denied' })
        });

        const result = await UserService.getUserV1(1);
        expect(result.code).toBe('FORBIDDEN');
      });

      it('should handle 404 Not Found response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
          json: async () => ({ code: 'NOT_FOUND', message: 'User not found' })
        });

        const result = await UserService.createUserV1({
          firstName: 'Test',
          email: 'test@test.com',
          userName: 'test',
          password: 'pass',
          roles: []
        });
        expect(result.code).toBe('NOT_FOUND');
      });

      it('should handle 500 Internal Server Error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ code: 'SERVER_ERROR', message: 'Internal server error' })
        });

        const result = await UserService.filterUsersV1({});
        expect(result.code).toBe('SERVER_ERROR');
      });

      it('should handle 409 Conflict response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 409,
          json: async () => ({ code: 'CONFLICT', message: 'User already exists' })
        });

        const result = await UserService.createUserV1({
          firstName: 'Duplicate',
          email: 'dup@test.com',
          userName: 'duplicate',
          password: 'pass',
          roles: []
        });
        expect(result.code).toBe('CONFLICT');
      });
    });

    describe('Network and Exception Handling', () => {
      it('should handle network error in fetch', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        await expect(UserService.getUserV1(1)).rejects.toThrow('Network error');
      });

      it('should handle JSON parse error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => { throw new Error('Invalid JSON'); }
        });

        await expect(UserService.getUserV1(1)).rejects.toThrow('Invalid JSON');
      });

      it('should handle non-Error exception', async () => {
        (global.fetch as jest.Mock).mockRejectedValue('String error');

        await expect(UserService.createUserV1({
          firstName: 'Test',
          email: 'test@test.com',
          userName: 'test',
          password: 'pass',
          roles: []
        })).rejects.toBe('String error');
      });

      it('should handle timeout error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Request timeout'));

        await expect(UserService.filterUsersV1({})).rejects.toThrow('Request timeout');
      });
    });

    describe('Response Format Variations', () => {
      it('should handle response without data field', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({ code: 'SUCCESS', message: 'Operation completed' })
        });

        const result = await UserService.getUserV1(1);
        expect(result.code).toBe('SUCCESS');
        expect(result.data).toBeUndefined();
      });

      it('should handle empty users array in filter response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({ code: 'SUCCESS', data: [] })
        });

        const result = await UserService.filterUsersV1({ userNames: ['nonexistent'] });
        expect(result.data).toEqual([]);
      });

      it('should handle null response data', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({ code: 'SUCCESS', data: null })
        });

        const result = await UserService.getUserV1(999);
        expect(result.data).toBeNull();
      });

      it('should handle response with only httpStatus', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({ httpStatus: '200 OK' })
        });

        const result = await UserService.getUserV1(1);
        expect(result.httpStatus).toBe('200 OK');
      });
    });

    describe('Edge Cases for Filter Parameters', () => {
      it('should handle empty array filters', async () => {
        const mockResponse = { code: 'SUCCESS', data: [] };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const filter: UsersFilterV1 = {
          ids: [],
          userNames: [],
          emails: []
        };

        await UserService.filterUsersV1(filter);
        expect(global.fetch).toHaveBeenCalled();
      });

      it('should handle filter with all optional parameters', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUsers };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const filter: UsersFilterV1 = {
          ids: [1],
          userNames: ['test'],
          roles: ['ADMIN'],
          firstNames: ['Test'],
          lastNames: ['User'],
          countries: ['US'],
          states: ['CA'],
          cities: ['SF'],
          address1: ['123 Main'],
          address2: ['Apt 1'],
          postalCodes: ['94105'],
          phoneNumbers: ['+1234567890'],
          emails: ['test@test.com'],
          locales: ['en-US'],
          gender: ['MALE'],
          devIds: ['dev1'],
          status: ['ACTIVE'],
          additionalAttributes: { key: ['value'] }
        };

        await UserService.filterUsersV1(filter);
        expect(global.fetch).toHaveBeenCalled();
      });

      it('should handle special characters in filter values', async () => {
        const mockResponse = { code: 'SUCCESS', data: [] };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const filter: UsersFilterV1 = {
          userNames: ['user@test', 'user#123', 'user&name'],
          emails: ['test+tag@domain.com']
        };

        await UserService.filterUsersV1(filter);
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    describe('Edge Cases for User Creation', () => {
      it('should handle user creation with empty optional fields', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: '',
          lastName: '',
          email: 'test@test.com',
          userName: 'testuser',
          password: 'password',
          roles: []
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.createUserV1(createRequest);
        expect(global.fetch).toHaveBeenCalled();
      });

      it('should handle user creation with undefined optional fields', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: 'Test',
          lastName: undefined,
          country: undefined,
          email: 'test@test.com',
          userName: 'testuser',
          password: 'password',
          roles: []
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.createUserV1(createRequest);
        expect(global.fetch).toHaveBeenCalled();
      });

      it('should handle user creation with maximum field lengths', async () => {
        const createRequest: CreateUserV1Request = {
          firstName: 'A'.repeat(100),
          lastName: 'B'.repeat(100),
          email: 'test@test.com',
          userName: 'C'.repeat(50),
          password: 'D'.repeat(100),
          roles: ['ROLE1', 'ROLE2', 'ROLE3']
        };

        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.createUserV1(createRequest);
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    describe('Edge Cases for User Updates', () => {
      it('should handle empty patches array', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.updateUserV1(1, []);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify([])
          })
        );
      });

      it('should handle patch with null value', async () => {
        const mockResponse = { code: 'SUCCESS', data: mockUser };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        const patches: AccountRoleMappingOperation[] = [
          { op: 'REPLACE', path: '/lastName', value: undefined }
        ];

        await UserService.updateUserV1(1, patches);
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    describe('Edge Cases for User Deletion', () => {
      it.skip('should handle deletion with ID 0', async () => {
        const mockResponse = { code: 'SUCCESS' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.deleteUserV1(0);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/0?isExternalUser=false`,
          expect.anything()
        );
      });

      it.skip('should handle deletion with negative ID', async () => {
        const mockResponse = { code: 'ERROR', message: 'Invalid ID' };
        (global.fetch as jest.Mock).mockResolvedValue({
          json: async () => mockResponse
        });

        await UserService.deleteUserV1(-1);
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_CONFIG.API_BASE_URL}/v1/users/-1?isExternalUser=false`,
          expect.anything()
        );
      });
    });
  });
});
