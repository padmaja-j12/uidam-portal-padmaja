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
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { RoleSelector } from './RoleSelector';
import { Role } from '../../../types';

interface AccountRoleSelectorWithDefaultsProps {
  accountId: string;
  accountName: string;
  isAccountSelected: boolean;
  selectedRoles: string[];
  defaultRoles: string[];
  originalRoles: string[];
  availableRoles: Role[];
  onRoleSelectionChange: (accountId: string, selectedRoles: string[]) => void;
}

/**
 * Reusable component for displaying account role selection with default roles chips
 * Shows:
 * - Default roles as chips (if any exist)
 * - RoleSelector component for role management
 * - Message when account is not selected
 */
export const AccountRoleSelectorWithDefaults: React.FC<AccountRoleSelectorWithDefaultsProps> = ({
  accountId,
  accountName,
  isAccountSelected,
  selectedRoles,
  defaultRoles,
  originalRoles,
  availableRoles,
  onRoleSelectionChange,
}) => {
  if (!isAccountSelected) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Account not selected - user will not have access to this account
      </Typography>
    );
  }

  return (
    <>
      {defaultRoles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Default roles for this account (can be deselected):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {defaultRoles.map((role) => (
              <Chip 
                key={role} 
                label={role} 
                size="small" 
                color={selectedRoles.includes(role) ? "primary" : "default"}
                variant={selectedRoles.includes(role) ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
      )}
      
      <RoleSelector
        accountName={accountName}
        selectedRoles={selectedRoles}
        defaultRoles={defaultRoles}
        originalRoles={originalRoles}
        availableRoles={availableRoles}
        onRoleSelectionChange={(selectedRoles) => onRoleSelectionChange(accountId, selectedRoles)}
      />
    </>
  );
};
