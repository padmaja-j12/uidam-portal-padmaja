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
import { FEATURE_FLAGS, API_CONFIG, OAUTH_CONFIG, THEME_CONFIG } from './app.config';
import * as runtimeConfig from './runtimeConfig';

jest.mock('./runtimeConfig');

describe('app.config', () => {
  const mockConfig = {
    REACT_APP_UIDAM_AUTH_SERVER_URL: 'https://auth.example.com',
    REACT_APP_UIDAM_USER_MANAGEMENT_URL: 'https://api.example.com',
    REACT_APP_API_TIMEOUT: 5000,
    REACT_APP_API_RETRY_ATTEMPTS: 3,
    REACT_APP_API_RETRY_DELAY: 1000,
    REACT_APP_OAUTH_CLIENT_ID: 'client-123',
    REACT_APP_OAUTH_CLIENT_SECRET: 'secret-123',
    REACT_APP_OAUTH_REDIRECT_URI: 'https://app.example.com/callback',
    REACT_APP_OAUTH_USE_PKCE: true,
    REACT_APP_TOKEN_STORAGE_KEY: 'uidam_admin_token',
    REACT_APP_REFRESH_TOKEN_STORAGE_KEY: 'uidam_admin_refresh_token'
  };

  beforeEach(() => {
    (runtimeConfig.getConfig as jest.Mock).mockReturnValue(mockConfig);
  });

  describe('FEATURE_FLAGS', () => {
    it('should have user management flag', () => {
      expect(FEATURE_FLAGS.USER_MANAGEMENT).toBe(true);
    });

    it('should have account management flag', () => {
      expect(FEATURE_FLAGS.ACCOUNT_MANAGEMENT).toBe(true);
    });

    it('should have role management flag', () => {
      expect(FEATURE_FLAGS.ROLE_MANAGEMENT).toBe(true);
    });

    it('should have scope management flag', () => {
      expect(FEATURE_FLAGS.SCOPE_MANAGEMENT).toBe(true);
    });

    it('should have approval workflow flag', () => {
      expect(FEATURE_FLAGS.APPROVAL_WORKFLOW).toBe(true);
    });

    it('should have client management flag', () => {
      expect(FEATURE_FLAGS.CLIENT_MANAGEMENT).toBe(true);
    });

    it('should have audit logs flag', () => {
      expect(FEATURE_FLAGS.AUDIT_LOGS).toBe(true);
    });

    it('should have real time updates flag', () => {
      expect(FEATURE_FLAGS.REAL_TIME_UPDATES).toBe(true);
    });

    it('should have all features enabled by default', () => {
      Object.values(FEATURE_FLAGS).forEach(flag => {
        expect(flag).toBe(true);
      });
    });
  });

  describe('API_CONFIG', () => {
    it('should get auth server URL from runtime config', () => {
      expect(API_CONFIG.AUTH_SERVER_URL).toBe('https://auth.example.com');
    });

    it('should get API base URL from runtime config', () => {
      expect(API_CONFIG.API_BASE_URL).toBe('https://api.example.com');
    });

    it('should get API timeout from runtime config', () => {
      expect(API_CONFIG.API_TIMEOUT).toBe(5000);
    });

    it('should get API retry attempts from runtime config', () => {
      expect(API_CONFIG.API_RETRY_ATTEMPTS).toBe(3);
    });

    it('should get API retry delay from runtime config', () => {
      expect(API_CONFIG.API_RETRY_DELAY).toBe(1000);
    });

    it('should call getConfig function', () => {
      API_CONFIG.AUTH_SERVER_URL;
      expect(runtimeConfig.getConfig).toHaveBeenCalled();
    });
  });

  describe('OAUTH_CONFIG', () => {
    it('should get OAuth client ID from runtime config', () => {
      expect(OAUTH_CONFIG.CLIENT_ID).toBe('client-123');
    });

    it('should get OAuth client secret from runtime config', () => {
      expect(OAUTH_CONFIG.CLIENT_SECRET).toBe('secret-123');
    });

    it('should get OAuth redirect URI from runtime config', () => {
      expect(OAUTH_CONFIG.REDIRECT_URI).toBe('https://app.example.com/callback');
    });

    it('should use PKCE when enabled in config', () => {
      expect(OAUTH_CONFIG.USE_PKCE).toBe(true);
    });

    it('should default to true for PKCE when not specified', () => {
      (runtimeConfig.getConfig as jest.Mock).mockReturnValue({
        ...mockConfig,
        REACT_APP_OAUTH_USE_PKCE: undefined
      });
      expect(OAUTH_CONFIG.USE_PKCE).toBe(true);
    });

    it('should disable PKCE when explicitly set to false', () => {
      (runtimeConfig.getConfig as jest.Mock).mockReturnValue({
        ...mockConfig,
        REACT_APP_OAUTH_USE_PKCE: false
      });
      expect(OAUTH_CONFIG.USE_PKCE).toBe(false);
    });

    it('should have required scopes', () => {
      expect(OAUTH_CONFIG.SCOPES).toContain('SelfManage');
      expect(OAUTH_CONFIG.SCOPES).toContain('ViewUsers');
      expect(OAUTH_CONFIG.SCOPES).toContain('ManageUsers');
      expect(OAUTH_CONFIG.SCOPES).toContain('ManageUserRolesAndPermissions');
      expect(OAUTH_CONFIG.SCOPES).toContain('ManageAccounts');
      expect(OAUTH_CONFIG.SCOPES).toContain('ViewAccounts');
    });

    it('should have token storage key', () => {
      expect(OAUTH_CONFIG.TOKEN_STORAGE_KEY).toBe('uidam_admin_token');
    });

    it('should have refresh token storage key', () => {
      expect(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY).toBe('uidam_admin_refresh_token');
    });

    it('should have non-empty scopes array', () => {
      expect(OAUTH_CONFIG.SCOPES.length).toBeGreaterThan(0);
    });
  });

  describe('THEME_CONFIG', () => {
    it('should have primary color defined', () => {
      expect(THEME_CONFIG.PRIMARY_COLOR).toBe('#1976d2');
    });

    it('should have secondary color defined', () => {
      expect(THEME_CONFIG.SECONDARY_COLOR).toBe('#dc004e');
    });

    it('should have light mode as default', () => {
      expect(THEME_CONFIG.DEFAULT_MODE).toBe('light');
    });

    it('should have theme storage key', () => {
      expect(THEME_CONFIG.THEME_STORAGE_KEY).toBe('uidam_admin_theme_mode');
    });

    it('should have valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(THEME_CONFIG.PRIMARY_COLOR).toMatch(hexColorRegex);
      expect(THEME_CONFIG.SECONDARY_COLOR).toMatch(hexColorRegex);
    });
  });

  describe('Configuration consistency', () => {
    it('should have all required API URLs', () => {
      expect(API_CONFIG.AUTH_SERVER_URL).toBeTruthy();
      expect(API_CONFIG.API_BASE_URL).toBeTruthy();
    });

    it('should have all required OAuth settings', () => {
      expect(OAUTH_CONFIG.CLIENT_ID).toBeTruthy();
      expect(OAUTH_CONFIG.REDIRECT_URI).toBeTruthy();
    });

    it('should have valid timeout values', () => {
      expect(API_CONFIG.API_TIMEOUT).toBeGreaterThan(0);
      expect(API_CONFIG.API_RETRY_DELAY).toBeGreaterThan(0);
    });

    it('should have positive retry attempts', () => {
      expect(API_CONFIG.API_RETRY_ATTEMPTS).toBeGreaterThan(0);
    });
  });
});
