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
 * Shared utilities for API services
 * Provides common functionality for handling API requests and responses
 */

/**
 * Helper method to handle API response errors
 * @param response - The fetch Response object
 * @param context - Optional context string for error logging (e.g., 'Account', 'User')
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function handleApiResponse<T>(response: Response, context: string = 'API'): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${context} error:`, response.status, response.statusText, errorText);
    
    // Try to parse error as JSON, fallback to text
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
    } catch {
      // If not valid JSON, use the text response or default message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get common headers for API requests
 * Automatically includes Authorization header if token is present in localStorage
 * @returns Headers object ready for fetch requests
 */
export function getApiHeaders(): HeadersInit {
  // Get token from localStorage (set by auth.service.ts after successful login)
  const token = localStorage.getItem('uidam_admin_token');
  
  // Generate correlation ID for request tracking
  const correlationId = crypto.randomUUID();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Correlation-ID': correlationId,
  };

  // Add authorization header if token is available
  // API Gateway will extract user_id, tenant_id, created_by, modified_by, etc. from the JWT token automatically
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Generic wrapper for fetch requests with consistent error handling
 * @param url - The URL to fetch
 * @param options - Fetch options (method, body, etc.)
 * @param context - Context for error logging (e.g., 'create account', 'update user')
 * @returns Promise with success/error structure
 */
export async function makeFetchRequest<T>(
  url: string,
  options: RequestInit,
  context: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers = {
      ...getApiHeaders(),
      ...options.headers,
    };
    const correlationId = (headers as Record<string, string>)['X-Correlation-ID'];
    
    console.log('Fetch Request:', {
      url,
      method: options.method || 'GET',
      context,
      correlationId
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const correlationId = (headers as Record<string, string>)['X-Correlation-ID'];
      console.error(`${context} error:`, {
        status: response.status,
        statusText: response.statusText,
        correlationId,
        error: errorText
      });
      
      return {
        success: false,
        error: `Failed to ${context}: ${response.statusText}`
      };
    }

    // Try to parse as JSON, fallback to text
    let data: T;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    console.log(`${context} success:`, {
      correlationId,
      hasData: !!data
    });

    return {
      success: true,
      data: data
    };
  } catch (err) {
    const correlationId = crypto.randomUUID();
    console.error(`Error ${context}:`, {
      correlationId,
      error: err
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : `Failed to ${context}`
    };
  }
}
