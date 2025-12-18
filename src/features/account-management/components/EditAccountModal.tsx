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
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { AccountService } from '../../../services/accountService';
import { useRoles } from '../../../hooks/useRoles';
import { getAccountErrorMessage } from '../../../utils/accountErrorUtils';
import { RoleMultiSelect } from './RoleMultiSelect';
import {
  Account,
  UpdateAccountRequest,
  AccountStatus
} from '../../../types';
import { logger } from '../../../utils/logger';

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountUpdated: (account: Account) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  open,
  onClose,
  account,
  onAccountUpdated
}) => {
  // Form state
  const [formData, setFormData] = useState<UpdateAccountRequest>({
    parentId: undefined,
    roles: [],
    status: AccountStatus.ACTIVE
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available roles using custom hook
  const { roles: availableRoles, loading: loadingRoles } = useRoles(open);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when modal opens
  useEffect(() => {
    if (open && account) {
      initializeForm();
    }
  }, [open, account]);

  const initializeForm = () => {
    if (account) {
      setFormData({
        parentId: account.parentId,
        roles: account.roles || [],
        status: account.status || 'ACTIVE'
      });
    }
    setError(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.parentId !== undefined && formData.parentId !== '') {
      const parentIdNum = Number(formData.parentId);
      if (isNaN(parentIdNum) || parentIdNum <= 0) {
        newErrors.parentId = 'Parent ID must be a positive number';
      }
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UpdateAccountRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const roles = typeof value === 'string' ? value.split(',') : value;
    handleInputChange('roles', roles);
  };

  const handleSubmit = async () => {
    if (!account || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the update data according to the API specification
      const updateData: UpdateAccountRequest = {
        status: formData.status,
        roles: formData.roles || []
      };

      // Only include parentId if it's provided and valid
      if (formData.parentId && formData.parentId !== '') {
        const parentIdNum = Number(formData.parentId);
        if (!isNaN(parentIdNum) && parentIdNum > 0) {
          updateData.parentId = parentIdNum.toString();
        }
      }

      const response = await AccountService.updateAccount(
        account.id,
        updateData
      );

      if (response.success) {
        // Since update might return a string, we need to refetch the account
        // For now, we'll create a mock updated account
        const updatedAccount: Account = {
          ...account,
          ...updateData,
          updateDate: new Date().toISOString(),
          updatedBy: 'current-user' // This should come from auth context
        };
        onAccountUpdated(updatedAccount);
        onClose();
      } else {
        throw new Error(response.error ?? 'Failed to update account');
      }
    } catch (err) {
      const errorMessage = getAccountErrorMessage(err, { operation: 'update' });
      setError(errorMessage);
      logger.error('Error updating account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!account) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Edit Account: {account.accountName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Account Name - Read Only */}
          <TextField
            label="Account Name"
            value={account.accountName}
            fullWidth
            disabled
            helperText="Account name cannot be changed after creation"
          />

          {/* Account ID - Read Only */}
          <TextField
            label="Account ID"
            value={account.id}
            fullWidth
            disabled
            helperText="Account ID is system-generated and cannot be changed"
          />

          <TextField
            label="Parent ID"
            value={formData.parentId ?? ''}
            onChange={(e) => handleInputChange('parentId', e.target.value)}
            fullWidth
            type="number"
            error={!!errors.parentId}
            helperText={errors.parentId ?? 'Optional: ID of the parent account for hierarchical organization'}
            placeholder="e.g., 123"
            disabled={loading}
            InputProps={{
              inputProps: { min: 1 }
            }}
          />

          <FormControl fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              label="Status"
              disabled={loading}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="BLOCKED">Blocked</MenuItem>
              <MenuItem value="DELETED">Deleted</MenuItem>
            </Select>
            {errors.status && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.status}
              </Typography>
            )}
          </FormControl>

          <RoleMultiSelect
            value={formData.roles || []}
            onChange={handleRoleChange}
            availableRoles={availableRoles}
            loading={loadingRoles}
            disabled={loading}
            helperText="Update roles assigned to this account"
          />

          {/* Creation Info - Read Only */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created by: {account.createdBy || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created on: {account.createDate ? new Date(account.createDate).toLocaleDateString() : 'N/A'}
            </Typography>
            {account.updatedBy && (
              <Typography variant="body2" color="text.secondary">
                Last updated by: {account.updatedBy}
              </Typography>
            )}
            {account.updateDate && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(account.updateDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.status}
          sx={{ minWidth: '100px' }}
        >
          {loading ? <CircularProgress size={20} /> : 'Update Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAccountModal;
