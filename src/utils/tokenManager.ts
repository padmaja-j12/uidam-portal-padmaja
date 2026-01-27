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
import { authService } from '../services/auth.service';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Notify all subscribers waiting for token refresh
 * @param {string | null} token - The new access token
 * @returns {void}
 */
function notifySubscribers(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Add a subscriber to be notified when token refresh completes
 * @param callback - Function to call when refresh completes
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Handle token refresh with queue management to prevent multiple simultaneous refreshes
 * @returns {Promise<string | null>} The new access token or null if refresh failed
 */
export async function handleTokenRefresh(): Promise<string | null> {
  const refreshToken = authService.getStoredRefreshToken();
  
  if (!refreshToken) {
    console.warn('No refresh token available');
    return null;
  }

  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing) {
    return new Promise((resolve) => {
      addRefreshSubscriber((token: string) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    console.log('Refreshing access token...');
    const tokens = await authService.refreshToken(refreshToken);
    const newToken = tokens.accessToken;
    
    console.log('Token refreshed successfully');
    notifySubscribers(newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    authService.clearStoredTokens();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Check if the current token should be refreshed
 * @returns {boolean} True if token is expired or about to expire
 */
export function shouldRefreshToken(): boolean {
  return authService.isTokenExpired();
}

/**
 * Get the current valid token, refreshing if necessary
 * @returns {Promise<string | null>} The current or refreshed access token
 */
export async function getValidToken(): Promise<string | null> {
  const currentToken = authService.getStoredToken();
  
  if (!currentToken) {
    return null;
  }

  if (shouldRefreshToken()) {
    return handleTokenRefresh();
  }

  return currentToken;
}
