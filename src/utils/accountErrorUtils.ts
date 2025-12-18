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
 * Utility function to extract user-friendly error messages from API errors
 * Handles various error formats and provides contextual messages based on operation type
 */

type ErrorOperation = 'create' | 'update' | 'delete' | 'fetch';

interface ErrorMessageConfig {
  operation: ErrorOperation;
  customMessages?: Record<number, string>;
}

const defaultStatusMessages: Record<ErrorOperation, Record<number, string>> = {
  create: {
    400: 'Invalid account data. Please check your input.',
    401: 'You are not authorized to create accounts.',
    403: 'You do not have permission to create accounts.',
    409: 'An account with this name already exists.',
    500: 'Server error. Please try again later.'
  },
  update: {
    400: 'Invalid account data. Please check your input.',
    401: 'You are not authorized to update accounts.',
    403: 'You do not have permission to update accounts.',
    404: 'Account not found.',
    500: 'Server error. Please try again later.'
  },
  delete: {
    400: 'Invalid request. Please try again.',
    401: 'You are not authorized to delete accounts.',
    403: 'You do not have permission to delete accounts.',
    404: 'Account not found.',
    500: 'Server error. Please try again later.'
  },
  fetch: {
    400: 'Invalid request. Please try again.',
    401: 'You are not authorized to view accounts.',
    403: 'You do not have permission to view accounts.',
    404: 'Account not found.',
    500: 'Server error. Please try again later.'
  }
};

const defaultFallbackMessages: Record<ErrorOperation, string> = {
  create: 'Failed to create account',
  update: 'Failed to update account',
  delete: 'Failed to delete account',
  fetch: 'Failed to fetch account'
};

/**
 * Extracts a user-friendly error message from an error object
 * @param err - The error object (can be Error, API response, or unknown)
 * @param config - Configuration specifying the operation type and custom messages
 * @returns A user-friendly error message string
 */
export const getAccountErrorMessage = (
  err: unknown,
  config: ErrorMessageConfig
): string => {
  const { operation, customMessages } = config;
  
  // Check if it's an Error instance
  if (err instanceof Error) {
    return err.message;
  }
  
  // Handle specific API errors by status code
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as any).status;
    
    // First, check custom messages if provided
    if (customMessages && status in customMessages) {
      return customMessages[status];
    }
    
    // Fall back to default status messages
    if (status in defaultStatusMessages[operation]) {
      return defaultStatusMessages[operation][status];
    }
    
    // Fall back to operation-specific fallback message
    return defaultFallbackMessages[operation];
  }
  
  return defaultFallbackMessages[operation];
};
