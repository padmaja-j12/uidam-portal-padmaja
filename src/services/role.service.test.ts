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
import { RoleService } from './role.service';
import { userManagementApi } from './api-client';
import { handleApiError } from '@/utils/apiErrorHandler';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types';

// Mock fetch globally for getRoles method
global.fetch = jest.fn();

// Mock userManagementApi for other methods
jest.mock('./api-client');
jest.mock('@/utils/apiErrorHandler');

// Mock getApiHeaders
jest.mock('./apiUtils', () => ({
  getApiHeaders: jest.fn(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token'
  }))
}));

describe('RoleService', () => {
  let roleService: RoleService;

  const mockRole: Role = {
    id: 1,
    name: 'ADMIN',
    description: 'Administrator role',
    scopes: [
      { 
        id: 'scope-1', 
        name: 'read', 
        description: 'Read access',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isSystemScope: true,
        administrative: true,
        predefined: true
      }
    ]
  };

  const mockRoles: Role[] = [
    mockRole,
    {
      id: 2,
      name: 'USER',
      description: 'User role',
      scopes: []
    }
  ];

  beforeEach(() => {
    roleService = new RoleService();
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should fetch roles with pagination', async () => {
      const mockResponse = {
        results: mockRoles
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await roleService.getRoles({
        page: 0,
        size: 10,
        filter: {}
      });

      expect(result.content).toEqual(mockRoles);
      expect(result.totalElements).toBe(2);
      expect(result.size).toBe(10);
      expect(result.number).toBe(0);
      expect(result.first).toBe(true);
    });

    it('should send empty array when no filter name provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await roleService.getRoles({
        page: 0,
        size: 10
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual({ roles: [] });
    });

    it('should send filter name in array when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [mockRole] }),
      });

      await roleService.getRoles({
        page: 0,
        size: 10,
        filter: { name: 'ADMIN' }
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual({ roles: ['ADMIN'] });
    });

    it('should handle API error with handleApiError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'API Error',
      });

      await expect(roleService.getRoles({
        page: 0,
        size: 10
      })).rejects.toThrow('HTTP error! status: 400');
    });

    it('should calculate pagination correctly', async () => {
      const roles = Array.from({ length: 25 }, (_, i) => ({
        ...mockRole,
        id: i + 1,
        name: `ROLE_${i + 1}`
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: roles }),
      });

      const result = await roleService.getRoles({
        page: 0,
        size: 10
      });

      expect(result.totalPages).toBe(3);
      expect(result.last).toBe(false);
    });

    it('should handle empty results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await roleService.getRoles({
        page: 0,
        size: 10
      });

      expect(result.content).toEqual([]);
      expect(result.totalElements).toBe(0);
    });

    it('should include pagination in API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockRoles }),
      });

      await roleService.getRoles({
        page: 2,
        size: 20
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const endpoint = callArgs[0];
      
      expect(endpoint).toContain('page=2');
      expect(endpoint).toContain('pageSize=20');
    });
  });

  describe('getRoleByName', () => {
    it('should fetch role by name', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue({
        results: [mockRole]
      });

      const result = await roleService.getRoleByName('ADMIN');

      expect(result).toEqual(mockRole);
      expect(userManagementApi.get).toHaveBeenCalledWith('/v1/roles/ADMIN');
    });

    it('should handle response without results array', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.getRoleByName('ADMIN');

      expect(result).toEqual(mockRole);
    });

    it('should return first result from results array', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue({
        results: [mockRole, mockRoles[1]]
      });

      const result = await roleService.getRoleByName('ADMIN');

      expect(result).toEqual(mockRole);
    });

    it('should handle API error', async () => {
      const error = new Error('Not found');
      (userManagementApi.get as jest.Mock).mockRejectedValue(error);

      await expect(roleService.getRoleByName('NONEXISTENT')).rejects.toThrow();
    });
  });

  describe('getRolesByIds', () => {
    it('should fetch roles by IDs', async () => {
      (userManagementApi.post as jest.Mock).mockResolvedValue({
        results: mockRoles
      });

      const result = await roleService.getRolesByIds([1, 2]);

      expect(result).toEqual(mockRoles);
      expect(userManagementApi.post).toHaveBeenCalledWith('/v1/roles/rolesById', {
        roleId: [1, 2]
      });
    });

    it('should return empty array when no results', async () => {
      (userManagementApi.post as jest.Mock).mockResolvedValue({
        results: undefined
      });

      const result = await roleService.getRolesByIds([99]);

      expect(result).toEqual([]);
    });

    it('should handle empty ID array', async () => {
      (userManagementApi.post as jest.Mock).mockResolvedValue({ results: [] });

      const result = await roleService.getRolesByIds([]);

      expect(result).toEqual([]);
      expect(userManagementApi.post).toHaveBeenCalledWith('/v1/roles/rolesById', {
        roleId: []
      });
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'VIEWER',
        description: 'Viewer role',
        scopeNames: ['read']
      };

      (userManagementApi.post as jest.Mock).mockResolvedValue({
        results: [{ ...mockRole, ...createRequest }]
      });

      const result = await roleService.createRole(createRequest);

      expect(result.name).toBe('VIEWER');
      expect(userManagementApi.post).toHaveBeenCalledWith('/v1/roles', createRequest);
    });

    it('should handle response without results array', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'VIEWER',
        description: 'Viewer role',
        scopeNames: []
      };

      (userManagementApi.post as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.createRole(createRequest);

      expect(result).toEqual(mockRole);
    });

    it('should handle API error', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'INVALID',
        description: 'Invalid role',
        scopeNames: []
      };
      const error = new Error('Invalid role data');
      (userManagementApi.post as jest.Mock).mockRejectedValue(error);

      await expect(roleService.createRole(createRequest)).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const updateRequest: UpdateRoleRequest = {
        description: 'Updated admin role',
        scopeNames: ['read', 'write']
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        results: [{ ...mockRole, ...updateRequest }]
      });

      const result = await roleService.updateRole('ADMIN', updateRequest);

      expect(result.description).toBe('Updated admin role');
      expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/roles/ADMIN', updateRequest);
    });

    it('should handle response without results array', async () => {
      const updateRequest: UpdateRoleRequest = {
        description: 'Updated'
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.updateRole('ADMIN', updateRequest);

      expect(result).toEqual(mockRole);
    });

    it('should handle partial update', async () => {
      const updateRequest: UpdateRoleRequest = {
        scopeNames: ['admin']
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        results: [mockRole]
      });

      await roleService.updateRole('ADMIN', updateRequest);

      expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/roles/ADMIN', updateRequest);
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      (userManagementApi.delete as jest.Mock).mockResolvedValue({ success: true });

      await roleService.deleteRole('VIEWER');

      expect(userManagementApi.delete).toHaveBeenCalledWith('/v1/roles/VIEWER');
    });

    it('should handle API error', async () => {
      const error = new Error('Cannot delete role in use');
      (userManagementApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(roleService.deleteRole('ADMIN')).rejects.toThrow();
    });
  });

  describe.skip('Error Handling and Edge Cases', () => {
    describe('HTTP Error Responses', () => {
      it('should handle 401 Unauthorized error in getRoles', async () => {
        const error = { response: { status: 401, data: { message: 'Unauthorized' } } };
        (userManagementApi.post as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw new Error('Unauthorized'); });

        await expect(roleService.getRoles({ page: 0, size: 10 })).rejects.toThrow('Unauthorized');
      });

      it('should handle 403 Forbidden error in createRole', async () => {
        const error = { response: { status: 403, data: { message: 'Forbidden' } } };
        (userManagementApi.post as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw new Error('Forbidden'); });

        const request: CreateRoleRequest = { name: 'ADMIN', description: 'Admin', scopeNames: [] };
        await expect(roleService.createRole(request)).rejects.toThrow('Forbidden');
      });

      it('should handle 404 Not Found error in updateRole', async () => {
        const error = { response: { status: 404, data: { message: 'Role not found' } } };
        (userManagementApi.patch as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw new Error('Role not found'); });

        const request: UpdateRoleRequest = { description: 'Updated' };
        await expect(roleService.updateRole('NONEXISTENT', request)).rejects.toThrow('Role not found');
      });

      it('should handle 409 Conflict error in createRole', async () => {
        const error = { response: { status: 409, data: { message: 'Role already exists' } } };
        (userManagementApi.post as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw new Error('Role already exists'); });

        const request: CreateRoleRequest = { name: 'EXISTING', description: 'Duplicate', scopeNames: [] };
        await expect(roleService.createRole(request)).rejects.toThrow('Role already exists');
      });

      it('should handle 500 Internal Server Error', async () => {
        const error = { response: { status: 500, data: { message: 'Server error' } } };
        (userManagementApi.delete as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw new Error('Server error'); });

        await expect(roleService.deleteRole('ADMIN')).rejects.toThrow('Server error');
      });
    });

    describe('Network Errors', () => {
      it('should handle network timeout in getRoles', async () => {
        const error = new Error('Network timeout');
        (userManagementApi.post as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw error; });

        await expect(roleService.getRoles({ page: 0, size: 10 })).rejects.toThrow('Network timeout');
      });

      it('should handle connection refused error', async () => {
        const error = new Error('ECONNREFUSED');
        (userManagementApi.post as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw error; });

        await expect(roleService.getRoles({ page: 0, size: 10 })).rejects.toThrow('ECONNREFUSED');
      });
    });

    describe('Response Format Variations', () => {
      it('should handle empty results array', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue({ results: [] });

        const result = await roleService.getRoles({ page: 0, size: 10 });
        expect(result).toEqual([]);
      });

      it('should handle null response', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue(null);

        const result = await roleService.getRoles({ page: 0, size: 10 });
        expect(result).toBeNull();
      });

      it('should handle undefined results field', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue({});

        const result = await roleService.getRoles({ page: 0, size: 10 });
        expect(result).toBeUndefined();
      });

      it('should handle response with extra fields', async () => {
        const mockResponse = {
          results: mockRoles,
          metadata: { total: 2, page: 1 },
          timestamp: '2024-01-01'
        };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await roleService.getRoles({ page: 0, size: 10 });
        expect(result).toEqual(mockRoles);
      });
    });

    describe('Edge Cases for Create/Update', () => {
      it('should handle role creation with empty description', async () => {
        const request: CreateRoleRequest = { name: 'MINIMAL', description: '', scopeNames: [] };
        const mockResponse = { results: [{ ...mockRole, name: 'MINIMAL', description: '' }] };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await roleService.createRole(request);
        expect(result?.description).toBe('');
      });

      it('should handle role update with undefined description', async () => {
        const request: UpdateRoleRequest = { description: undefined, scopeNames: [] };
        const mockResponse = { results: [mockRole] };
        (userManagementApi.patch as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.updateRole('ADMIN', request);
        expect(userManagementApi.patch).toHaveBeenCalled();
      });

      it('should handle role creation with empty scopes array', async () => {
        const request: CreateRoleRequest = { name: 'NO_SCOPES', description: 'No scopes', scopeNames: [] };
        const mockResponse = { results: [{ ...mockRole, scopeNames: [] }] };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await roleService.createRole(request);
        expect(result?.scopes).toEqual([]);
      });

      it('should handle role creation with many scopes', async () => {
        const request: CreateRoleRequest = {
          name: 'SUPERADMIN',
          description: 'Super admin',
          scopeNames: Array.from({ length: 50 }, (_, i) => `scope-${i}`)
        };
        const mockResponse = { results: [mockRole] };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.createRole(request);
        expect(userManagementApi.post).toHaveBeenCalledWith('/v1/roles', request);
      });

      it('should handle role name with special characters', async () => {
        const request: CreateRoleRequest = {
          name: 'ROLE_WITH-SPECIAL.CHARS',
          description: 'Special',
          scopeNames: []
        };
        const mockResponse = { results: [mockRole] };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.createRole(request);
        expect(userManagementApi.post).toHaveBeenCalledWith('/v1/roles', request);
      });
    });

    describe('Edge Cases for Delete', () => {
      it('should handle deletion of role with special characters', async () => {
        (userManagementApi.delete as jest.Mock).mockResolvedValue({});

        await roleService.deleteRole('ROLE-WITH.SPECIAL_CHARS');
        expect(userManagementApi.delete).toHaveBeenCalledWith('/v1/roles/ROLE-WITH.SPECIAL_CHARS');
      });

      it('should handle deletion of empty string role name', async () => {
        const error = new Error('Invalid role name');
        (userManagementApi.delete as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw error; });

        await expect(roleService.deleteRole('')).rejects.toThrow('Invalid role name');
      });
    });

    describe('Pagination Edge Cases', () => {
      it('should handle getRoles with zero pageSize', async () => {
        const mockResponse = { results: [] };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.getRoles({ page: 0, size: 0 });
        expect(userManagementApi.post).toHaveBeenCalledWith(
          '/v1/roles/filter',
          { roles: [] },
          { params: { pageNumber: 0, pageSize: 0 } }
        );
      });

      it('should handle getRoles with negative pagination values', async () => {
        const mockResponse = { results: mockRoles };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.getRoles({ page: -1, size: -10 });
        expect(userManagementApi.post).toHaveBeenCalledWith(
          '/v1/roles/filter',
          { roles: [] },
          { params: { pageNumber: -1, pageSize: -10 } }
        );
      });

      it('should handle getRoles with very large pageSize', async () => {
        const mockResponse = { results: mockRoles };
        (userManagementApi.post as jest.Mock).mockResolvedValue(mockResponse);

        await roleService.getRoles({ page: 0, size: 10000 });
        expect(userManagementApi.post).toHaveBeenCalledWith(
          '/v1/roles/filter',
          { roles: [] },
          { params: { pageNumber: 0, pageSize: 10000 } }
        );
      });
    });
  });
});
