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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { 
  ClientFormData, 
  GRANT_TYPES, 
  AUTH_METHODS, 
  CLIENT_STATUS 
} from '../../../types/client';

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

interface ClientFormFieldsProps {
  formData: ClientFormData;
  onInputChange: (field: keyof ClientFormData, value: any) => void;
  onArrayFieldChange: (field: 'redirectUris' | 'postLogoutRedirectUris', index: number, value: string) => void;
  onAddArrayField: (field: 'redirectUris' | 'postLogoutRedirectUris') => void;
  onRemoveArrayField: (field: 'redirectUris' | 'postLogoutRedirectUris', index: number) => void;
  clientIdReadOnly?: boolean;
}

/**
 * Shared component for client form fields
 * Used by both CreateClientModal and EditClientModal
 */
export const ClientFormFields: React.FC<ClientFormFieldsProps> = ({
  formData,
  onInputChange,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
  clientIdReadOnly = false
}) => {
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
            placeholder="https://example.com/callback"
            value={uri}
            onChange={(e) => onArrayFieldChange(field, index, e.target.value)}
          />
          {formData[field].length > 1 && (
            <IconButton
              size="small"
              onClick={() => onRemoveArrayField(field, index)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => onAddArrayField(field)}
        variant="outlined"
      >
        Add {label.slice(0, -1)}
      </Button>
    </Box>
  );

  return (
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
          onChange={(e) => onInputChange('clientId', e.target.value)}
          disabled={clientIdReadOnly}
          helperText={clientIdReadOnly ? "Client ID cannot be modified" : "Unique identifier for the client"}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Client Name"
          required
          value={formData.clientName}
          onChange={(e) => onInputChange('clientName', e.target.value)}
          helperText="Human-readable name for the client"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Client Secret"
          type="password"
          value={formData.clientSecret}
          onChange={(e) => onInputChange('clientSecret', e.target.value)}
          helperText="Leave empty for public clients"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
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
            onChange={(e) => onInputChange('authorizationGrantTypes', e.target.value)}
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
            onChange={(e) => onInputChange('clientAuthenticationMethods', e.target.value)}
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
            onChange={(e) => onInputChange('scopes', e.target.value)}
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
                  onChange={(e) => onInputChange('accessTokenValidity', parseInt(e.target.value) || 0)}
                  helperText="Default: 3600 (1 hour)"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Refresh Token Validity"
                  type="number"
                  value={formData.refreshTokenValidity}
                  onChange={(e) => onInputChange('refreshTokenValidity', parseInt(e.target.value) || 0)}
                  helperText="Default: 86400 (24 hours)"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Authorization Code Validity"
                  type="number"
                  value={formData.authorizationCodeValidity}
                  onChange={(e) => onInputChange('authorizationCodeValidity', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => onInputChange('requireAuthorizationConsent', e.target.checked)}
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
                  onChange={(e) => onInputChange('additionalInformation', e.target.value)}
                  helperText="Optional JSON or text metadata"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
};
