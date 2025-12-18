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
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { AccountService } from '../../../services/accountService';
import { useRoles } from '../../../hooks/useRoles';
import { getAccountErrorMessage } from '../../../utils/accountErrorUtils';
import { RoleMultiSelect } from './RoleMultiSelect';
import {
  Account,
  CreateAccountRequest
} from '../../../types';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountCreated: (account: Account) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  open,
  onClose,
  onAccountCreated
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateAccountRequest>({
    accountName: '',
    parentId: undefined,
    roles: []
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available roles using custom hook
  const { roles: availableRoles, loading: loadingRoles } = useRoles(open);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      accountName: '',
      parentId: undefined,
      roles: []
    });
    setError(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    } else if (formData.accountName.length > 254) {
      newErrors.accountName = 'Account name must be 254 characters or less';
    }

    if (formData.parentId !== undefined && formData.parentId !== '') {
      const parentIdNum = Number(formData.parentId);
      if (isNaN(parentIdNum) || parentIdNum <= 0) {
        newErrors.parentId = 'Parent ID must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateAccountRequest, value: any) => {
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
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the account data according to the API specification
      const accountData: CreateAccountRequest = {
        accountName: formData.accountName.trim(),
        roles: formData.roles || []
      };

      // Only include parentId if it's provided and valid
      if (formData.parentId && formData.parentId !== '') {
        const parentIdNum = Number(formData.parentId);
        if (!isNaN(parentIdNum) && parentIdNum > 0) {
          accountData.parentId = parentIdNum.toString();
        }
      }

      const response = await AccountService.createAccount(accountData);

      if (response.success && response.data) {
        onAccountCreated(response.data);
        onClose();
      } else {
        throw new Error(response.error ?? 'Failed to create account');
      }
    } catch (err) {
      const errorMessage = getAccountErrorMessage(err, { operation: 'create' });
      setError(errorMessage);
      console.error('Error creating account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

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
          Create New Account
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Account Name"
            value={formData.accountName}
            onChange={(e) => handleInputChange('accountName', e.target.value)}
            fullWidth
            required
            error={!!errors.accountName}
            helperText={errors.accountName || 'Enter a unique name for the account (max 254 characters)'}
            placeholder="e.g., Production Account, Development Team"
            disabled={loading}
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

          <RoleMultiSelect
            value={formData.roles || []}
            onChange={handleRoleChange}
            availableRoles={availableRoles}
            loading={loadingRoles}
            disabled={loading}
            helperText="Select roles to assign to this account (optional)"
          />
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
          disabled={loading || !formData.accountName.trim()}
          sx={{ minWidth: '100px' }}
        >
          {loading ? <CircularProgress size={20} /> : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountModal;
