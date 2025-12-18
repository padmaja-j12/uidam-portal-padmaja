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
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Alert,
  Chip
} from '@mui/material';
import { Role } from '../../../types';
import { 
  AccountRoleMapping, 
  getAccountToggleTooltip, 
  canApproveAccountRoleChanges 
} from '../../../utils/accountRoleUtils';
import { getAccountPaperStyles } from '../../../utils/accountPaperStyles';
import { AccountRoleSelectorWithDefaults } from './AccountRoleSelectorWithDefaults';

interface AccountRoleSelectorProps {
  accountRoleMappings: AccountRoleMapping[];
  availableRoles: Role[];
  onRoleSelectionChange: (accountId: string, selectedRoles: string[]) => void;
  onAccountToggle: (accountId: string, isSelected: boolean) => void;
  showApprovalWarning?: boolean;
  allowEmptySelection?: boolean; // For active user management, allow no accounts selected
}

const AccountRoleSelector: React.FC<AccountRoleSelectorProps> = ({
  accountRoleMappings,
  availableRoles,
  onRoleSelectionChange,
  onAccountToggle,
  showApprovalWarning = true,
  allowEmptySelection = false
}) => {
  const canApprove = canApproveAccountRoleChanges(accountRoleMappings);
  
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Configure account and role assignments for this user. 
        {!allowEmptySelection && " At least one account must remain selected."}
      </Typography>
      
      {showApprovalWarning && !canApprove && !allowEmptySelection && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          At least one account must be selected to proceed.
        </Alert>
      )}
      
      {accountRoleMappings.map((mapping, index) => (
        <Paper 
          key={`${mapping.accountId}-${index}`}
          sx={getAccountPaperStyles(mapping)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Tooltip title={getAccountToggleTooltip(mapping)}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mapping.isAccountSelected}
                    onChange={(e) => onAccountToggle(mapping.accountId, e.target.checked)}
                    // For user approval, prevent if it would result in no accounts
                    // For active user management, allow unchecking all accounts
                    disabled={!allowEmptySelection && 
                      mapping.isAccountSelected && 
                      accountRoleMappings.filter(m => m.isAccountSelected).length === 1}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {mapping.accountName}
                    </Typography>
                    {!mapping.isNewAccount && (
                      <Chip 
                        label="User's Current Account" 
                        size="small" 
                        color="info" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                    {mapping.isNewAccount && (
                      <Chip 
                        label="Available Account" 
                        size="small" 
                        color="default" 
                        variant="outlined" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                }
              />
            </Tooltip>
          </Box>
          
          {mapping.isAccountSelected && (
            <AccountRoleSelectorWithDefaults
              accountId={mapping.accountId}
              accountName={mapping.accountName}
              isAccountSelected={mapping.isAccountSelected}
              selectedRoles={mapping.selectedRoles}
              defaultRoles={mapping.defaultRoles}
              originalRoles={mapping.originalRoles}
              availableRoles={availableRoles}
              onRoleSelectionChange={onRoleSelectionChange}
            />
          )}
          
          {!mapping.isAccountSelected && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Account not selected - user will not have access to this account
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default AccountRoleSelector;
