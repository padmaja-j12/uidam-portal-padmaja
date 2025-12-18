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
import * as ServiceExports from './index';

describe('Services Index Exports', () => {
  describe('Class Exports', () => {
    it('should export UserService class', () => {
      expect(ServiceExports.UserService).toBeDefined();
      expect(typeof ServiceExports.UserService).toBe('function');
    });

    it('should export RoleService class', () => {
      expect(ServiceExports.RoleService).toBeDefined();
      expect(typeof ServiceExports.RoleService).toBe('function');
    });

    it('should export ScopeService class', () => {
      expect(ServiceExports.ScopeService).toBeDefined();
      expect(typeof ServiceExports.ScopeService).toBe('function');
    });

    it('should export AuthService', () => {
      expect(ServiceExports.AuthService).toBeDefined();
    });

    it('should export authService instance', () => {
      expect(ServiceExports.authService).toBeDefined();
    });
  });

  describe('Service Instances', () => {
    it('should export userService instance', () => {
      expect(ServiceExports.userService).toBeDefined();
      expect(ServiceExports.userService).toBeInstanceOf(ServiceExports.UserService);
    });

    it('should export roleService instance', () => {
      expect(ServiceExports.roleService).toBeDefined();
      expect(ServiceExports.roleService).toBeInstanceOf(ServiceExports.RoleService);
    });

    it('should export scopeService instance', () => {
      expect(ServiceExports.scopeService).toBeDefined();
      expect(ServiceExports.scopeService).toBeInstanceOf(ServiceExports.ScopeService);
    });

    it('should create singleton service instances', () => {
      // Import again to check if same instances
      const { userService, roleService, scopeService } = ServiceExports;
      
      expect(userService).toBe(ServiceExports.userService);
      expect(roleService).toBe(ServiceExports.roleService);
      expect(scopeService).toBe(ServiceExports.scopeService);
    });
  });

  describe('API Client Exports', () => {
    it('should export userManagementApi', () => {
      expect(ServiceExports.userManagementApi).toBeDefined();
    });

    it('should export authServerApi', () => {
      expect(ServiceExports.authServerApi).toBeDefined();
    });

    it('should export API clients as objects with methods', () => {
      expect(typeof ServiceExports.userManagementApi).toBe('object');
      expect(typeof ServiceExports.authServerApi).toBe('object');
    });
  });

  describe('All Exports', () => {
    it('should have all expected exports', () => {
      const expectedExports = [
        'UserService',
        'RoleService',
        'ScopeService',
        'AuthService',
        'authService',
        'userService',
        'roleService',
        'scopeService',
        'userManagementApi',
        'authServerApi',
      ];

      expectedExports.forEach(exportName => {
        expect(ServiceExports).toHaveProperty(exportName);
      });
    });

    it('should export at least 10 items', () => {
      const exportKeys = Object.keys(ServiceExports);
      expect(exportKeys.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Service Functionality', () => {
    it('should allow creating new instances of services', () => {
      const newUserService = new ServiceExports.UserService();
      const newRoleService = new ServiceExports.RoleService();
      const newScopeService = new ServiceExports.ScopeService();

      expect(newUserService).toBeInstanceOf(ServiceExports.UserService);
      expect(newRoleService).toBeInstanceOf(ServiceExports.RoleService);
      expect(newScopeService).toBeInstanceOf(ServiceExports.ScopeService);
    });

    it('should have different instances when creating new services', () => {
      const newUserService = new ServiceExports.UserService();
      
      expect(newUserService).not.toBe(ServiceExports.userService);
      expect(newUserService).toBeInstanceOf(ServiceExports.UserService);
    });
  });
});
