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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ClientRegistrationService } from '../../../services/clientRegistrationService';
import { 
  ClientFormData, 
  ClientListItem, 
  GRANT_TYPES, 
  AUTH_METHODS, 
  CLIENT_STATUS 
} from '../../../types/client';
import { logger } from '../../../utils/logger';

interface CreateEditClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  client?: ClientListItem | null;
  editMode: boolean;
}

const COMMON_SCOPES = [
  'openid',
  'profile',
  'email',
  'address',
  'phone',
  'offline_access',
  'read',
  'write',
  'admin'
];

export const CreateEditClientModal: React.FC<CreateEditClientModalProps> = ({
  open,
  onClose,
  onSave,
  client,
  editMode
}) => {
  const [formData, setFormData] = useState<ClientFormData>(
    ClientRegistrationService.getDefaultClientData()
  );
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editMode && client) {
      // Load client details and populate form
      loadClientDetails(client.clientId);
    }
  }, [editMode, client]);

  useEffect(() => {
    if (!editMode) {
      // Reset to default for new client
      setFormData(ClientRegistrationService.getDefaultClientData());
    }
  }, [editMode]);

  const loadClientDetails = async (clientId: string) => {
    try {
      setLoadingData(true);
      const response = await ClientRegistrationService.getClient(clientId);
      // Extract client data from BaseResponse
      if (response?.data) {
        const clientData = response.data;
        setFormData({
          clientId: clientData.clientId ?? '',
          clientName: clientData.clientName ?? '',
          clientSecret: clientData.clientSecret ?? '',
          authorizationGrantTypes: clientData.authorizationGrantTypes ?? ['authorization_code'],
          redirectUris: clientData.redirectUris ?? [''],
          postLogoutRedirectUris: clientData.postLogoutRedirectUris ?? [''],
          scopes: Array.isArray(clientData.scopes) ? clientData.scopes : Array.from(clientData.scopes ?? []),
          clientAuthenticationMethods: clientData.clientAuthenticationMethods ?? ['client_secret_basic'],
          accessTokenValidity: clientData.accessTokenValidity ?? 3600,
          refreshTokenValidity: clientData.refreshTokenValidity ?? 3600,
          authorizationCodeValidity: clientData.authorizationCodeValidity ?? 300,
          requireAuthorizationConsent: clientData.requireAuthorizationConsent ?? true,
          additionalInformation: clientData.additionalInformation ?? '',
          status: clientData.status ?? 'approved',
          createdBy: clientData.createdBy ?? 'web-admin'
        });
      }
    } catch (err: any) {
      logger.error('Failed to load client details:', err);
      setError('Failed to load client details');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleArrayFieldChange = (field: 'redirectUris' | 'postLogoutRedirectUris', index: number, value: string) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    handleInputChange(field, updatedArray);
  };

  const addArrayField = (field: 'redirectUris' | 'postLogoutRedirectUris') => {
    const updatedArray = [...formData[field], ''];
    handleInputChange(field, updatedArray);
  };

  const removeArrayField = (field: 'redirectUris' | 'postLogoutRedirectUris', index: number) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    handleInputChange(field, updatedArray);
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      const errors = ClientRegistrationService.validateClientData(formData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Create new client
      await ClientRegistrationService.createClient(formData);
      onSave();
      onClose();
    } catch (err: any) {
      logger.error('Failed to create client:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      const errors = ClientRegistrationService.validateClientData(formData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Update existing client
      await ClientRegistrationService.updateClient(client.clientId, formData);
      onSave();
      onClose();
    } catch (err: any) {
      logger.error('Failed to update client:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = editMode ? handleUpdate : handleCreate;

  const renderUriArrayField = (
    field: 'redirectUris' | 'postLogoutRedirectUris',
    label: string,
    required: boolean = false
  ) => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      {formData[field].map((uri, index) => (
        <Box key={`${field}-${index}-${uri}`} display="flex" alignItems="center" gap={1} mb={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={field === 'redirectUris' ? 'https://example.com/callback' : 'https://example.com/logout'}
            value={uri}
            onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
          />
          {formData[field].length > 1 && (
            <IconButton
              size="small"
              onClick={() => removeArrayField(field, index)}
              color="error"
              aria-label="Remove"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => addArrayField(field)}
        variant="outlined"
      >
        Add {field === 'redirectUris' ? 'Redirect URI' : 'Post Logout Redirect URI'}
      </Button>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? `Edit Client: ${client?.clientName}` : 'Register New OAuth2 Client'}
      </DialogTitle>
      
      <DialogContent dividers>
        {loadingData && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography>Loading client details...</Typography>
          </Box>
        )}
        
        {!loadingData && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
        
        {validationErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Please fix the following errors:</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={`error-${index}-${error.substring(0, 20)}`}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Client ID"
              required
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              disabled={editMode} // Client ID cannot be changed in edit mode
              helperText={editMode ? "Client ID cannot be modified" : "Unique identifier for the client"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Client Name"
              required
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              helperText="Human-readable name for the client"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Client Secret"
              type="password"
              value={formData.clientSecret}
              onChange={(e) => handleInputChange('clientSecret', e.target.value)}
              helperText="Leave empty for public clients"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                {Object.values(CLIENT_STATUS).map(status => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* OAuth2 Configuration */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              OAuth2 Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Authorization Grant Types</InputLabel>
              <Select
                multiple
                value={formData.authorizationGrantTypes}
                onChange={(e) => handleInputChange('authorizationGrantTypes', e.target.value)}
                input={<OutlinedInput label="Authorization Grant Types" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.values(GRANT_TYPES).map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Client Authentication Methods</InputLabel>
              <Select
                multiple
                value={formData.clientAuthenticationMethods}
                onChange={(e) => handleInputChange('clientAuthenticationMethods', e.target.value)}
                input={<OutlinedInput label="Client Authentication Methods" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.values(AUTH_METHODS).map(method => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Scopes</InputLabel>
              <Select
                multiple
                value={formData.scopes}
                onChange={(e) => handleInputChange('scopes', e.target.value)}
                input={<OutlinedInput label="Scopes" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {COMMON_SCOPES.map(scope => (
                  <MenuItem key={scope} value={scope}>
                    {scope}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* URI Configuration */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">URI Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    {renderUriArrayField('redirectUris', 'Redirect URIs', true)}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {renderUriArrayField('postLogoutRedirectUris', 'Post Logout Redirect URIs')}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Token Validity Configuration */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Token Validity (seconds)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Access Token Validity"
                      type="number"
                      value={formData.accessTokenValidity}
                      onChange={(e) => handleInputChange('accessTokenValidity', parseInt(e.target.value) || 0)}
                      helperText="Default: 3600 (1 hour)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Refresh Token Validity"
                      type="number"
                      value={formData.refreshTokenValidity}
                      onChange={(e) => handleInputChange('refreshTokenValidity', parseInt(e.target.value) || 0)}
                      helperText="Default: 86400 (24 hours)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Authorization Code Validity"
                      type="number"
                      value={formData.authorizationCodeValidity}
                      onChange={(e) => handleInputChange('authorizationCodeValidity', parseInt(e.target.value) || 0)}
                      helperText="Default: 600 (10 minutes)"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Advanced Settings */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Advanced Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.requireAuthorizationConsent}
                          onChange={(e) => handleInputChange('requireAuthorizationConsent', e.target.checked)}
                        />
                      }
                      label="Require Authorization Consent"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Information"
                      multiline
                      rows={3}
                      value={formData.additionalInformation}
                      onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                      helperText="Optional JSON or text metadata"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading && 'Saving...'}
          {!loading && editMode && 'Update Client'}
          {!loading && !editMode && 'Create Client'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
