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
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilterRequest,
  PaginatedResponse,
  FilterParams,
} from '@/types';
import { API_CONFIG } from '@/config/app.config';
import { userManagementApi } from './api-client';
import { createResource, updateResource, deleteResource, getResource, buildQueryParams } from '@/utils/serviceHelpers';
import { fetchWithTokenRefresh } from './apiUtils';

/**
 * Service class for managing role operations
 * Handles CRUD operations for roles and role-scope associations
 */
export class RoleService {
  /**
   * Retrieves a paginated list of roles with optional filtering
   * @param {Object} params Pagination parameters and optional role filter
   * @returns {Promise<PaginatedResponse<Role>>} Promise resolving to paginated response containing roles
   * @throws Error if the API request fails
   */
  async getRoles(params: FilterParams & { filter?: RoleFilterRequest }): Promise<PaginatedResponse<Role>> {
    // Build filter request - backend requires roles field even if empty
    const filterRequest: Record<string, string[]> = {
      roles: params.filter?.name ? [params.filter.name] : []
    };

    const queryParams = buildQueryParams({
      page: params.page,
      pageSize: params.size,
    });

    const urlPath = `${API_CONFIG.API_BASE_URL}/v1/roles/filter`;
    const finalUrl = queryParams ? `${urlPath}?${new URLSearchParams(queryParams)}` : urlPath;

    const correlationId = crypto.randomUUID();
    console.log('Role Service - Getting roles:', { url: finalUrl, filterRequest, correlationId });

    try {
      const response = await fetchWithTokenRefresh(finalUrl, {
        method: 'POST',
        headers: {
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify(filterRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Role Service - HTTP error:', { status: response.status, error: errorText, correlationId });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data: { results?: Role[]; messages?: string[] } = await response.json();
      const results = data.results || [];
      
      console.log('Role Service - Success:', { resultsCount: results.length, correlationId });
      
      // Get total count for pagination
      let totalCount = results.length;
      
      // If we got a full page of results, there might be more - fetch total count
      if (results.length === params.size) {
        try {
          const totalResponse = await fetchWithTokenRefresh(`${urlPath}?page=0&pageSize=10000`, {
            method: 'POST',
            headers: {
              'X-Correlation-ID': crypto.randomUUID(),
            },
            body: JSON.stringify(filterRequest),
          });
          
          if (totalResponse.ok) {
            const totalData: { results?: Role[] } = await totalResponse.json();
            totalCount = (totalData.results || []).length;
            console.log('Role Service - Total count fetched:', totalCount);
          }
        } catch (error) {
          console.warn('Role Service - Failed to get total count, using current results:', error);
          // If total count fetch fails, estimate based on current page
          totalCount = params.page * params.size + results.length;
        }
      } else {
        // Current page has fewer results than requested, so we know the total
        totalCount = params.page * params.size + results.length;
      }
      
      return {
        content: results,
        totalElements: totalCount,
        totalPages: Math.ceil(totalCount / params.size),
        size: params.size,
        number: params.page,
        first: params.page === 0,
        last: params.page >= Math.ceil(totalCount / params.size) - 1,
      };
    } catch (error: unknown) {
      console.error('Role Service - Error details:', { error, correlationId });
      throw error instanceof Error ? error : new Error('Failed to fetch roles');
    }
  }

  /**
   * Retrieves a single role by its name
   * @param {string} name - The unique name of the role
   * @returns {Promise<Role>} The role details
   * @throws {Error} If the role is not found
   */
  async getRoleByName(name: string): Promise<Role> {
    console.log('Role Service - Getting role by name:', name);
    return getResource<Role>(`/v1/roles/${name}`);
  }

  /**
   * Retrieves multiple roles by their IDs
   * @param {number[]} roleIds - Array of role IDs to retrieve
   * @returns {Promise<Role[]>} Array of role objects
   */
  async getRolesByIds(roleIds: number[]): Promise<Role[]> {
    console.log('Role Service - Getting roles by IDs:', roleIds);
    const response: { results?: Role[] } = await userManagementApi.post('/v1/roles/rolesById', { roleId: roleIds });
    return response.results || [];
  }

  /**
   * Creates a new role in the system
   * @param {CreateRoleRequest} roleData - The role data for creation
   * @returns {Promise<Role>} The created role object
   * @throws {Error} If role creation fails
   */
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    console.log('=== CREATE ROLE DEBUG START ===');
    console.log('Role Service - Creating role with data:', roleData);
    
    const role = await createResource<CreateRoleRequest, Role>('/v1/roles', roleData, {
      errorMessage: 'Failed to create role: No result returned'
    });
    
    console.log('Returning created role:', role);
    console.log('=== CREATE ROLE DEBUG END ===');
    return role;
  }

  /**
   * Updates an existing role
   * @param {string} name - The unique name of the role to update
   * @param {UpdateRoleRequest} roleData - The role data to update
   * @returns {Promise<Role>} The updated role object
   * @throws {Error} If role update fails
   */
  async updateRole(name: string, roleData: UpdateRoleRequest): Promise<Role> {
    console.log('=== UPDATE ROLE DEBUG START ===');
    console.log('Role Service - Updating role with data:', { name, roleData });
    
    const role = await updateResource<UpdateRoleRequest, Role>(`/v1/roles/${name}`, roleData, {
      errorMessage: `Failed to update role ${name}: No result returned`
    });
    
    console.log('Returning updated role:', role);
    console.log('=== UPDATE ROLE DEBUG END ===');
    return role;
  }

  /**
   * Deletes a role by its name
   * @param {string} name - The unique name of the role to delete
   * @returns {Promise<void>} Completes when role is deleted
   * @throws {Error} If role deletion fails
   */
  async deleteRole(name: string): Promise<void> {
    console.log('Role Service - Deleting role:', name);
    await deleteResource(`/v1/roles/${name}`);
  }

  /**
   * Retrieves all roles in the system
   * @returns {Promise<Role[]>} Array of all role objects
   */
  async getAllRoles(): Promise<Role[]> {
    console.log('Role Service - Getting all roles');
    const response = await this.getRoles({
      page: 0,
      size: 1000,
    });
    return response.content;
  }

  // Legacy methods for backward compatibility
  /**
   * Assigns scopes to a role (legacy method for backward compatibility)
   * @param {string} roleName - The name of the role
   * @param {string[]} scopeNames - Array of scope names to assign
   * @returns {Promise<Role>} The updated role with assigned scopes
   */
  async assignScopesToRole(roleName: string, scopeNames: string[]): Promise<Role> {
    return this.updateRole(roleName, { scopeNames });
  }

  /**
   * Removes scopes from a role (legacy method for backward compatibility)
   * @param {string} roleName - The name of the role
   * @param {string[]} scopeNames - Array of scope names to remove
   * @returns {Promise<Role>} The updated role with removed scopes
   */
  async removeScopesFromRole(roleName: string, scopeNames: string[]): Promise<Role> {
    const currentRole = await this.getRoleByName(roleName);
    const currentScopeNames = currentRole.scopes?.map(scope => scope.name) || [];
    const updatedScopeNames = currentScopeNames.filter(name => !scopeNames.includes(name));
    
    return this.updateRole(roleName, { scopeNames: updatedScopeNames });
  }
}

export const roleService = new RoleService();
