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
import { loadRuntimeConfig, getConfig, loadConfig } from './runtimeConfig';

interface WindowWithConfig extends Window {
  _APP_CONFIG?: Record<string, unknown>;
}

declare const window: WindowWithConfig;

describe('runtimeConfig', () => {
  const mockConfig = {
    KEYCLOAK_URL: 'https://keycloak.example.com',
    KEYCLOAK_REALM: 'test-realm',
    KEYCLOAK_CLIENT_ID: 'test-client',
    API_BASE_URL: 'https://api.example.com',
    REACT_APP_UIDAM_AUTH_SERVER_URL: 'https://auth.example.com',
    REACT_APP_UIDAM_USER_MANAGEMENT_URL: 'https://user-api.example.com',
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    window._APP_CONFIG = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadRuntimeConfig', () => {
    it('should load config from /config.json successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockConfig),
      });

      const config = await loadRuntimeConfig();

      expect(global.fetch).toHaveBeenCalledWith('/config.json');
      expect(config).toEqual(mockConfig);
      expect(window._APP_CONFIG).toEqual(mockConfig);
    });

    it('should handle fetch error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(loadRuntimeConfig()).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load config.json:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      await expect(loadRuntimeConfig()).rejects.toThrow('Invalid JSON');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should set window._APP_CONFIG', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockConfig),
      });

      await loadRuntimeConfig();

      expect(window._APP_CONFIG).toBeDefined();
      expect(window._APP_CONFIG).toEqual(mockConfig);
    });
  });

  describe('getConfig', () => {
    it('should return empty object when config not loaded', () => {
      const config = getConfig();
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should return loaded config', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockConfig),
      });

      await loadRuntimeConfig();
      const config = getConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should return same config on multiple calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockConfig),
      });

      await loadRuntimeConfig();
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toEqual(config2);
      expect(config1).toBe(config2);
    });
  });

  describe('loadConfig', () => {
    it('should be an alias for loadRuntimeConfig', () => {
      expect(loadConfig).toBe(loadRuntimeConfig);
    });

    it('should load config successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockConfig),
      });

      const config = await loadConfig();

      expect(config).toEqual(mockConfig);
    });
  });

  describe('RuntimeConfig interface', () => {
    it('should allow dynamic keys', async () => {
      const configWithCustomKeys = {
        ...mockConfig,
        CUSTOM_KEY: 'custom-value',
        ANOTHER_KEY: 123,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(configWithCustomKeys),
      });

      const config = await loadRuntimeConfig();

      expect(config.CUSTOM_KEY).toBe('custom-value');
      expect(config.ANOTHER_KEY).toBe(123);
    });
  });
});
