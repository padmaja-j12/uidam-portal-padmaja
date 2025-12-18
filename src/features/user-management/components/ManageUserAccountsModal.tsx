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
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  TextField,
  Snackbar
} from '@mui/material';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { User as ServiceUser, UserService } from '../../../services/userService';
import { AccountService } from '../../../services/accountService';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../types';
import AccountRoleSelector from '../../shared/components/AccountRoleSelector';
import { 
  AccountRoleMapping, 
  initializeAccountRoleMappings,
  updateRoleSelection,
  toggleAccountSelection,
  calculateAccountRoleOperations
} from '../../../utils/accountRoleUtils';
import { validateJsonPatchOperations } from '../../../utils/jsonPatchUtils';
import { logger } from '../../../utils/logger';

interface ManageUserAccountsModalProps {
  open: boolean;
  onClose: () => void;
  user: ServiceUser | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const ManageUserAccountsModal: React.FC<ManageUserAccountsModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
  onError
}) => {
  // Form state
  const [accountRoleMappings, setAccountRoleMappings] = useState<AccountRoleMapping[]>([]);
  const [notes, setNotes] = useState('');
  
  // Available options
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  
  // Feedback state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load available roles function
  const loadAvailableRoles = useCallback(async () => {
    try {
      const roleService = new RoleService();
      const response = await roleService.getRoles({
        page: 0,
        size: 100,
        filter: {}
      });

      if (response && response.content) {
        setAvailableRoles(response.content);
        logger.debug(`Loaded ${response.content.length} available roles`);
      }
    } catch (err) {
      logger.error('Error loading roles:', err);
      throw err;
    }
  }, []);

  // Move initializeAccountData above useEffect to avoid use-before-declaration
  const initializeAccountData = useCallback(async () => {
    if (!user) return;
    try {
      setInitializing(true);
      setError(null);
      logger.debug('Initializing account data for user:', user.id);
      
      // Load available roles
      await loadAvailableRoles();
      
      // Fetch ALL accounts (including INACTIVE) to debug Demo Account issue
      const accountsResponse = await AccountService.getAllAccounts({ pageNumber: 0, pageSize: 1000 });
      const accounts = accountsResponse.success && accountsResponse.data?.content 
        ? accountsResponse.data.content 
        : [];
      logger.debug(`Fetched ${accounts.length} accounts (all statuses):`, accounts.map(a => ({ id: a.id, name: a.accountName, status: a.status })));
      
      // Get complete user data including all accounts and roles
      let completeUser: ServiceUser;
      try {
        const completeUserResponse = await UserService.getUserV2(user.id);
        if (completeUserResponse.data) {
          completeUser = completeUserResponse.data;
          logger.debug('Complete user data from API:', {
            id: completeUser.id,
            userName: completeUser.userName,
            accounts: completeUser.accounts,
            accountCount: completeUser.accounts?.length ?? 0
          });
        } else {
          logger.debug('API response format unexpected, using provided user data as fallback');
          completeUser = user;
        }
      } catch (err) {
        logger.error('Error fetching complete user data:', err);
        completeUser = user;
      }
      // Initialize account role mappings
      const mappings = initializeAccountRoleMappings(completeUser, accounts);
      setAccountRoleMappings(mappings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize account data');
      logger.error('Error initializing account data:', err);
    } finally {
      setInitializing(false);
    }
  }, [user, loadAvailableRoles]);

  // Initialize account role mappings when modal opens with a user
  useEffect(() => {
    if (user && open) {
      initializeAccountData();
    }
  }, [user, open, initializeAccountData]);

  const handleRoleSelectionChange = (accountId: string, selectedRoles: string[]) => {
    setAccountRoleMappings(prev => updateRoleSelection(prev, accountId, selectedRoles));
  };

  const handleAccountToggle = (accountId: string, isSelected: boolean) => {
    setAccountRoleMappings(prev => {
      const updatedMappings = toggleAccountSelection(prev, accountId, isSelected);
      
      // Log the change for debugging
      const selectedAccountsCount = updatedMappings.filter(m => m.isAccountSelected).length;
      logger.debug(`Account ${accountId} ${isSelected ? 'selected' : 'unselected'}. Total selected accounts: ${selectedAccountsCount}`);

      return updatedMappings;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Calculate JsonPatch operations for account role changes
      const operations = calculateAccountRoleOperations(accountRoleMappings);
      
      if (operations.length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes detected',
          severity: 'success'
        });
        onClose();
        return;
      }
      
      // Validate operations before sending
      const validationResult = validateJsonPatchOperations(operations);
      if (!validationResult.isValid) {
        logger.error('Invalid operations detected:', validationResult.invalidOperations);
        throw new Error('Invalid operations detected. Please refresh and try again.');
      }
      
      logger.debug('Sending JsonPatch operations to V2 API:', operations);
      
      // Use V2 API with JsonPatch to handle account changes
      const response = await UserService.updateUserV2(user.id, operations);
      
      if (response?.message && !response.message.toLowerCase().includes('success')) {
        throw new Error(`Account management failed: ${response.message}`);
      }
      
      logger.debug('User account management successful:', response);
      
      const successMessage = `Account and role assignments updated successfully for ${user.userName}`;
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });
      
      // Notify parent component of success
      if (onSuccess) {
        onSuccess(successMessage);
      }
      
      onClose();
    } catch (err) {
      logger.error('Account management failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account assignments';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form state
      setAccountRoleMappings([]);
      setNotes('');
      setError(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountCircleIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Manage Account & Role Assignments
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {user?.firstName} {user?.lastName} (@{user?.userName})
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ minHeight: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {initializing ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading account information...</Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Modify the user&apos;s account and role assignments. Changes will be applied immediately.
                Unlike user approval, you can remove all accounts if needed.
              </Typography>
              
              <AccountRoleSelector
                accountRoleMappings={accountRoleMappings}
                availableRoles={availableRoles}
                onRoleSelectionChange={handleRoleSelectionChange}
                onAccountToggle={handleAccountToggle}
                showApprovalWarning={false}
                allowEmptySelection={true} // Allow no accounts for active user management
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Management Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about these changes..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || initializing}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update Assignments'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ManageUserAccountsModal;
