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
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, OAUTH_CONFIG } from '@config/app.config';

/**
 * API client for making HTTP requests to the backend
 * Handles authentication, error handling, and request/response interceptors
 */
class ApiClient {
  private readonly axiosInstance: AxiosInstance;

  /**
   * Creates an instance of ApiClient
   * @param {string} baseURL - The base URL for API requests
   */
  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_CONFIG.API_TIMEOUT,
      // Using JWT Bearer tokens for authentication, no need for credentials/cookies
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Sets up request and response interceptors for the axios instance
   * Adds authentication tokens, correlation IDs, and handles token refresh
   * @private
   */
  private setupInterceptors() {
    // Request interceptor to add auth token and required headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Generate correlation ID for request tracking
        const correlationId = crypto.randomUUID();
        if (config.headers) {
          config.headers['X-Correlation-ID'] = correlationId;
        }

        const token = this.getStoredToken();
        console.log('API Request Debug:', {
          url: config.url,
          baseURL: config.baseURL,
          method: config.method,
          correlationId,
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'NO_TOKEN'
        });

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Extract user-id from JWT token and add as header
          // Some endpoints require explicit user-id header even with API Gateway
          // NOSONAR - atob() required for JWT token decoding (standard practice)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.user_id) {
              config.headers['user-id'] = payload.user_id;
            }
          } catch (e) {
            console.warn('Failed to decode JWT token:', e);
          }
        }

        // API Gateway will automatically extract and add required headers from JWT token:
        // - tenant-id (from tenantId claim)
        // - created-by, modified-by (from user_id claim)
        // - scopes (from scopes claim)
        // Note: user-id is now manually added above for compatibility
        
        console.log('Request Headers:', {
          Authorization: config.headers?.Authorization ? 'Bearer ***' : 'NOT_SET',
          'user-id': config.headers?.['user-id'] || 'NOT_SET',
          'Content-Type': config.headers?.['Content-Type'] || 'application/json',
          'X-Correlation-ID': config.headers?.['X-Correlation-ID'] || 'NOT_SET'
        });

        return config;
      },
      (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const correlationId = response.config.headers?.['X-Correlation-ID'];
        console.log('API Response Success:', {
          url: response.config.url,
          status: response.status,
          correlationId,
          hasData: !!response.data
        });
        return response;
      },
      async (error) => {
        const correlationId = error.config?.headers?.['X-Correlation-ID'];
        console.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          correlationId,
          isNetworkError: error.code === 'NETWORK_ERROR' || error.message === 'Network Error'
        });

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
              const newToken = await this.refreshAccessToken(refreshToken);
              this.setStoredToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.clearStoredTokens();
            // NOSONAR - Redirect to login required when token refresh fails
            window.location.href = '/login';
          }
        }

        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  }

  /**
   * Retrieves the stored authentication token from localStorage
   * @private
   * @returns {string | null} The stored token or null if not found
   */
  // NOSONAR - localStorage required for OAuth2 token storage (industry standard)
  private getStoredToken(): string | null {
    return localStorage.getItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
  }

  /**
   * Retrieves the stored refresh token from localStorage
   * @private
   * @returns {string | null} The stored refresh token or null if not found
   */
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Stores the authentication token in localStorage
   * @private
   * @param {string} token - The authentication token to store
   */
  private setStoredToken(token: string): void {
    localStorage.setItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY, token);
  }

  /**
   * Clears all stored tokens from localStorage
   * @private
   */
  private clearStoredTokens(): void {
    localStorage.removeItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Refreshes the access token using the refresh token
   * @private
   * @param {string} refreshToken - The refresh token to use
   * @returns {Promise<string>} A promise that resolves to the new access token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await axios.post(`${API_CONFIG.AUTH_SERVER_URL}/oauth2/token`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CONFIG.CLIENT_ID,
    });

    return response.data.access_token;
  }

  /**
   * Makes a GET request to the specified endpoint
   * @param {string} url - The endpoint URL
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration
   * @returns {Promise<T>} The response data
   * @template T The expected response type
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  /**
   * Makes a POST request to the specified endpoint
   * @param {string} url - The endpoint URL
   * @param {unknown} [data] - The request payload
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration
   * @returns {Promise<T>} The response data
   * @template T The expected response type
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request to the specified endpoint
   * @param {string} url - The endpoint URL
   * @param {unknown} [data] - The request payload
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration
   * @returns {Promise<T>} The response data
   * @template T The expected response type
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  /**
   * Makes a PATCH request to the specified endpoint
   * @param {string} url - The endpoint URL
   * @param {unknown} [data] - The request payload
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration
   * @returns {Promise<T>} The response data
   * @template T The expected response type
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request to the specified endpoint
   * @param {string} url - The endpoint URL
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration
   * @returns {Promise<T>} The response data
   * @template T The expected response type
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  /**
   * Sets the authorization token for future requests
   * @param {string} token - The authentication token to set
   */
  setAuthToken(token: string): void {
    this.setStoredToken(token);
  }

  /**
   * Clears the authorization token from storage
   */
  clearAuthToken(): void {
    this.clearStoredTokens();
  }
}

// Create API client instances
// Use full backend URL for production deployment
export const userManagementApi = new ApiClient(API_CONFIG.API_BASE_URL);
export const authServerApi = new ApiClient(API_CONFIG.AUTH_SERVER_URL);

export default ApiClient;
