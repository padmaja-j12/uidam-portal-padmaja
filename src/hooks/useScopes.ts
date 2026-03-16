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
import { authService } from '@/services/auth.service';

/**
 * Hook to read token scopes and check access.
 * Scopes come from the stored token via authService (localStorage key: uidam_token_scopes).
 *
 * Usage:
 *   const { hasScope, hasAnyScope } = useScopes();
 *   if (hasScope('ManageUsers'))   → allow write actions
 *   if (hasAnyScope('ViewUsers', 'ManageUsers')) → allow read actions
 */
export const useScopes = () => {
  const scopes = authService.getStoredScopes();

  /** Returns true if the token contains exactly this scope. */
  const hasScope = (scope: string): boolean => scopes.includes(scope);

  /** Returns true if the token contains at least one of the listed scopes. */
  const hasAnyScope = (...required: string[]): boolean =>
    required.some(s => scopes.includes(s));

  return { scopes, hasScope, hasAnyScope };
};
