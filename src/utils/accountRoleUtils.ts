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
 * Utility functions for account and role management operations
 */

import { Account, AccountService } from '../services/accountService';
import { User as ServiceUser } from '../services/userService';
import { RoleService } from '../services/role.service';
import { Role } from '../types';
import { JsonPatchOperation, createAddRoleOperation, createRemoveRoleOperation } from './jsonPatchUtils';
import { logger } from './logger';

export interface AccountRoleMapping {
  accountId: string;
  accountName: string;
  originalRoles: string[]; // Roles the user currently has for this account
  selectedRoles: string[]; // Roles selected in the UI
  defaultRoles: string[]; // Default roles for this account
  isNewAccount: boolean; // Whether this is a newly added account
  isDefaultAccount: boolean; // Not used - keeping for compatibility
  isAccountSelected: boolean; // Whether this account is selected for the user
}

/**
 * Process a single user account and add it to the mappings array
 * Handles both found and not-found scenarios
 */
export const processUserAccount = (
  userAccount: { account: string; roles: string[] },
  availableAccounts: Account[],
  mappings: AccountRoleMapping[],
  processedAccountIds: Set<string>
): void => {
  logger.debug(`Looking for account: "${userAccount.account}" in available accounts`);
  
  const account = availableAccounts.find(a => 
    a.accountName === userAccount.account || a.id === userAccount.account
  );
  
  if (account) {
    logger.debug(`✅ Found matching account: ${account.id} (${account.accountName})`);
    mappings.push({
      accountId: account.id,
      accountName: account.accountName,
      originalRoles: [...userAccount.roles],
      selectedRoles: [...userAccount.roles],
      defaultRoles: account.roles || [],
      isNewAccount: false,
      isDefaultAccount: false,
      isAccountSelected: true
    });
    processedAccountIds.add(account.id);
  } else {
    logger.warn(`❌ Account "${userAccount.account}" not found in available accounts`);
    mappings.push({
      accountId: userAccount.account,
      accountName: userAccount.account,
      originalRoles: [...userAccount.roles],
      selectedRoles: [...userAccount.roles],
      defaultRoles: [],
      isNewAccount: false,
      isDefaultAccount: false,
      isAccountSelected: true
    });
    processedAccountIds.add(userAccount.account);
  }
};

/**
 * Initialize account role mappings for a user based on their current accounts and available accounts
 */
export const initializeAccountRoleMappings = (
  user: ServiceUser,
  availableAccounts: Account[]
): AccountRoleMapping[] => {
  const mappings: AccountRoleMapping[] = [];
  
  logger.debug('Initializing account mappings for user:', user.id);
  logger.debug('User existing accounts:', user.accounts);
  logger.debug('Available accounts:', availableAccounts.map(a => ({ id: a.id, name: a.accountName })));
  
  // First, process user's existing accounts (these should be shown as current accounts)
  const processedAccountIds = new Set<string>();
  
  if (user.accounts && user.accounts.length > 0) {
    logger.debug('Processing user accounts:');
    for (const userAccount of user.accounts) {
      processUserAccount(userAccount, availableAccounts, mappings, processedAccountIds);
    }
  }
  
  // Then, add other available accounts that user doesn't have yet
  for (const account of availableAccounts) {
    if (!processedAccountIds.has(account.id)) {
      mappings.push({
        accountId: account.id,
        accountName: account.accountName,
        originalRoles: [], // No existing roles since user doesn't have this account
        selectedRoles: [], // No roles selected initially
        defaultRoles: account.roles || [], // Default roles for this account
        isNewAccount: true, // This is a new account for the user
        isDefaultAccount: false, // No default account concept
        isAccountSelected: false // Not selected initially
      });
    }
  }
  
  logger.debug('Final account mappings:', mappings);
  logger.debug(`Total accounts processed: ${mappings.length}`);
  logger.debug(`User's existing accounts: ${mappings.filter(m => !m.isNewAccount).length}`);
  logger.debug(`Available new accounts: ${mappings.filter(m => m.isNewAccount).length}`);
  
  return mappings;
};

/**
 * Calculate JsonPatch operations needed to update account role mappings
 */
export const calculateAccountRoleOperations = (
  accountRoleMappings: AccountRoleMapping[]
): JsonPatchOperation[] => {
  const operations: JsonPatchOperation[] = [];
  
  // Calculate the changes needed for account role mappings
  for (const mapping of accountRoleMappings) {
    const { accountId, originalRoles, selectedRoles, isAccountSelected } = mapping;
    if (isAccountSelected) {
      // Account is selected - handle role additions and removals
      const rolesToAdd = selectedRoles.filter(role => !originalRoles.includes(role));
      const rolesToRemove = originalRoles.filter(role => !selectedRoles.includes(role));
      
      // Add new roles to account
      rolesToAdd.forEach(role => {
        operations.push(createAddRoleOperation(accountId, role));
      });
      
      // Remove roles from account
      rolesToRemove.forEach(role => {
        operations.push(createRemoveRoleOperation(accountId, role));
      });
    } else if (originalRoles.length > 0) {
      // Account is not selected - remove all roles for this account
      originalRoles.forEach(role => {
        operations.push(createRemoveRoleOperation(accountId, role));
      });
    }
  }
  
  return operations;
};

/**
 * Check if account role changes can be approved (at least one account selected)
 */
export const canApproveAccountRoleChanges = (accountRoleMappings: AccountRoleMapping[]): boolean => {
  const selectedAccountsCount = accountRoleMappings.filter(m => m.isAccountSelected).length;
  return selectedAccountsCount > 0;
};

/**
 * Get tooltip text for account toggle checkbox
 */
export const getAccountToggleTooltip = (mapping: AccountRoleMapping): string => {
  if (mapping.isAccountSelected) {
    return "Click to remove this account from user";
  }
  return "Click to grant user access to this account";
};

/**
 * Update role selection for a specific account in mappings
 */
export const updateRoleSelection = (
  accountRoleMappings: AccountRoleMapping[],
  accountId: string,
  selectedRoles: string[]
): AccountRoleMapping[] => {
  return accountRoleMappings.map(mapping => 
    mapping.accountId === accountId 
      ? { ...mapping, selectedRoles }
      : mapping
  );
};

/**
 * Toggle account selection and update roles accordingly
 */
export const toggleAccountSelection = (
  accountRoleMappings: AccountRoleMapping[],
  accountId: string,
  isSelected: boolean
): AccountRoleMapping[] => {
  return accountRoleMappings.map(mapping => 
    mapping.accountId === accountId 
      ? { 
          ...mapping, 
          isAccountSelected: isSelected,
          // If unselecting, clear selected roles; if selecting, add default roles
          selectedRoles: isSelected 
            ? [...mapping.defaultRoles] // Start with default roles when selecting
            : [] // Clear roles when unselecting
        }
      : mapping
  );
};

/**
 * Load available accounts from the backend API
 * Handles different response formats for compatibility
 */
export const loadAvailableAccounts = async (): Promise<Account[]> => {
  try {
    logger.debug('Loading available accounts...');
    const response = await AccountService.getAllAccounts({
      pageNumber: 0,
      pageSize: 100 // Get first 100 accounts
    });

    logger.debug('Account service response:', response);
    
    let accounts: Account[] = [];
    
    // Handle different possible response formats
    if (response && response.success && response.data) {
      // Format: { success: true, data: { content: [...] } }
      accounts = response.data.content || [];
      logger.debug('Using response.data.content format');
    } else if (Array.isArray(response)) {
      // Format: [...] - Direct array (fallback)
      accounts = response;
      logger.debug('Using direct array format');
    } else {
      logger.warn('Unknown response format:', response);
      accounts = [];
    }
    
    logger.debug('Available accounts loaded:', accounts.map(a => ({ 
      id: a.id, 
      name: a.accountName,
      roles: a.roles
    })));
    
    return accounts;
  } catch (err) {
    logger.error('Error loading accounts:', err);
    return [];
  }
};

/**
 * Load available roles from the backend API
 */
export const loadAvailableRoles = async (): Promise<Role[]> => {
  try {
    const roleService = new RoleService();
    const response = await roleService.getRoles({
      page: 0,
      size: 100,
      filter: {}
    });

    if (response?.content) {
      return response.content;
    }
    return [];
  } catch (err) {
    logger.error('Error loading roles:', err);
    return [];
  }
};
