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
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  Typography
} from '@mui/material';
import { Role } from '../../../types';

interface RoleSelectorProps {
  accountName: string;
  selectedRoles: string[];
  defaultRoles: string[];
  originalRoles: string[];
  availableRoles: Role[];
  onRoleSelectionChange: (selectedRoles: string[]) => void;
}

/**
 * Reusable role selector component for account role management
 * Displays a multi-select dropdown with role selection and current roles
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  accountName,
  selectedRoles,
  defaultRoles,
  originalRoles,
  availableRoles,
  onRoleSelectionChange
}) => {
  return (
    <>
      <FormControl fullWidth sx={{ mt: 1 }}>
        <InputLabel>Select Roles for {accountName}</InputLabel>
        <Select
          multiple
          value={selectedRoles}
          onChange={(e) => onRoleSelectionChange(e.target.value as string[])}
          input={<OutlinedInput label={`Select Roles for ${accountName}`} />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value: string) => (
                <Chip 
                  key={value} 
                  label={value} 
                  size="small"
                  color={defaultRoles.includes(value) ? "primary" : "secondary"}
                />
              ))}
            </Box>
          )}
        >
          {availableRoles.map((role) => (
            <MenuItem key={role.name} value={role.name}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Checkbox
                  checked={selectedRoles.includes(role.name)}
                  size="small"
                />
                <Box sx={{ ml: 1, flexGrow: 1 }}>
                  {role.name}
                  {defaultRoles.includes(role.name) && (
                    <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />
                  )}
                  {originalRoles.includes(role.name) && !defaultRoles.includes(role.name) && (
                    <Chip label="Current" size="small" color="info" sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          You can select any combination of roles. Default roles are pre-selected but can be deselected.
        </Typography>
      </FormControl>
      
      {originalRoles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Current roles:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {originalRoles.map((role) => (
              <Chip key={role} label={role} size="small" color="info" />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};
