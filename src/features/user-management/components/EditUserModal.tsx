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
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { UserService, User } from '../../../services/userService';
import { createFieldChangeHandler } from '../../../utils/formUtils';
import { logger } from '../../../utils/logger';

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
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
  status: 'PENDING' | 'BLOCKED' | 'REJECTED' | 'ACTIVE' | 'DELETED' | 'DEACTIVATED';
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'BLOCKED', label: 'Blocked', color: 'error' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'DEACTIVATED', label: 'Deactivated', color: 'default' },
] as const;

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  user,
  onClose,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: '',
    state: '',
    city: '',
    address1: '',
    address2: '',
    postalCode: '',
    gender: '',
    birthDate: '',
    locale: '',
    timeZone: '',
    notificationConsent: false,
    status: 'ACTIVE',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phoneNumber: user.phoneNumber ?? '',
        country: user.country ?? '',
        state: user.state ?? '',
        city: user.city ?? '',
        address1: user.address1 ?? '',
        address2: user.address2 ?? '',
        postalCode: user.postalCode ?? '',
        gender: user.gender ?? '',
        birthDate: user.birthDate ?? '',
        locale: user.locale ?? '',
        timeZone: user.timeZone ?? '',
        notificationConsent: Boolean(user.notificationConsent),
        status: user.status,
      });
      
      // Clear any previous errors
      setErrors({});
      setApiError('');
    }
  }, [user]);

  const handleChange = (field: keyof FormData) => 
    createFieldChangeHandler(field, setFormData, errors, setErrors);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';

    // Email validation - Using simple regex to avoid ReDoS vulnerability
    // Pattern: one or more non-whitespace/@ chars, then @, then domain with dot
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // NOSONAR - This regex uses character classes only (no backtracking, linear time complexity)
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPatchOperations = (): Array<{op: string, path: string, value: any}> => {
    if (!user) return [];

    const patches: Array<{op: string, path: string, value: any}> = [];
    const fields: Array<keyof FormData> = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'country', 'state', 
      'city', 'address1', 'address2', 'postalCode', 'gender', 'birthDate', 
      'locale', 'timeZone', 'notificationConsent', 'status'
    ];

    fields.forEach(field => {
      const oldValue = user[field];
      const newValue = formData[field];
      
      // Handle different types of comparisons
      let hasChanged = false;
      
      if (field === 'notificationConsent') {
        // Boolean comparison
        hasChanged = Boolean(oldValue) !== Boolean(newValue);
      } else if (oldValue === null || oldValue === undefined) {
        // Handle null/undefined old values
        hasChanged = newValue !== '' && newValue !== null && newValue !== undefined;
      } else if (newValue === null || newValue === undefined || newValue === '') {
        // Handle null/undefined/empty new values
        hasChanged = oldValue !== '' && oldValue !== null && oldValue !== undefined;
      } else {
        // String comparison (trim whitespace for string fields)
        const oldStr = String(oldValue).trim();
        const newStr = String(newValue).trim();
        hasChanged = oldStr !== newStr;
      }
      
      if (hasChanged) {
        patches.push({
          op: 'replace',
          path: `/${field}`,
          value: newValue === '' ? null : newValue // Convert empty strings to null
        });
      }
    });

    return patches;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      setApiError('No user selected');
      return;
    }
    
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const patches = createPatchOperations();
      
      if (patches.length === 0) {
        setApiError('No changes detected');
        setLoading(false);
        return;
      }

      await UserService.updateUserV2(user.id, patches);
      
      onUserUpdated();
      onClose();
    } catch (error) {
      logger.error('Error updating user:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to update user';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setApiError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <EditIcon />
        <Box>
          <Typography variant="h6">Edit User</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {user?.userName} - {user?.email}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange('phoneNumber')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={handleChange('gender')}
                  label="Gender"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={handleChange('birthDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Address Information</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={handleChange('country')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleChange('state')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={formData.address1}
                onChange={handleChange('address1')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address2}
                onChange={handleChange('address2')}
              />
            </Grid>

            {/* System Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>System Information</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip
                        label={option.label}
                        color={option.color as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Locale"
                value={formData.locale}
                onChange={handleChange('locale')}
                placeholder="e.g., en-US"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Zone"
                value={formData.timeZone}
                onChange={handleChange('timeZone')}
                placeholder="e.g., America/New_York"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.notificationConsent}
                    onChange={handleChange('notificationConsent')}
                    color="primary"
                  />
                }
                label="Notification Consent"
              />
            </Grid>
          </Grid>
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
            type="submit" 
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditUserModal;
