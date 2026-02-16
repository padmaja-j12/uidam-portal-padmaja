/**
 * Copyright (c) 2024 Contributors to the Eclipse Foundation
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Public as PublicIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { UserService, User, UserAccount } from '@services/userService';
import { JsonPatchOperation } from '@/utils/jsonPatchUtils';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await UserService.getSelfUser();
        console.log('Profile - getSelfUser response:', response);
        
        // Check if response has data field (wrapped) or is the user object directly
        if (response.data) {
          console.log('Profile - Setting user from response.data');
          setUser(response.data);
        } else if ('id' in response && typeof response.id === 'number') {
          // Response is the user object directly
          console.log('Profile - Setting user from response directly (has id)');
          setUser(response as unknown as User);
        } else if ('userName' in response) {
          // Response has userName but might not have id yet
          console.log('Profile - Setting user from response directly (has userName)');
          setUser(response as unknown as User);
        } else {
          console.error('Profile - Unexpected response structure:', response);
          setError(response.message || 'Failed to load profile');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading your profile';
        setError(errorMessage);
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'BLOCKED':
        return 'error';
      case 'REJECTED':
        return 'error';
      case 'DELETED':
        return 'default';
      case 'DEACTIVATED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleEditClick = () => {
    setEditedUser({ ...user });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedUser({});
  };

  const handleFieldChange = (field: keyof User, value: string | boolean | undefined) => {
    setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user || !editedUser) return;

    try {
      setSaving(true);
      setError(null);

      // Build JSON Patch operations for changed fields
      const patches: JsonPatchOperation[] = [];
      const editableFields: (keyof User)[] = [
        'firstName', 'lastName', 'email', 'phoneNumber',
        'country', 'state', 'city', 'address1', 'address2',
        'postalCode', 'gender', 'birthDate', 'locale',
        'notificationConsent'
      ];

      editableFields.forEach(field => {
        if (editedUser[field] !== undefined && editedUser[field] !== user[field]) {
          patches.push({
            op: 'replace' as const,
            path: `/${field}`,
            value: editedUser[field]
          });
        }
      });

      if (patches.length === 0) {
        setError('No changes detected');
        return;
      }

      console.log('Sending patches:', patches);
      const response = await UserService.updateSelfUser(patches);

      if ('id' in response && typeof response.id === 'number') {
        // Response is the user object directly
        setUser(response as unknown as User);
        setSuccessMessage('Profile updated successfully!');
        setEditMode(false);
        setEditedUser({});
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (response.data) {
        setUser(response.data);
        setSuccessMessage('Profile updated successfully!');
        setEditMode(false);
        setEditedUser({});
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="info">No profile data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        My Profile
      </Typography>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && !editMode && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header Card with Avatar */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '2.5rem',
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
              }}
            >
              {user.firstName?.[0] ?? user.userName?.[0] ?? 'U'}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                {user.firstName || ''} {user.lastName || ''}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                @{user.userName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5 }}>
                {user.firstName || 'First Name'} {user.lastName || 'Last Name'}
              </Typography>
              <Box mt={1}>
                <Chip
                  label={user.status}
                  color={getStatusColor(user.status)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>
            <Tooltip title="Edit Profile">
              <IconButton sx={{ color: 'white' }} onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Personal Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem>
                  <ListItemText
                    primary="User ID"
                    secondary={user.id || 'N/A'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Username"
                    secondary={user.userName || 'N/A'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="First Name"
                    secondary={user.firstName || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Name"
                    secondary={user.lastName || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Gender"
                    secondary={user.gender || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Birth Date"
                    secondary={formatDate(user.birthDate)}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="primary" />
                Contact Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Number"
                    secondary={user.phoneNumber || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PublicIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Locale"
                    secondary={user.locale || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notification Consent"
                    secondary={user.notificationConsent ? 'Enabled' : 'Disabled'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Address
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Address Line 1"
                    secondary={user.address1 || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Address Line 2"
                    secondary={user.address2 || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="City"
                    secondary={user.city || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="State"
                    secondary={user.state || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Country"
                    secondary={user.country || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Postal Code"
                    secondary={user.postalCode || 'Not specified'}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Roles and Permissions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                Roles
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Assigned Roles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string, index: number) => (
                    <Chip key={index} label={role} color="primary" variant="outlined" size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No roles assigned
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Accounts */}
        {user.accounts && user.accounts.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Associated Accounts
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {user.accounts.map((account: UserAccount, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary">
                          {account.account}
                        </Typography>
                        <Box mt={1}>
                          {account.roles && account.roles.map((role: string, roleIndex: number) => (
                            <Chip
                              key={roleIndex}
                              label={role}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editMode} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            Edit Profile
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            {/* Username (Read-only) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={editedUser.userName || ''}
                disabled
                helperText="Username cannot be changed"
              />
            </Grid>

            {/* Display Name (Read-only) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={`${editedUser.firstName || ''} ${editedUser.lastName || ''}`.trim() || 'Not set'}
                disabled
                helperText="Automatically generated from First Name + Last Name"
              />
            </Grid>

            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editedUser.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editedUser.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={editedUser.gender || ''}
                  label="Gender"
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birth Date"
                type="date"
                value={editedUser.birthDate || ''}
                onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editedUser.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editedUser.phoneNumber || ''}
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Locale"
                value={editedUser.locale || ''}
                onChange={(e) => handleFieldChange('locale', e.target.value)}
                placeholder="e.g., en-US"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editedUser.notificationConsent || false}
                    onChange={(e) => handleFieldChange('notificationConsent', e.target.checked)}
                  />
                }
                label="Notification Consent"
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={editedUser.address1 || ''}
                onChange={(e) => handleFieldChange('address1', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={editedUser.address2 || ''}
                onChange={(e) => handleFieldChange('address2', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={editedUser.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={editedUser.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={editedUser.country || ''}
                onChange={(e) => handleFieldChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={editedUser.postalCode || ''}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
