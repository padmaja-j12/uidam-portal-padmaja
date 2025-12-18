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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Box,
  Typography,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { Role } from '../../../types';

interface RoleMultiSelectProps {
  value: string[];
  onChange: (event: SelectChangeEvent<string[]>) => void;
  availableRoles: Role[];
  loading: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: boolean;
}

/**
 * Reusable multi-select component for roles
 * Used in both CreateAccountModal and EditAccountModal
 */
export const RoleMultiSelect: React.FC<RoleMultiSelectProps> = ({
  value,
  onChange,
  availableRoles,
  loading,
  disabled = false,
  helperText,
  error = false
}) => {
  return (
    <FormControl fullWidth error={error}>
      <InputLabel>Roles</InputLabel>
      <Select
        multiple
        value={value || []}
        onChange={onChange}
        input={<OutlinedInput label="Roles" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((roleName) => (
              <Chip key={roleName} label={roleName} size="small" />
            ))}
          </Box>
        )}
        disabled={disabled || loading}
      >
        {loading && (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Loading roles...
          </MenuItem>
        )}
        {!loading && availableRoles.length === 0 && (
          <MenuItem disabled>No roles available</MenuItem>
        )}
        {!loading && availableRoles.length > 0 && (
          availableRoles.map((role) => (
            <MenuItem key={role.name} value={role.name}>
              <Box>
                <Typography variant="body2">{role.name}</Typography>
                {role.description && (
                  <Typography variant="caption" color="text.secondary">
                    {role.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};
