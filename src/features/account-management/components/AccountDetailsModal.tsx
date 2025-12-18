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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Account } from '../../../types';

interface AccountDetailsModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  open,
  onClose,
  account
}) => {
  if (!account) {
    return null;
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

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
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountIcon color="primary" />
          <Typography variant="h6" component="div">
            Account Details
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ pt: 1 }}>
          {/* Basic Information Card */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BusinessIcon color="primary" />
                  <Typography variant="h6">Basic Information</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account ID
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {account.id}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {account.accountName}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Parent ID
                    </Typography>
                    <Typography variant="body1">
                      {account.parentId ?? 'None (Root Account)'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={account.status}
                      color={getStatusColor(account.status)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Roles and Permissions Card */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Roles and Permissions</Typography>
                </Box>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Assigned Roles
                </Typography>
                
                {account.roles && account.roles.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {account.roles.map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        variant="outlined"
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No roles assigned to this account
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Audit Information Card */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">Audit Information</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body1">
                      {account.createdBy ?? 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Creation Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(account.createDate)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated By
                    </Typography>
                    <Typography variant="body1">
                      {account.updatedBy ?? 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Update Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(account.updateDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Hierarchy Information (if applicable) */}
          {account.parentId && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hierarchy Information
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    This account is a child account under Parent ID: <strong>{account.parentId}</strong>
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Child accounts inherit certain permissions and settings from their parent accounts.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Status Information */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'info.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Information
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Current Status: <Chip 
                    label={account.status} 
                    color={getStatusColor(account.status)} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Status Meanings:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                    <li><strong>Active:</strong> Account is fully operational</li>
                    <li><strong>Pending:</strong> Account is awaiting activation</li>
                    <li><strong>Suspended:</strong> Account is temporarily disabled</li>
                    <li><strong>Blocked:</strong> Account is permanently disabled</li>
                    <li><strong>Deleted:</strong> Account is marked for deletion</li>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDetailsModal;
