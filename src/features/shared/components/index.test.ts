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
import * as SharedComponentsExports from './index';

describe('Shared Components Index Exports', () => {
  it('should export AccountRoleSelector component', () => {
    expect(SharedComponentsExports.AccountRoleSelector).toBeDefined();
    expect(typeof SharedComponentsExports.AccountRoleSelector).toBe('function');
  });

  it('should be an object with exports', () => {
    expect(typeof SharedComponentsExports).toBe('object');
  });

  it('should have at least one export', () => {
    const exportKeys = Object.keys(SharedComponentsExports);
    expect(exportKeys.length).toBeGreaterThanOrEqual(1);
  });

  it('should have AccountRoleSelector in exports', () => {
    expect(Object.keys(SharedComponentsExports)).toContain('AccountRoleSelector');
  });

  it('should export components as functions', () => {
    expect(typeof SharedComponentsExports.AccountRoleSelector).toBe('function');
  });
});
