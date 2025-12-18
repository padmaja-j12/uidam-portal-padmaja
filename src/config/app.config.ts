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
// Import runtime config loaded from public/config.json
import { getConfig } from './runtimeConfig';

// Feature flags for modular architecture
export const FEATURE_FLAGS = {
  USER_MANAGEMENT: true,
  ACCOUNT_MANAGEMENT: true,
  ROLE_MANAGEMENT: true,
  SCOPE_MANAGEMENT: true,
  APPROVAL_WORKFLOW: true,
  CLIENT_MANAGEMENT: true,
  AUDIT_LOGS: true,
  REAL_TIME_UPDATES: true,
} as const;

// API Configuration
export const API_CONFIG = {
  get AUTH_SERVER_URL() {
    return getConfig().REACT_APP_UIDAM_AUTH_SERVER_URL;
  },
  get API_BASE_URL() {
    return getConfig().REACT_APP_UIDAM_USER_MANAGEMENT_URL;
  },
  get API_TIMEOUT() {
    return getConfig().REACT_APP_API_TIMEOUT;
  },
  get API_RETRY_ATTEMPTS() {
    return getConfig().REACT_APP_API_RETRY_ATTEMPTS;
  },
  get API_RETRY_DELAY() {
    return getConfig().REACT_APP_API_RETRY_DELAY;
  },
};

// OAuth2 Configuration
export const OAUTH_CONFIG = {
  get CLIENT_ID() {
    return getConfig().REACT_APP_OAUTH_CLIENT_ID;
  },
  get CLIENT_SECRET() {
    return getConfig().REACT_APP_OAUTH_CLIENT_SECRET;
  },
  get REDIRECT_URI() {
    return getConfig().REACT_APP_OAUTH_REDIRECT_URI;
  },
  get USE_PKCE() {
    return getConfig().REACT_APP_OAUTH_USE_PKCE !== false;
  },
  SCOPES: [
    'SelfManage',
    'ViewUsers',
    'ManageUsers',
    'ManageUserRolesAndPermissions',
    'ManageAccounts',
    'ViewAccounts'  
  ],
  get TOKEN_STORAGE_KEY() {
    return getConfig().REACT_APP_TOKEN_STORAGE_KEY;
  },
  get REFRESH_TOKEN_STORAGE_KEY() {
    return getConfig().REACT_APP_REFRESH_TOKEN_STORAGE_KEY;
  },
};

// Theme configuration
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#1976d2',
  SECONDARY_COLOR: '#dc004e',
  DEFAULT_MODE: 'light' as 'light' | 'dark',
  THEME_STORAGE_KEY: 'uidam_admin_theme_mode',
} as const;
