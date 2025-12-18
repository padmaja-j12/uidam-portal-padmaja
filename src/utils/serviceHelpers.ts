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
// Service Helper Utilities
// Common patterns to reduce code duplication across service files

import { userManagementApi } from '@/services/api-client';
import { handleApiError } from './apiErrorHandler';

/**
 * Generic create operation helper
 */
export async function createResource<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
  options?: {
    extractResult?: (response: Record<string, unknown>) => TResponse;
    validateResult?: (result: TResponse) => void;
    errorMessage?: string;
  }
): Promise<TResponse> {
  try {
    const response = await userManagementApi.post(endpoint, data) as Record<string, unknown>;
    let result: TResponse | undefined;
    
    if (options?.extractResult) {
      result = options.extractResult(response);
    } else {
      // Try results[0], then data, then response itself (if it looks like the actual object)
      const results = response.results as unknown[];
      if (results && Array.isArray(results) && results.length > 0) {
        result = results[0] as TResponse;
      } else if (response.data) {
        result = response.data as TResponse;
      } else if (response.results === undefined && response.data === undefined) {
        // If response doesn't have results or data properties, assume it's the object itself
        result = response as TResponse;
      }
    }
    
    if (!result) {
      throw new Error(options?.errorMessage ?? 'Failed to create resource: No result returned');
    }
    
    return result;
  } catch (error) {
    // Only call handleApiError for non-custom errors
    if (!(error instanceof Error && error.message.includes('No result returned'))) {
      handleApiError(error);
    }
    throw error;
  }
}

/**
 * Generic update operation helper
 */
export async function updateResource<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
  options?: {
    extractResult?: (response: Record<string, unknown>) => TResponse;
    validateResult?: (result: TResponse) => void;
    errorMessage?: string;
  }
): Promise<TResponse> {
  try {
    const response = await userManagementApi.patch(endpoint, data) as Record<string, unknown>;
    let result: TResponse | undefined;
    
    if (options?.extractResult) {
      result = options.extractResult(response);
    } else {
      // Try results[0], then data, then response itself (if it looks like the actual object)
      const results = response.results as unknown[];
      if (results && Array.isArray(results) && results.length > 0) {
        result = results[0] as TResponse;
      } else if (response.data) {
        result = response.data as TResponse;
      } else if (response.results === undefined && response.data === undefined) {
        // If response doesn't have results or data properties, assume it's the object itself
        result = response as TResponse;
      }
    }
    
    if (!result) {
      throw new Error(options?.errorMessage ?? 'Failed to update resource: No result returned');
    }
    
    return result;
  } catch (error) {
    // Only call handleApiError for non-custom errors
    if (!(error instanceof Error && error.message.includes('No result returned'))) {
      handleApiError(error);
    }
    throw error;
  }
}

/**
 * Generic delete operation helper
 */
export async function deleteResource(
  endpoint: string,
  _options?: {
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await userManagementApi.delete(endpoint);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Generic get operation helper
 */
export async function getResource<TResponse>(
  endpoint: string,
  options?: {
    extractResult?: (response: Record<string, unknown>) => TResponse;
    errorMessage?: string;
  }
): Promise<TResponse> {
  try {
    const response = await userManagementApi.get(endpoint) as Record<string, unknown>;
    
    let result: TResponse | undefined;
    if (options?.extractResult) {
      result = options.extractResult(response);
    } else {
      const results = response.results as unknown[];
      result = (results?.[0] as TResponse | undefined) ?? (response.data as TResponse | undefined) ?? (response as TResponse);
    }
    
    // If result is still falsy after all extraction attempts, throw error
    if (!result) {
      throw new Error(options?.errorMessage ?? 'Resource not found');
    }
    
    return result;
  } catch (error) {
    // Only call handleApiError for non-custom errors
    if (!(error instanceof Error && (error.message.includes('not found') || error.message.includes('No result returned')))) {
      handleApiError(error);
    }
    throw error;
  }
}

/**
 * Generic list/filter operation helper with pagination
 */
export async function listResources<TResponse>(
  endpoint: string,
  filterData?: Record<string, unknown>,
  queryParams?: Record<string, string>,
  options?: {
    extractResult?: (response: Record<string, unknown>) => TResponse;
  }
): Promise<TResponse> {
  try {
    const query = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
    const fullEndpoint = `${endpoint}${query}`;
    
    const response = await userManagementApi.post(fullEndpoint, filterData ?? {}) as Record<string, unknown>;
    
    if (options?.extractResult) {
      return options.extractResult(response);
    }
    
    return response as TResponse;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Build query parameters from filter params
 */
export function buildQueryParams(params: Record<string, string | number | boolean | undefined | null>): Record<string, string> {
  const queryParams: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams[key] = String(value);
    }
  });
  
  return queryParams;
}
