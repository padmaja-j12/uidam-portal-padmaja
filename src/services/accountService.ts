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
// Account Management Service
// Comprehensive API integration for UIDAM Account Management APIs

import { AccountStatus } from '../types';
import { API_CONFIG } from '../config/app.config';
import { userManagementApi } from './api-client';
import { handleApiResponse, fetchWithTokenRefresh } from './apiUtils';
import { logger } from '../utils/logger';

// API Response interfaces-
export interface ApiResponse<T> {
  code?: string;
  message?: string;
  data?: T;
  httpStatus?: string;
}

// Account Management Interfaces
export interface Account {
  id: string;
  accountName: string;
  parentId?: string;
  roles: string[];
  status: AccountStatus;
  createdBy: string;
  createDate: string;
  updatedBy?: string;
  updateDate?: string;
  description?: string;
  type?: AccountType;
  children?: Account[];
}

export type AccountType = 'ROOT' | 'ORGANIZATION' | 'DEPARTMENT' | 'TEAM';

export interface CreateAccountRequest {
  accountName: string;
  parentId?: string;
  roles?: string[];
  description?: string;
  type?: AccountType;
}

export interface UpdateAccountRequest {
  accountName?: string;
  parentId?: string;
  roles?: string[];
  status?: AccountStatus;
  description?: string;
  type?: AccountType;
}

export interface AccountFilter {
  ids?: string[];
  accountNames?: string[];
  parentIds?: string[];
  roles?: string[];
  status?: string[];
}

export interface AccountSearchParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'IDS' | 'ACCOUNT_NAMES' | 'PARENTIDS' | 'ROLES' | 'STATUS' | 'TYPE' | 'CREATE_DATE';
  sortOrder?: 'DESC' | 'ASC';
  ignoreCase?: boolean;
  searchType?: 'PREFIX' | 'SUFFIX' | 'CONTAINS';
}

// Account Role Management Interfaces
export interface AccountRole {
  id: string;
  name: string;
  description?: string;
  accountId: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}



// User Account Role Mapping Interfaces
export interface UserAccountRoleMapping {
  userId: string;
  accountId: string;
  roleIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string;
  assignedBy: string;
}

export interface AssignUserToAccountRequest {
  userId: string;
  accountId: string;
  roleIds: string[];
}

export interface UpdateUserAccountRolesRequest {
  roleIds: string[];
}

// Account Management Service Class
/**
 * Service class for managing account operations
 * Handles CRUD operations, filtering, and user-account-role mappings
 */
export class AccountService {
  // =============================================================================
  // ACCOUNT MANAGEMENT APIs
  // =============================================================================

  /**
   * Creates a new account in the system
   * @param {CreateAccountRequest} account - The account data for creation
   * @returns {Promise<{ success: boolean; data?: Account; error?: string }>} Result object with success status and account data or error message
   */
  static async createAccount(account: CreateAccountRequest): Promise<{ success: boolean; data?: Account; error?: string }> {
    try {
      const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts`, {
        method: 'POST',
        body: JSON.stringify(account),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Account create error:', response.status, response.statusText, errorText);
        
        return {
          success: false,
          error: `Failed to create account: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (err) {
      logger.error('Error creating account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create account'
      };
    }
  }

  /**
   * Retrieves an account by its ID
   * @param {string} accountId - The unique identifier of the account
   * @returns {Promise<{ success: boolean; data?: Account; error?: string }>} Result object with success status and account data or error message
   */
  static async getAccount(accountId: string): Promise<{ success: boolean; data?: Account; error?: string }> {
    try {
      const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts/${accountId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Account get error:', response.status, response.statusText, errorText);
        
        return {
          success: false,
          error: `Failed to get account: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (err) {
      logger.error('Error getting account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to get account'
      };
    }
  }

  /**
   * Updates an existing account's information
   * @param {string} accountId - The unique identifier of the account to update
   * @param {UpdateAccountRequest} accountData - The account data to update
   * @returns {Promise<{ success: boolean; data?: string; error?: string }>} Result object with success status and response data or error message
   */
  static async updateAccount(accountId: string, accountData: UpdateAccountRequest): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts/${accountId}`, {
        method: 'POST',
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Account update error:', response.status, response.statusText, errorText);
        
        return {
          success: false,
          error: `Failed to update account: ${response.statusText}`
        };
      }

      // API may return string response for updates
      const data = await response.text();
      return {
        success: true,
        data: data
      };
    } catch (err) {
      logger.error('Error updating account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update account'
      };
    }
  }

  /**
   * Deletes an account by its ID
   * @param {string} accountId - The unique identifier of the account to delete
   * @returns {Promise<{ success: boolean; data?: string; error?: string }>} Result object with success status and response data or error message
   */
  static async deleteAccount(accountId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Account delete error:', response.status, response.statusText, errorText);
        
        return {
          success: false,
          error: `Failed to delete account: ${response.statusText}`
        };
      }

      const data = await response.text();
      return {
        success: true,
        data: data
      };
    } catch (err) {
      logger.error('Error deleting account:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete account'
      };
    }
  }

  /**
   * Helper function to get error message based on HTTP status code
   * @param {number} status - The HTTP status code
   * @returns {string} User-friendly error message
   */
  private static getErrorMessageForStatus(status: number): string {
    if (status === 405) {
      return 'Server configuration error. Please contact support.';
    }
    if (status === 401 || status === 403) {
      return 'User is not authorized to access this page.';
    }
    if (status === 404) {
      return 'Account service not found.';
    }
    if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    return 'Failed to load accounts';
  }

  /**
   * Filters and searches accounts based on criteria with pagination support
   * @param {AccountFilter} filter - Filter criteria for accounts
   * @param {AccountSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }>} Result object with filtered accounts or error
   * @throws {Error} If the API request fails
   */
  static async filterAccounts(
    filter: AccountFilter, 
    params?: AccountSearchParams
  ): Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }> {
    try {
      // Build query parameters
      const urlParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            urlParams.append(key, value.toString());
          }
        });
      }
      
      // Build endpoint URL without nested template literals
      const queryString = urlParams.toString();
      const endpoint = queryString ? `/v1/accounts/filter?${queryString}` : '/v1/accounts/filter';

      logger.debug('Account filter API request:', {
        endpoint,
        filter,
        filterJSON: JSON.stringify(filter, null, 2),
        params
      });
      
      // Use userManagementApi (axios) instead of fetch to get automatic auth headers
      const response: { items?: Account[] } = await userManagementApi.post(endpoint, filter);
      
      logger.debug('Account filter API response:', response);
      
      // Handle the actual API response format: { "items": [...] }
      const accounts = response.items || [];
      
      // Get total count for pagination
      let totalCount = accounts.length;
      
      // If we got a full page of results, there might be more - fetch total count
      if (params && params.pageSize && accounts.length === params.pageSize) {
        try {
          const totalEndpoint = '/v1/accounts/filter?pageNumber=0&pageSize=10000';
          const totalResponse: { items?: Account[] } = await userManagementApi.post(totalEndpoint, filter);
          totalCount = (totalResponse.items || []).length;
          logger.debug('Account total count fetched:', totalCount);
        } catch (error) {
          logger.warn('Failed to get total count, using estimate:', error);
          // If total count fetch fails, estimate based on current page
          totalCount = (params.pageNumber || 0) * params.pageSize + accounts.length;
        }
      } else if (params && params.pageSize && params.pageNumber) {
        // Current page has fewer results than requested, so we know the total
        totalCount = params.pageNumber * params.pageSize + accounts.length;
      }
      
      // Return the data in a consistent format
      return {
        success: true,
        data: {
          content: Array.isArray(accounts) ? accounts : [],
          totalElements: totalCount
        }
      };
    } catch (err: unknown) {
      logger.error('Error filtering accounts:', err);
      
      // Type guard for axios error
      const isAxiosError = (error: unknown): error is { response?: { data?: unknown; status?: number } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };
      
      if (isAxiosError(err)) {
        logger.error('Error response data:', err.response?.data);
        logger.error('Error response status:', err.response?.status);
      }
      
      // Create user-friendly error message using helper function
      const errorMessage = isAxiosError(err) && err.response?.status
        ? this.getErrorMessageForStatus(err.response.status)
        : 'Failed to load accounts';
      
      return {
        success: false,
        error: err instanceof Error ? err.message : errorMessage
      };
    }
  }

  /**
   * Retrieves all accounts in the system
   * @param {AccountSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }>} Result object with all accounts or error
   */
  static async getAllAccounts(params?: AccountSearchParams): Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }> {
    return this.filterAccounts({}, params);
  }

  /**
   * Retrieves accounts filtered by status
   * @param {AccountStatus[]} status - Array of account statuses to filter by
   * @param {AccountSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }>} Result object with filtered accounts or error
   */
  static async getAccountsByStatus(
    status: AccountStatus[], 
    params?: AccountSearchParams
  ): Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }> {
    return this.filterAccounts({ status }, params);
  }

  /**
   * Retrieves all child accounts for a given parent account
   * @param {string} parentId - The unique identifier of the parent account
   * @param {AccountSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }>} Result object with child accounts or error
   */
  static async getChildAccounts(
    parentId: string, 
    params?: AccountSearchParams
  ): Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }> {
    return this.filterAccounts({ parentIds: [parentId] }, params);
  }

  /**
   * Searches for accounts by name
   * @param {string[]} accountNames - Array of account names to search for
   * @param {AccountSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }>} Result object with matching accounts or error
   */
  static async searchAccountsByName(
    accountNames: string[], 
    params?: AccountSearchParams
  ): Promise<{ success: boolean; data?: { content: Account[]; totalElements: number; }; error?: string }> {
    return this.filterAccounts({ accountNames }, params);
  }



  // =============================================================================
  // USER ACCOUNT ROLE MAPPING APIs
  // =============================================================================

  /**
   * Assigns a user to an account with specified roles
   * @param {AssignUserToAccountRequest} assignment - Contains userId, accountId, and roleIds
   * @returns {Promise<ApiResponse<UserAccountRoleMapping>>} The API response containing the created mapping
   */
  static async assignUserToAccount(assignment: AssignUserToAccountRequest): Promise<ApiResponse<UserAccountRoleMapping>> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/user-account-mappings`, {
      method: 'POST',
      body: JSON.stringify(assignment),
    });

    return handleApiResponse<ApiResponse<UserAccountRoleMapping>>(response);
  }

  /**
   * Retrieves all account mappings for a specific user
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<UserAccountRoleMapping[]>} Array of user-account-role mappings
   * @throws {Error} If the API request fails
   */
  static async getUserAccountMappings(userId: string): Promise<UserAccountRoleMapping[]> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/users/${userId}/account-mappings`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Get user account mappings API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Retrieves all user mappings for a specific account
   * @param {string} accountId - The unique identifier of the account
   * @returns {Promise<UserAccountRoleMapping[]>} Array of user-account-role mappings
   * @throws {Error} If the API request fails
   */
  static async getAccountUserMappings(accountId: string): Promise<UserAccountRoleMapping[]> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts/${accountId}/user-mappings`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Get account user mappings API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Updates the roles assigned to a user within a specific account
   * @param {string} userId - The unique identifier of the user
   * @param {string} accountId - The unique identifier of the account
   * @param {UpdateUserAccountRolesRequest} roleData - Contains the new role IDs to assign
   * @returns {Promise<ApiResponse<UserAccountRoleMapping>>} The API response containing the updated mapping
   */
  static async updateUserAccountRoles(
    userId: string, 
    accountId: string, 
    roleData: UpdateUserAccountRolesRequest
  ): Promise<ApiResponse<UserAccountRoleMapping>> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/users/${userId}/accounts/${accountId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });

    return handleApiResponse<ApiResponse<UserAccountRoleMapping>>(response);
  }

  /**
   * Removes a user from an account (deletes the user-account association)
   * @param {string} userId - The unique identifier of the user
   * @param {string} accountId - The unique identifier of the account
   * @returns {Promise<ApiResponse<string>>} The API response confirming removal
   */
  static async removeUserFromAccount(userId: string, accountId: string): Promise<ApiResponse<string>> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/users/${userId}/accounts/${accountId}`, {
      method: 'DELETE',
    });

    return handleApiResponse<ApiResponse<string>>(response);
  }

  /**
   * Assigns multiple users to an account with specified roles in bulk
   * @param {string} accountId - The unique identifier of the account
   * @param {AssignUserToAccountRequest[]} assignments - Array of user-role assignments
   * @returns {Promise<ApiResponse<UserAccountRoleMapping[]>>} The API response containing all created mappings
   */
  static async bulkAssignUsersToAccount(
    accountId: string, 
    assignments: AssignUserToAccountRequest[]
  ): Promise<ApiResponse<UserAccountRoleMapping[]>> {
    const response = await fetchWithTokenRefresh(`${API_CONFIG.API_BASE_URL}/v1/accounts/${accountId}/bulk-assign-users`, {
      method: 'POST',
      body: JSON.stringify(assignments),
    });

    return handleApiResponse<ApiResponse<UserAccountRoleMapping[]>>(response);
  }
}

export default AccountService;
