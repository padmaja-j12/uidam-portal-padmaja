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
import * as UserApprovalExports from './index';

describe('User Approval Index Exports', () => {
  it('should export UserApproval component', () => {
    expect(UserApprovalExports.UserApproval).toBeDefined();
    expect(typeof UserApprovalExports.UserApproval).toBe('function');
  });

  it('should be a valid React component', () => {
    const Component = UserApprovalExports.UserApproval;
    expect(Component).toBeDefined();
    expect(typeof Component).toBe('function');
  });

  it('should have UserApproval in exports', () => {
    expect(Object.keys(UserApprovalExports)).toContain('UserApproval');
  });

  it('should have exactly one named export', () => {
    const exportKeys = Object.keys(UserApprovalExports);
    expect(exportKeys).toHaveLength(1);
    expect(exportKeys[0]).toBe('UserApproval');
  });
});
