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
import * as AccountManagementExports from './index';

describe('Account Management Index Exports', () => {
  it('should export AccountManagement component', () => {
    expect(AccountManagementExports.AccountManagement).toBeDefined();
    expect(typeof AccountManagementExports.AccountManagement).toBe('function');
  });

  it('should export CreateAccountModal component', () => {
    expect(AccountManagementExports.CreateAccountModal).toBeDefined();
    expect(typeof AccountManagementExports.CreateAccountModal).toBe('function');
  });

  it('should export EditAccountModal component', () => {
    expect(AccountManagementExports.EditAccountModal).toBeDefined();
    expect(typeof AccountManagementExports.EditAccountModal).toBe('function');
  });

  it('should export AccountDetailsModal component', () => {
    expect(AccountManagementExports.AccountDetailsModal).toBeDefined();
    expect(typeof AccountManagementExports.AccountDetailsModal).toBe('function');
  });

  it('should export DeleteAccountDialog component', () => {
    expect(AccountManagementExports.DeleteAccountDialog).toBeDefined();
    expect(typeof AccountManagementExports.DeleteAccountDialog).toBe('function');
  });

  it('should have all expected exports', () => {
    const expectedExports = [
      'AccountManagement',
      'CreateAccountModal',
      'EditAccountModal',
      'AccountDetailsModal',
      'DeleteAccountDialog',
    ];

    expectedExports.forEach(exportName => {
      expect(AccountManagementExports).toHaveProperty(exportName);
    });
  });

  it('should export exactly 5 named exports', () => {
    const exportKeys = Object.keys(AccountManagementExports);
    expect(exportKeys).toHaveLength(5);
  });
});
