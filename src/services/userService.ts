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
// User Management Service
// Comprehensive API integration for UIDAM User Management APIs

import { API_CONFIG } from '../config/app.config';
import { handleApiResponse, getApiHeaders } from './apiUtils';

// API Response interfaces
export interface ApiResponse<T> {
  code?: string;
  message?: string;
  data?: T;
  httpStatus?: string;
}

// User Management Interfaces
export interface User {
  id: number;
  userName: string;
  status: 'PENDING' | 'BLOCKED' | 'REJECTED' | 'ACTIVE' | 'DELETED' | 'DEACTIVATED';
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
  locale?: string;
  timeZone?: string;
  notificationConsent?: boolean;
  devIds?: string[];
  additionalAttributes?: Record<string, any>;
  accounts?: UserAccount[];
  roles?: string[];
}

export interface UserAccount {
  account: string;
  roles: string[];
}

export interface CreateUserV1Request {
  firstName: string;
  lastName?: string;
  country?: string;
  state?: string;
  city?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  phoneNumber?: string;
  email: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
  locale?: string;
  notificationConsent?: boolean;
  timeZone?: string;
  userName: string;
  password: string;
  aud?: string;
  roles?: string[];
}

export interface CreateUserV2Request extends CreateUserV1Request {
  accounts: UserAccount[];
}

export interface ExternalUserRequest extends Omit<CreateUserV1Request, 'password'> {
  // External users don't require passwords
}

export interface FederatedUserRequest extends Omit<CreateUserV1Request, 'password'> {
  identity_provider_name: string;
}

export interface UsersFilterV1 {
  ids?: number[];
  userNames?: string[];
  roles?: string[];
  firstNames?: string[];
  lastNames?: string[];
  countries?: string[];
  states?: string[];
  cities?: string[];
  address1?: string[];
  address2?: string[];
  postalCodes?: string[];
  phoneNumbers?: string[];
  emails?: string[];
  locales?: string[];
  gender?: ('MALE' | 'FEMALE')[];
  devIds?: string[];
  status?: ('PENDING' | 'BLOCKED' | 'REJECTED' | 'ACTIVE' | 'DELETED' | 'DEACTIVATED')[];
  additionalAttributes?: Record<string, string[]>;
}

export interface UsersFilterV2 extends UsersFilterV1 {
  accountNames?: string[];
}

export interface UserSearchParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'IDS' | 'USER_NAMES' | 'ROLES' | 'ROLEIDS' | 'ACCOUNTIDS' | 'STATUS' | 'FIRST_NAMES' | 'LAST_NAMES' | 'COUNTRIES' | 'STATES' | 'CITIES' | 'ADDRESS1' | 'ADDRESS2' | 'POSTAL_CODES' | 'PHONE_NUMBERS' | 'EMAILS' | 'GENDER' | 'LOCALES' | 'DEV_IDS' | 'TIMEZONE' | 'BIRTHDATE' | 'USERSTATUS';
  sortOrder?: 'DESC' | 'ASC';
  ignoreCase?: boolean;
  searchType?: 'PREFIX' | 'SUFFIX' | 'CONTAINS';
}

export interface UserStatusChangeRequest {
  ids: number[];
  approved: boolean;
}

export interface AccountRoleMappingOperation {
  op: 'ADD' | 'REMOVE' | 'REPLACE';
  path: string; // e.g., "/account/1/ROLE_NAME" or "/status"
  value?: string;
}

export interface UserMetaDataRequest {
  name: string;
  mandatory?: boolean;
  unique?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  type?: string;
  regex?: string;
}

/**
 * Service class for managing user operations
 * Handles CRUD operations, filtering, status management, and account-role associations
 */
export class UserService {
  /**
   * Creates a new user using V1 API
   * @param {CreateUserV1Request} user - The user data for creation
   * @returns {Promise<ApiResponse<User>>} The API response containing the created user
   */
  static async createUserV1(user: CreateUserV1Request): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(user),
    });
    return response.json();
  }

  /**
   * Retrieves a single user by ID using V1 API
   * @param {number} id - The unique identifier of the user
   * @returns {Promise<ApiResponse<User>>} The API response containing the user details
   */
  static async getUserV1(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/${id}`, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  /**
   * Updates a user's information using JSON Patch operations (V1 API)
   * @param {number} id - The unique identifier of the user to update
   * @param {any[]} patches - Array of JSON Patch operations to apply
   * @returns {Promise<ApiResponse<User>>} The API response containing the updated user
   */
  static async updateUserV1(id: number, patches: any[]): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/${id}`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(patches),
    });
    return response.json();
  }

  /**
   * Deletes a user by ID using V1 API
   * @param {number} id - The unique identifier of the user to delete
   * @param {boolean} [externalUser] - Optional flag indicating if this is an external user
   * @returns {Promise<ApiResponse<User>>} The API response confirming deletion
   */
  static async deleteUserV1(id: number, externalUser?: boolean): Promise<ApiResponse<User>> {
    let urlPath = `${API_CONFIG.API_BASE_URL}/v1/users/${id}`;
    if (externalUser !== undefined) {
      urlPath += `?external_user=${externalUser}`;
    }
    
    const response = await fetch(urlPath, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });

    return handleApiResponse<ApiResponse<User>>(response);
  }

  /**
   * Filters and searches users based on criteria using V1 API
   * @param {UsersFilterV1} filter - Filter criteria for users
   * @param {UserSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<ApiResponse<User[]>>} The API response containing filtered users
   */
  static async filterUsersV1(filter: UsersFilterV1, params?: UserSearchParams): Promise<ApiResponse<User[]>> {
    const urlPath = `${API_CONFIG.API_BASE_URL}/v1/users/filter`;
    
    const urlParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          urlParams.append(key, value.toString());
        }
      });
    }
    
    const finalUrl = urlParams.toString() ? `${urlPath}?${urlParams.toString()}` : urlPath;

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(filter),
    });
    return response.json();
  }

  // V2 User APIs
  /**
   * Creates a new user with account-role associations using V2 API
   * @param {CreateUserV2Request} user - The user data including account associations
   * @returns {Promise<ApiResponse<User>>} The API response containing the created user
   */
  static async createUserV2(user: CreateUserV2Request): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v2/users`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(user),
    });

    return handleApiResponse<ApiResponse<User>>(response);
  }

  /**
   * Retrieves a single user with account associations by ID using V2 API
   * @param {number} id - The unique identifier of the user
   * @returns {Promise<ApiResponse<User>>} The API response containing the user with accounts
   */
  static async getUserV2(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v2/users/${id}`, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  /**
   * Updates a user's information including account associations using JSON Patch (V2 API)
   * @param {number} id - The unique identifier of the user to update
   * @param {any[]} patches - Array of JSON Patch operations to apply
   * @returns {Promise<ApiResponse<User>>} The API response containing the updated user
   */
  static async updateUserV2(id: number, patches: any[]): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v2/users/${id}`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(patches),
    });

    return handleApiResponse<ApiResponse<User>>(response);
  }

  /**
   * Filters and searches users with account associations based on criteria using V2 API
   * @param {UsersFilterV2} filter - Filter criteria including account names
   * @param {UserSearchParams} [params] - Optional pagination and sorting parameters
   * @returns {Promise<User[]>} Array of filtered users
   * @throws {Error} If the API request fails or returns an error status
   */
  static async filterUsersV2(filter: UsersFilterV2, params?: UserSearchParams): Promise<User[]> {
    // Use full URL with API base
    const urlPath = `${API_CONFIG.API_BASE_URL}/v2/users/filter`;
    
    // Add query parameters if provided
    const urlParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          urlParams.append(key, value.toString());
        }
      });
    }
    
    const finalUrl = urlParams.toString() ? `${urlPath}?${urlParams.toString()}` : urlPath;

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(filter),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('User filter API error:', response.status, errorText);
      
      // Create user-friendly error message
      let errorMessage = 'Failed to load users';
      if (response.status === 405) {
        errorMessage = 'Server configuration error. Please contact support.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to view users.';
      } else if (response.status === 404) {
        errorMessage = 'User service not found.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Return the data directly as an array
    return data;
  }

  // Special User Types
  /**
   * Creates an external user without password authentication
   * @param {ExternalUserRequest} user - The external user data (password not required)
   * @returns {Promise<ApiResponse<User>>} The API response containing the created external user
   */
  static async createExternalUser(user: ExternalUserRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/external`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(user),
    });
    return response.json();
  }

  /**
   * Creates a federated user with an identity provider
   * @param {FederatedUserRequest} user - The federated user data including identity provider name
   * @returns {Promise<ApiResponse<User>>} The API response containing the created federated user
   */
  static async createFederatedUser(user: FederatedUserRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/federated`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(user),
    });
    return response.json();
  }

  /**
   * Retrieves an external user by ID
   * @param {number} id - The unique identifier of the external user
   * @returns {Promise<ApiResponse<User>>} The API response containing the external user details
   */
  static async getExternalUser(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/external/${id}`, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  /**
   * Updates an external user's information using JSON Patch operations
   * @param {number} id - The unique identifier of the external user to update
   * @param {any[]} patches - Array of JSON Patch operations to apply
   * @returns {Promise<ApiResponse<User>>} The API response containing the updated external user
   */
  static async updateExternalUser(id: number, patches: any[]): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/external/${id}`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(patches),
    });
    return response.json();
  }

  /**
   * Deletes an external user by ID
   * @param {number} id - The unique identifier of the external user to delete
   * @returns {Promise<ApiResponse<User>>} The API response confirming deletion
   */
  static async deleteExternalUser(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/external/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  // User Status Management
  /**
   * Changes the status of multiple users (approve or reject)
   * @param {UserStatusChangeRequest} request - Contains user IDs and approval status
   * @returns {Promise<ApiResponse<User>>} The API response confirming status change
   */
  static async changeUserStatus(request: UserStatusChangeRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/status`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(request),
    });
    return response.json();
  }

  /**
   * Deletes multiple users by their IDs
   * @param {Object} filter - Filter containing array of user IDs to delete
   * @param {number[]} filter.ids - Array of user IDs
   * @returns {Promise<ApiResponse<User>>} The API response confirming batch deletion
   */
  static async deleteUsersByFilter(filter: { ids: number[] }): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users`, {
      method: 'DELETE',
      headers: getApiHeaders(),
      body: JSON.stringify(filter),
    });
    return response.json();
  }

  // User-Account-Role Mapping
  /**
   * Associates accounts and roles with a user using JSON Patch operations
   * @param {number} userId - The unique identifier of the user
   * @param {AccountRoleMappingOperation[]} operations - Array of operations (ADD/REMOVE/REPLACE) for account-role mappings
   * @returns {Promise<ApiResponse<{ accounts: UserAccount[] }>>} The API response containing updated account associations
   */
  static async associateAccountAndRoles(
    userId: number, 
    operations: AccountRoleMappingOperation[]
  ): Promise<ApiResponse<{ accounts: UserAccount[] }>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/${userId}/accountRoleMapping`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(operations),
    });
    return response.json();
  }

  // Self-Service APIs
  /**
   * Retrieves the currently authenticated user's profile
   * @returns {Promise<ApiResponse<User>>} The API response containing the current user's details
   */
  static async getSelfUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/self`, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  /**
   * Updates the currently authenticated user's information using JSON Patch operations
   * @param {any[]} patches - Array of JSON Patch operations to apply to self
   * @returns {Promise<ApiResponse<User>>} The API response containing the updated user details
   */
  static async updateSelfUser(patches: any[]): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/self`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(patches),
    });
    return response.json();
  }

  /**
   * Deletes the currently authenticated user's account (self-deletion)
   * @param {boolean} [externalUser] - Optional flag indicating if this is an external user
   * @returns {Promise<ApiResponse<User>>} The API response confirming self-deletion
   */
  static async deleteSelfUser(externalUser?: boolean): Promise<ApiResponse<User>> {
    let urlPath = `${API_CONFIG.API_BASE_URL}/v1/users/self`;
    if (externalUser !== undefined) {
      urlPath += `?external_user=${externalUser}`;
    }
    
    const response = await fetch(urlPath, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  // User Attributes
  /**
   * Retrieves all available user attribute definitions
   * @returns {Promise<ApiResponse<any[]>>} The API response containing user attribute metadata
   */
  static async getUserAttributes(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/attributes`, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  /**
   * Updates or creates user attribute definitions
   * @param {UserMetaDataRequest[]} attributes - Array of user attribute metadata to update
   * @returns {Promise<ApiResponse<any[]>>} The API response containing updated attribute metadata
   */
  static async updateUserAttributes(attributes: UserMetaDataRequest[]): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/attributes`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(attributes),
    });
    return response.json();
  }

  // Utility Functions
  /**
   * Retrieves a user by username with optional account filtering
   * @param {string} userName - The username to search for
   * @param {string} [accountName] - Optional account name to filter the user
   * @returns {Promise<ApiResponse<any>>} The API response containing the user details
   */
  static async getUserByUserName(userName: string, accountName?: string): Promise<ApiResponse<any>> {
    let urlPath = `/v1/users/${userName}/byUserName`;
    if (accountName) {
      urlPath += `?accountName=${accountName}`;
    }
    
    const response = await fetch(urlPath, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    return response.json();
  }

  // User Events
  /**
   * Adds an event to a user's activity log
   * @param {number} userId - The unique identifier of the user
   * @param {any} event - The event data to log
   * @returns {Promise<ApiResponse<string>>} The API response confirming event creation
   */
  static async addUserEvent(userId: number, event: any): Promise<ApiResponse<string>> {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/v1/users/${userId}/events`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(event),
    });
    return response.json();
  }
}

export default UserService;
