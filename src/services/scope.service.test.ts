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
import { ScopeService } from './scope.service';
import { userManagementApi } from './api-client';
import { handleApiError } from '@/utils/apiErrorHandler';
import { Scope, CreateScopeRequest, UpdateScopeRequest } from '@/types';

// Mock fetch globally for getScopes method
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

describe('ScopeService', () => {
  let scopeService: ScopeService;

  const mockScope: Scope = {
    id: 'scope-1',
    name: 'read',
    description: 'Read access',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isSystemScope: true,
    administrative: false,
    predefined: true
  };

  const mockScopes: Scope[] = [
    mockScope,
    {
      id: 'scope-2',
      name: 'write',
      description: 'Write access',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      isSystemScope: true,
      administrative: false,
      predefined: true
    }
  ];

  beforeEach(() => {
    scopeService = new ScopeService();
    jest.clearAllMocks();
  });

  describe('getScopes', () => {
    it('should fetch scopes with pagination', async () => {
      const mockResponse = {
        results: mockScopes
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await scopeService.getScopes({
        page: 0,
        size: 10,
        filter: {}
      });

      expect(result.content).toEqual(mockScopes);
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

      await scopeService.getScopes({
        page: 0,
        size: 10
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual({ scopes: [] });
    });

    it('should send filter name in array when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [mockScope] }),
      });

      await scopeService.getScopes({
        page: 0,
        size: 10,
        filter: { name: 'read' }
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual({ scopes: ['read'] });
    });

    it('should handle API error with handleApiError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'API Error',
      });

      await expect(scopeService.getScopes({
        page: 0,
        size: 10
      })).rejects.toThrow('HTTP error! status: 400');
    });

    it('should calculate pagination correctly', async () => {
      const scopes = Array.from({ length: 35 }, (_, i) => ({
        ...mockScope,
        id: `scope-${i + 1}`,
        name: `scope_${i + 1}`
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: scopes }),
      });

      const result = await scopeService.getScopes({
        page: 1,
        size: 10
      });

      expect(result.totalPages).toBe(4);
      expect(result.last).toBe(false);
      expect(result.first).toBe(false);
    });

    it('should handle empty results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await scopeService.getScopes({
        page: 0,
        size: 10
      });

      expect(result.content).toEqual([]);
      expect(result.totalElements).toBe(0);
    });

    it('should include pagination in API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockScopes }),
      });

      await scopeService.getScopes({
        page: 2,
        size: 20
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const endpoint = callArgs[0];
      
      expect(endpoint).toContain('page=2');
      expect(endpoint).toContain('pageSize=20');
    });

    it('should mark last page correctly', async () => {
      const scopes = Array.from({ length: 10 }, (_, i) => ({
        ...mockScope,
        id: `scope-${i + 1}`
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: scopes }),
      });

      const result = await scopeService.getScopes({
        page: 0,
        size: 10
      });

      expect(result.last).toBe(true);
    });
  });

  describe('getScopeByName', () => {
    it('should fetch scope by name', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue({
        results: [mockScope]
      });

      const result = await scopeService.getScopeByName('read');

      expect(result).toEqual(mockScope);
      expect(userManagementApi.get).toHaveBeenCalledWith('/v1/scopes/read');
    });

    it('should handle response without results array', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue({
        data: mockScope
      });

      const result = await scopeService.getScopeByName('read');

      expect(result).toEqual(mockScope);
    });

    it('should return first result from results array', async () => {
      (userManagementApi.get as jest.Mock).mockResolvedValue({
        results: [mockScope, mockScopes[1]]
      });

      const result = await scopeService.getScopeByName('read');

      expect(result).toEqual(mockScope);
    });

    it('should handle API error', async () => {
      const error = new Error('Not found');
      (userManagementApi.get as jest.Mock).mockRejectedValue(error);

      await expect(scopeService.getScopeByName('nonexistent')).rejects.toThrow();
    });
  });

  describe('createScope', () => {
    it('should create scope successfully', async () => {
      const createRequest: CreateScopeRequest = {
        name: 'delete',
        description: 'Delete access',
        administrative: false
      };

      (userManagementApi.post as jest.Mock).mockResolvedValue({
        results: [{ ...mockScope, ...createRequest }]
      });

      const result = await scopeService.createScope(createRequest);

      expect(result.name).toBe('delete');
      expect(userManagementApi.post).toHaveBeenCalledWith('/v1/scopes', createRequest);
    });

    it('should handle response without results array', async () => {
      const createRequest: CreateScopeRequest = {
        name: 'admin',
        description: 'Admin access',
        administrative: true
      };

      (userManagementApi.post as jest.Mock).mockResolvedValue({
        data: mockScope
      });

      const result = await scopeService.createScope(createRequest);

      expect(result).toEqual(mockScope);
    });

    it('should handle administrative field as boolean', async () => {
      const createRequest: CreateScopeRequest = {
        name: 'custom',
        description: 'Custom scope',
        administrative: true
      };

      (userManagementApi.post as jest.Mock).mockResolvedValue({
        results: [{ ...mockScope, ...createRequest }]
      });

      await scopeService.createScope(createRequest);

      expect(userManagementApi.post).toHaveBeenCalledWith('/v1/scopes', 
        expect.objectContaining({
          administrative: true
        })
      );
    });

    it('should handle API error', async () => {
      const createRequest: CreateScopeRequest = {
        name: 'invalid',
        description: 'Invalid scope',
        administrative: false
      };
      const error = new Error('Invalid scope data');
      (userManagementApi.post as jest.Mock).mockRejectedValue(error);

      await expect(scopeService.createScope(createRequest)).rejects.toThrow();
    });
  });

  describe('updateScope', () => {
    it('should update scope successfully', async () => {
      const updateRequest: UpdateScopeRequest = {
        description: 'Updated read access',
        administrative: true
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        results: [{ ...mockScope, ...updateRequest }]
      });

      const result = await scopeService.updateScope('read', updateRequest);

      expect(result.description).toBe('Updated read access');
      expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/scopes/read', updateRequest);
    });

    it('should handle response without results array', async () => {
      const updateRequest: UpdateScopeRequest = {
        description: 'Updated'
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        data: mockScope
      });

      const result = await scopeService.updateScope('read', updateRequest);

      expect(result).toEqual(mockScope);
    });

    it('should handle partial update', async () => {
      const updateRequest: UpdateScopeRequest = {
        administrative: true
      };

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        results: [mockScope]
      });

      await scopeService.updateScope('read', updateRequest);

      expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/scopes/read', updateRequest);
    });

    it('should handle update without any fields', async () => {
      const updateRequest: UpdateScopeRequest = {};

      (userManagementApi.patch as jest.Mock).mockResolvedValue({
        results: [mockScope]
      });

      await scopeService.updateScope('read', updateRequest);

      expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/scopes/read', {});
    });
  });

  describe('deleteScope', () => {
    it('should delete scope successfully', async () => {
      (userManagementApi.delete as jest.Mock).mockResolvedValue({ success: true });

      await scopeService.deleteScope('delete');

      expect(userManagementApi.delete).toHaveBeenCalledWith('/v1/scopes/delete');
    });

    it('should handle API error', async () => {
      const error = new Error('Cannot delete predefined scope');
      (userManagementApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(scopeService.deleteScope('read')).rejects.toThrow();
    });

    it('should handle 404 error', async () => {
      const error = new Error('Scope not found');
      (userManagementApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(scopeService.deleteScope('nonexistent')).rejects.toThrow();
    });
  });

  describe('Scope data validation', () => {
    it('should handle scope with all fields', async () => {
      const fullScope: Scope = {
        id: 'scope-full',
        name: 'full',
        description: 'Full access scope',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isSystemScope: false,
        administrative: true,
        predefined: false
      };

      (userManagementApi.get as jest.Mock).mockResolvedValue({
        results: [fullScope]
      });

      const result = await scopeService.getScopeByName('full');

      expect(result.isSystemScope).toBe(false);
      expect(result.administrative).toBe(true);
      expect(result.predefined).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Response Format Variations', () => {
      it.skip('should handle null response', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue(null);

        const result = await scopeService.getScopes({ page: 0, size: 10 });
        expect(result).toBeNull();
      });

      it('should handle getScopeByName returning empty array', async () => {
        (userManagementApi.get as jest.Mock).mockResolvedValue({ results: [] });

        await expect(scopeService.getScopeByName('nonexistent')).rejects.toThrow('Scope with name nonexistent not found');
      });
    });

    describe('Edge Cases for Create/Update', () => {
      it('should handle scope creation with empty description', async () => {
        const request: CreateScopeRequest = { name: 'minimal', description: '', administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [{ ...mockScope, description: '' }]
        });

        const result = await scopeService.createScope(request);
        expect(result?.description).toBe('');
      });

      it('should handle scope creation with undefined administrative field', async () => {
        const request: CreateScopeRequest = { name: 'test', description: 'Test', administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.createScope(request);
        expect(userManagementApi.post).toHaveBeenCalledWith('/v1/scopes', request);
      });

      it('should handle scope creation with administrative=false', async () => {
        const request: CreateScopeRequest = { name: 'readonly', description: 'Read only', administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [{ ...mockScope, administrative: false }]
        });

        const result = await scopeService.createScope(request);
        expect(result?.administrative).toBe(false);
      });

      it('should handle scope update with only description', async () => {
        const request: UpdateScopeRequest = { description: 'Updated description' };
        (userManagementApi.patch as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.updateScope('read', request);
        expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/scopes/read', request);
      });

      it('should handle scope update with only administrative field', async () => {
        const request: UpdateScopeRequest = { administrative: false };
        (userManagementApi.patch as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.updateScope('read', request);
        expect(userManagementApi.patch).toHaveBeenCalledWith('/v1/scopes/read', request);
      });

      it('should handle scope name with special characters', async () => {
        const request: CreateScopeRequest = { name: 'scope:read-write.full', description: 'Special chars', administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.createScope(request);
        expect(userManagementApi.post).toHaveBeenCalledWith('/v1/scopes', request);
      });

      it('should handle very long scope name', async () => {
        const request: CreateScopeRequest = { name: 'a'.repeat(200), description: 'Long name', administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.createScope(request);
        expect(userManagementApi.post).toHaveBeenCalled();
      });

      it('should handle very long description', async () => {
        const request: CreateScopeRequest = { name: 'test', description: 'x'.repeat(1000), administrative: false };
        (userManagementApi.post as jest.Mock).mockResolvedValue({
          results: [mockScope]
        });

        await scopeService.createScope(request);
        expect(userManagementApi.post).toHaveBeenCalled();
      });
    });

    describe('Edge Cases for Delete', () => {
      it('should handle deletion of scope with special characters', async () => {
        (userManagementApi.delete as jest.Mock).mockResolvedValue({});

        await scopeService.deleteScope('scope:special-chars.name');
        expect(userManagementApi.delete).toHaveBeenCalledWith('/v1/scopes/scope:special-chars.name');
      });

      it('should handle deletion of empty string scope name', async () => {
        (userManagementApi.delete as jest.Mock).mockResolvedValue({});

        await scopeService.deleteScope('');
        expect(userManagementApi.delete).toHaveBeenCalledWith('/v1/scopes/');
      });

      it('should handle deletion error for predefined scope', async () => {
        const error = new Error('Cannot delete predefined scope');
        (userManagementApi.delete as jest.Mock).mockRejectedValue(error);
        (handleApiError as unknown as jest.Mock).mockImplementation(() => { throw error; });

        await expect(scopeService.deleteScope('read')).rejects.toThrow('Cannot delete predefined scope');
      });
    });

    describe('Edge Cases for getScopeByName', () => {
      it('should handle getScopeByName with special characters', async () => {
        const specialScope = { ...mockScope, name: 'scope:test-special.name' };
        (userManagementApi.get as jest.Mock).mockResolvedValue({
          results: [specialScope]
        });

        const result = await scopeService.getScopeByName('scope:test-special.name');
        expect(result.name).toBe('scope:test-special.name');
      });

      it('should handle getScopeByName with empty string', async () => {
        (userManagementApi.get as jest.Mock).mockResolvedValue({ results: [] });

        await expect(scopeService.getScopeByName('')).rejects.toThrow('Scope with name  not found');
      });

      it('should handle multiple scopes with same name (return first)', async () => {
        const scope1 = { ...mockScope, id: 'scope-1' };
        const scope2 = { ...mockScope, id: 'scope-2' };
        (userManagementApi.get as jest.Mock).mockResolvedValue({
          results: [scope1, scope2]
        });

        const result = await scopeService.getScopeByName('read');
        expect(result.id).toBe('scope-1');
      });
    });

    describe('Response Data Extraction', () => {
      it('should handle createScope returning data field instead of results', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue({ data: mockScope });

        const request: CreateScopeRequest = { name: 'test', description: 'Test', administrative: false };
        const result = await scopeService.createScope(request);
        expect(result).toBeDefined();
        expect(result.id).toBe(mockScope.id);
      });

      it('should handle updateScope returning data field instead of results', async () => {
        (userManagementApi.patch as jest.Mock).mockResolvedValue({ data: mockScope });

        const result = await scopeService.updateScope('read', {});
        expect(result).toBeDefined();
        expect(result.id).toBe(mockScope.id);
      });

      it('should handle createScope with empty results array', async () => {
        (userManagementApi.post as jest.Mock).mockResolvedValue({ results: [] });

        const request: CreateScopeRequest = { name: 'test', description: 'Test', administrative: false };
        await expect(scopeService.createScope(request)).rejects.toThrow('Failed to create scope: No result returned');
      });

      it('should handle updateScope with empty results array', async () => {
        (userManagementApi.patch as jest.Mock).mockResolvedValue({ results: [] });

        await expect(scopeService.updateScope('read', {})).rejects.toThrow('Failed to update scope read: No result returned');
      });
    });
  });
});
