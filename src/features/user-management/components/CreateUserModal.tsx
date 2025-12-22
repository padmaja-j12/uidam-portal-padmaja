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
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Typography,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { UserService, CreateUserV2Request } from '../../../services/userService';
import { AccountService, Account } from '../../../services/accountService';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../types';
import { createFieldChangeHandler } from '../../../utils/formUtils';
import { logger } from '../../../utils/logger';
import { OAUTH_CONFIG } from '../../../config/app.config';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface AccountRoleSelection {
  accountId: string;
  accountName: string;
  roleIds: string[];
  roleNames: string[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
  gender: 'MALE' | 'FEMALE' | '';
  birthDate: string;
  locale: string;
  timeZone: string;
  notificationConsent: boolean;
  accountRoleSelections: AccountRoleSelection[];
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  userName: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  country: '',
  state: '',
  city: '',
  address1: '',
  address2: '',
  postalCode: '',
  gender: '',
  birthDate: '',
  locale: 'en-US',
  timeZone: 'UTC',
  notificationConsent: false,
  accountRoleSelections: [],
};

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Australia', 'Japan', 'India', 'Brazil', 'Mexico'
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  
  // State for accounts and roles
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch accounts and roles on component mount
  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchRoles();
    }
  }, [open]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await AccountService.getAllAccounts();
      if (response.success && response.data) {
        setAvailableAccounts(response.data.content);
        logger.debug('Fetched accounts:', response.data.content);
      } else {
        logger.error('Failed to fetch accounts:', response.error);
        setApiError(response.error || 'Failed to load accounts');
      }
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      setApiError('Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      logger.debug('Fetching all roles...');
      const roleService = new RoleService();
      const response = await roleService.getRoles({
        page: 0,
        size: 100,
        filter: {}
      });

      if (response && response.content) {
        setAvailableRoles(response.content);
        logger.debug(`Loaded ${response.content.length} available roles`);
      } else {
        logger.warn('No roles returned from API');
        setAvailableRoles([]);
      }
    } catch (error) {
      logger.error('Error fetching roles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiError(`Failed to load roles: ${errorMessage}`);
      setAvailableRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (field: keyof FormData) => 
    createFieldChangeHandler(field, setFormData, errors, setErrors);

  const handleAddAccount = () => {
    if (availableAccounts.length === 0) {
      setApiError('No accounts available. Please create an account first.');
      return;
    }
    
    // Add first available account that's not already selected
    const selectedAccountIds = formData.accountRoleSelections.map(sel => sel.accountId);
    const unselectedAccount = availableAccounts.find(acc => !selectedAccountIds.includes(acc.id));
    
    if (unselectedAccount) {
      setFormData(prev => ({
        ...prev,
        accountRoleSelections: [
          ...prev.accountRoleSelections,
          {
            accountId: unselectedAccount.id,
            accountName: unselectedAccount.accountName,
            roleIds: [],
            roleNames: [],
          },
        ],
      }));
    } else {
      setApiError('All available accounts have been added.');
    }
  };

  const handleRemoveAccount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accountRoleSelections: prev.accountRoleSelections.filter((_, i) => i !== index),
    }));
  };

  const handleAccountChange = (index: number, accountId: string) => {
    const selectedAccount = availableAccounts.find(acc => acc.id === accountId);
    if (!selectedAccount) return;

    setFormData(prev => {
      const newSelections = [...prev.accountRoleSelections];
      newSelections[index] = {
        accountId: selectedAccount.id,
        accountName: selectedAccount.accountName,
        roleIds: [],
        roleNames: [],
      };
      return { ...prev, accountRoleSelections: newSelections };
    });
  };

  const handleRoleChange = (index: number, roleIds: string[]) => {
    const roleNames = roleIds.map(id => {
      const role = availableRoles.find(r => r.id.toString() === id);
      return role ? role.name : id;
    });

    setFormData(prev => {
      const newSelections = [...prev.accountRoleSelections];
      newSelections[index] = {
        ...newSelections[index],
        roleIds,
        roleNames,
      };
      return { ...prev, accountRoleSelections: newSelections };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.userName.trim()) newErrors.userName = 'Username is required';
    
    if (!formData.password) newErrors.password = 'Password is required'; // NOSONAR (typescript:S2068) - This is form validation checking for empty input, not a hard-coded credential
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required'; // NOSONAR (typescript:S2068) - Form validation for password confirmation field, not a credential

    // Email validation - Using simple regex to avoid ReDoS vulnerability
    // Pattern: one or more non-whitespace/@ chars, then @, then domain with dot
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // NOSONAR - This regex uses character classes only (no backtracking, linear time complexity)
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'; // NOSONAR (typescript:S2068) - Validating password length requirement, not a hard-coded credential
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'; // NOSONAR (typescript:S2068) - Comparing user input fields, not hard-coded values
    }

    // Username validation (no spaces, special characters)
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (formData.userName && !usernameRegex.test(formData.userName)) {
      newErrors.userName = 'Username can only contain letters, numbers, dots, underscores, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // Transform accountRoleSelections into the format expected by the API
      const accounts = formData.accountRoleSelections.map(selection => ({
        account: selection.accountName,
        roles: selection.roleNames,
      }));

      const createUserRequest: CreateUserV2Request = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        accounts: accounts,
        userName: formData.userName.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim() !== '' ? formData.phoneNumber.trim() : undefined,
        country: formData.country !== '' ? formData.country : undefined,
        state: formData.state !== '' ? formData.state : undefined,
        city: formData.city !== '' ? formData.city : undefined,
        address1: formData.address1.trim() !== '' ? formData.address1.trim() : undefined,
        address2: formData.address2.trim() !== '' ? formData.address2.trim() : undefined,
        postalCode: formData.postalCode.trim() !== '' ? formData.postalCode.trim() : undefined,
        gender: formData.gender !== '' ? formData.gender : undefined,
        birthDate: formData.birthDate !== '' ? formData.birthDate : undefined,
        aud: OAUTH_CONFIG.CLIENT_ID, // Use client ID from config as audience
      };

      const response = await UserService.createUserV2(createUserRequest);

      // Log response to debug
      logger.debug('Create user response:', response);

      // Check for explicit error response (for test compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((response as any)?.code === 'ERROR' || (response as any)?.message) {
        // Error returned in response body (legacy/test format)
        logger.error('User creation failed:', (response as any).message);
        setApiError((response as any).message || 'Failed to create user');
      } else if (response) {
        // Success case - API returned 201 with user data, or code: 'SUCCESS'
        logger.debug('User created successfully');
        onUserCreated();
        handleClose();
      } else {
        // This shouldn't happen since handleApiResponse would throw on error
        logger.error('User creation returned null/undefined response');
        setApiError('Failed to create user');
      }
    } catch (error: unknown) {
      logger.error('Error creating user:', error);
      
      // Parse error message from various possible formats
      const err = error as { message?: string; response?: { data?: { message?: string; messages?: Array<{ key?: string }> } } };
      
      let errorMessage = 'Failed to create user';
      
      // Check if it's a duplicate user error (409)
      if (err.message?.includes('409') || err.message?.includes('field.is.unique')) {
        errorMessage = 'User already exists. Please use a different username or email.';
      } else if (err.response?.data?.messages) {
        // Handle structured error messages
        const messages = err.response.data.messages;
        if (messages.some((m: { key?: string }) => m.key === 'field.is.unique')) {
          errorMessage = 'User already exists. Please use a different username or email.';
        } else {
          errorMessage = messages.map((m: { key?: string }) => m.key).join(', ');
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormData);
      setErrors({});
      setApiError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Create New User</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {apiError !== '' && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {apiError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon fontSize="small" />
                Basic Information
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={loading}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username"
              value={formData.userName}
              onChange={handleChange('userName')}
              error={!!errors.userName}
              helperText={errors.userName || 'Letters, numbers, dots, underscores, and hyphens only'}
              required
              disabled={loading}
            />
          </Grid>

          {/* Authentication */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <LockIcon fontSize="small" />
                Authentication
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              required
              disabled={loading}
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Contact Information (Optional)
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange('phoneNumber')}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Country</InputLabel>
              <Select
                value={formData.country}
                onChange={handleChange('country')}
                label="Country"
              >
                <MenuItem value="">
                  <em>Select Country</em>
                </MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.state}
              onChange={handleChange('state')}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleChange('city')}
              disabled={loading}
            />
          </Grid>

          {/* Account and Role Assignments */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Account and Role Assignments
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddAccount}
                disabled={loading || loadingAccounts}
                variant="outlined"
                size="small"
              >
                Add Account
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {loadingAccounts && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            </Grid>
          )}

          {!loadingAccounts && availableAccounts.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                No accounts available. Please create an account first.
              </Alert>
            </Grid>
          )}

          {formData.accountRoleSelections.length === 0 && !loadingAccounts && availableAccounts.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                Click &quot;Add Account&quot; to assign accounts and roles to this user.
              </Alert>
            </Grid>
          )}

          {formData.accountRoleSelections.map((selection, index) => {
            const selectedAccountIds = formData.accountRoleSelections.map(sel => sel.accountId);
            const availableAccountsForSelection = availableAccounts.filter(
              acc => acc.id === selection.accountId || !selectedAccountIds.includes(acc.id)
            );

            return (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth disabled={loading}>
                            <InputLabel>Account</InputLabel>
                            <Select
                              value={selection.accountId}
                              onChange={(e) => handleAccountChange(index, e.target.value as string)}
                              label="Account"
                            >
                              {availableAccountsForSelection.map((account) => (
                                <MenuItem key={account.id} value={account.id}>
                                  {account.accountName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth disabled={loading || loadingRoles}>
                            <InputLabel>Roles</InputLabel>
                            <Select
                              multiple
                              value={selection.roleIds}
                              onChange={(e) => handleRoleChange(index, e.target.value as string[])}
                              label="Roles"
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((roleId) => {
                                    const role = availableRoles.find(r => r.id.toString() === roleId);
                                    return (
                                      <Chip 
                                        key={roleId} 
                                        label={role ? role.name : roleId} 
                                        size="small" 
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                            >
                              {loadingRoles ? (
                                <MenuItem disabled>
                                  <CircularProgress size={20} />
                                  <Typography sx={{ ml: 1 }}>Loading roles...</Typography>
                                </MenuItem>
                              ) : availableRoles.length === 0 ? (
                                <MenuItem disabled>
                                  <Typography>No roles available</Typography>
                                </MenuItem>
                              ) : (
                                availableRoles.map((role) => (
                                  <MenuItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                    {role.description && (
                                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                        - {role.description}
                                      </Typography>
                                    )}
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                    <IconButton
                      onClick={() => handleRemoveAccount(index)}
                      disabled={loading}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            );
          })}

          {/* Preferences */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notificationConsent}
                  onChange={handleChange('notificationConsent')}
                  disabled={loading}
                />
              }
              label="Allow email notifications"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserModal;
