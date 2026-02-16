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
  Scope,
  CreateScopeRequest,
  UpdateScopeRequest,
  ScopeFilterRequest,
  PaginatedResponse,
  FilterParams,
} from '@/types';
import { API_CONFIG } from '@/config/app.config';
import { createResource, updateResource, deleteResource, getResource, buildQueryParams } from '@/utils/serviceHelpers';
import { fetchWithTokenRefresh } from './apiUtils';

/**
 * Service class for managing scope operations
 * Handles CRUD operations for OAuth2 scopes
 */
export class ScopeService {
  /**
   * Retrieves a paginated list of scopes with optional filtering
   * @param {Object} params Pagination parameters and optional scope filter
   * @returns {Promise<PaginatedResponse<Scope>>} Promise resolving to paginated response containing scopes
   * @throws Error if the API request fails
   */
  async getScopes(params: FilterParams & { filter?: ScopeFilterRequest }): Promise<PaginatedResponse<Scope>> {
    // Build filter request - backend requires scopes field even if empty
    const filterRequest: Record<string, string[]> = {
      scopes: params.filter?.name ? [params.filter.name] : []
    };

    const queryParams = buildQueryParams({
      page: params.page,
      pageSize: params.size,
    });

    const urlPath = `${API_CONFIG.API_BASE_URL}/v1/scopes/filter`;
    const finalUrl = queryParams ? `${urlPath}?${new URLSearchParams(queryParams)}` : urlPath;

    const correlationId = crypto.randomUUID();
    console.log('Scope Service - Getting scopes:', { url: finalUrl, filterRequest, correlationId });
    
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
        console.error('Scope Service - HTTP error:', { status: response.status, error: errorText, correlationId });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data: { results?: Scope[]; messages?: string[] } = await response.json();
      const results = data.results || [];
      
      console.log('Scope Service - Success:', { resultsCount: results.length, correlationId });
      
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
            const totalData: { results?: Scope[] } = await totalResponse.json();
            totalCount = (totalData.results || []).length;
            console.log('Scope Service - Total count fetched:', totalCount);
          }
        } catch (error) {
          console.warn('Scope Service - Failed to get total count, using current results:', error);
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
      console.error('Scope Service - Error details:', { error, correlationId });
      throw error instanceof Error ? error : new Error('Failed to fetch scopes');
    }
  }

  /**
   * Retrieves a single scope by its name
   * @param {string} name - The unique name of the scope
   * @returns {Promise<Scope>} The scope details
   * @throws {Error} If the scope is not found
   */
  async getScopeByName(name: string): Promise<Scope> {
    console.log('Scope Service - Getting scope by name:', name);
    return getResource<Scope>(`/v1/scopes/${name}`, {
      extractResult: (response) => {
        const results = response.results as Scope[] | undefined;
        if (results && Array.isArray(results) && results.length > 0) return results[0];
        if (response.data) return response.data as Scope;
        throw new Error(`Scope with name ${name} not found`);
      }
    });
  }

  /**
   * Creates a new scope in the system
   * @param {CreateScopeRequest} scopeData - The scope data for creation
   * @returns {Promise<Scope>} The created scope object
   * @throws {Error} If scope creation fails
   */
  async createScope(scopeData: CreateScopeRequest): Promise<Scope> {
    console.log('=== CREATE SCOPE DEBUG START ===');
    console.log('Scope Service - Creating scope with data:', scopeData);
    
    const scope = await createResource<CreateScopeRequest, Scope>('/v1/scopes', scopeData, {
      errorMessage: 'Failed to create scope: No result returned'
    });
    
    console.log('Returning created scope:', scope);
    console.log('=== CREATE SCOPE DEBUG END ===');
    return scope;
  }

  /**
   * Updates an existing scope
   * @param {string} name - The unique name of the scope to update
   * @param {UpdateScopeRequest} scopeData - The scope data to update
   * @returns {Promise<Scope>} The updated scope object
   * @throws {Error} If scope update fails
   */
  async updateScope(name: string, scopeData: UpdateScopeRequest): Promise<Scope> {
    console.log('=== UPDATE SCOPE DEBUG START ===');
    console.log('Scope Service - Updating scope with data:', { name, scopeData });
    
    const scope = await updateResource<UpdateScopeRequest, Scope>(`/v1/scopes/${name}`, scopeData, {
      errorMessage: `Failed to update scope ${name}: No result returned`
    });
    
    console.log('Returning updated scope:', scope);
    console.log('=== UPDATE SCOPE DEBUG END ===');
    return scope;
  }

  /**
   * Deletes a scope by its name
   * @param {string} name - The unique name of the scope to delete
   * @returns {Promise<void>} Completes when scope is deleted
   * @throws {Error} If scope deletion fails
   */
  async deleteScope(name: string): Promise<void> {
    console.log('Scope Service - Deleting scope:', name);
    await deleteResource(`/v1/scopes/${name}`);
  }

  /**
   * Retrieves all scopes in the system for dropdowns and selections
   * @returns {Promise<Scope[]>} Array of all scope objects
   */
  async getAllScopes(): Promise<Scope[]> {
    console.log('Scope Service - Getting all scopes');
    const response = await this.getScopes({
      page: 0,
      size: 1000, // Get all scopes for dropdowns
    });
    return response.content;
  }
}
