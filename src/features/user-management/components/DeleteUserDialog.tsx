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
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { UserService, User } from '../../../services/userService';

interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUserDeleted: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  user,
  onClose,
  onUserDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!user || !confirmDelete) return;

    setLoading(true);
    setApiError('');

    try {
      // Use V1 delete API which supports external user flag
      const result = await UserService.deleteUserV1(user.id);
      
      // Check if the API response indicates success
      if (result.code && result.code !== 'SUCCESS') {
        throw new Error(result.message ?? 'Server returned an error response');
      }
      
      onUserDeleted();
      onClose();
      
      // Reset state
      setConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to delete user';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for common error patterns and provide user-friendly messages
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'Permission denied: You do not have permission to delete this user';
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        errorMessage = 'User not found: This user may have already been deleted';
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        errorMessage = 'Cannot delete user: User has dependencies that must be removed first';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        errorMessage = 'Server error: Please try again later or contact support';
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setApiError('');
    setConfirmDelete(false);
    onClose();
  };

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'BLOCKED':
      case 'REJECTED':
        return 'error';
      case 'DEACTIVATED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <WarningIcon />
        <Typography variant="h6">Delete User</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            This action cannot be undone!
          </Typography>
          <Typography variant="body2">
            Deleting a user will permanently remove all their data from the system, 
            including their profile, account associations, and access permissions.
          </Typography>
        </Alert>

        <Box sx={{ 
          p: 2, 
          border: '1px solid', 
          borderColor: 'grey.300', 
          borderRadius: 1,
          backgroundColor: 'grey.50'
        }}>
          <Typography variant="h6" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2 
          }}>
            <PersonIcon color="primary" />
            User Information
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">ID</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{user.id}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Username</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{user.userName}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Full Name</Typography>
            <Typography variant="body1">{user.firstName} {user.lastName}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{user.email}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={user.status}
              color={getStatusColor(user.status) as any}
              size="small"
            />
          </Box>

          {user.accounts && user.accounts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Associated Accounts
              </Typography>
              {user.accounts.map((account: any) => (
                <Box key={`${account.account}-${account.roles.join('-')}`} sx={{ ml: 1, mb: 1 }}>
                  <Typography variant="body2">
                    • {account.account} ({account.roles.join(', ')})
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              color="error"
            />
          }
          label={
            <Typography variant="body2">
              I understand that this action cannot be undone and I want to permanently delete this user
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDelete}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          disabled={loading || !confirmDelete}
        >
          {loading ? 'Deleting...' : 'Delete User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;
