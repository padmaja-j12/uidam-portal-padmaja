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
import { useState, useEffect } from 'react';
import { RoleService } from '@/services/role.service';
import { Role } from '@/types';

/**
 * Custom hook to fetch and manage available roles
 * @param shouldLoad - Whether to load roles (typically tied to modal open state)
 * @returns Object containing roles array, loading state, and error state
 */
export const useRoles = (shouldLoad: boolean = false) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldLoad) {
      loadRoles();
    }
  }, [shouldLoad]);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const roleService = new RoleService();
      const response = await roleService.getRoles({
        page: 0,
        size: 100, // Get first 100 roles
        filter: {} // No specific filter, get all roles
      });

      if (response?.content) {
        setRoles(response.content);
      } else {
        console.warn('No roles found or unexpected response format');
        setRoles([]);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  return { roles, loading, error, refetch: loadRoles };
};
