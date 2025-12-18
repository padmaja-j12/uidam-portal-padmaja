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
import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AccountService } from '../../../services/accountService';
import { Account } from '../../../types';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountDeleted: (accountName: string) => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onClose,
  account,
  onAccountDeleted
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const response = await AccountService.deleteAccount(account.id);

      if (response.success) {
        onAccountDeleted(account.accountName);
        onClose();
      } else {
        throw new Error(response.error ?? 'Failed to delete account');
      }
    } catch (err) {
      let errorMessage = 'Failed to delete account';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Handle specific API errors
      if (typeof err === 'object' && err !== null && 'status' in err) {
        switch ((err as any).status) {
          case 400:
            errorMessage = 'Cannot delete account. It may have dependent resources or be a default account.';
            break;
          case 401:
            errorMessage = 'You are not authorized to delete accounts.';
            break;
          case 403:
            errorMessage = 'You do not have permission to delete this account.';
            break;
          case 404:
            errorMessage = 'Account not found. It may have already been deleted.';
            break;
          case 409:
            errorMessage = 'Cannot delete account. It has associated users or is referenced by other accounts.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      }

      setError(errorMessage);
      console.error('Error deleting account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  if (!account) {
    return null;
  }

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      case 'BLOCKED': return 'error';
      case 'DELETED': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '300px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="div">
            Delete Account
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. Deleting an account will permanently remove it from the system.
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the following account?
          </Typography>

          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Account Details:
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                <strong>ID:</strong> {account.id}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                <strong>Name:</strong> {account.accountName}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> 
                <Chip 
                  label={account.status} 
                  color={getStatusColor(account.status)} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              {account.parentId && (
                <Typography variant="body1">
                  <strong>Parent ID:</strong> {account.parentId}
                </Typography>
              )}
              {account.roles && account.roles.length > 0 && (
                <Typography variant="body1">
                  <strong>Roles:</strong> {account.roles.join(', ')}
                </Typography>
              )}
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Before deleting:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Ensure no users are currently associated with this account</li>
              <li>Check if this account is referenced by other accounts as a parent</li>
              <li>Verify that this is not a default or system account</li>
              <li>Consider suspending the account instead if you may need to restore it</li>
            </Box>
          </Alert>
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
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
          sx={{ minWidth: '120px' }}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountDialog;
