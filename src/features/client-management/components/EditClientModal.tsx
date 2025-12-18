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
  CircularProgress,
  Box,
} from '@mui/material';
import { ClientRegistrationService } from '../../../services/clientRegistrationService';
import { ClientListItem } from '../../../types/client';
import { ClientFormFields } from './ClientFormFields';
import { ClientModalWrapper } from './ClientModalWrapper';
import { useClientForm } from '../hooks/useClientForm';

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  client: ClientListItem | null;
  onSuccess?: (message: string) => void;
}

/**
 * Modal for editing an existing OAuth2 client
 * Separated from CreateClientModal following Single Responsibility Principle
 */
export const EditClientModal: React.FC<EditClientModalProps> = ({
  open,
  onClose,
  onSave,
  client,
  onSuccess
}) => {
  const {
    formData,
    validationErrors,
    setValidationErrors,
    handleInputChange,
    handleArrayFieldChange,
    addArrayField,
    removeArrayField,
    resetForm
  } = useClientForm(ClientRegistrationService.getDefaultClientData());
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && client) {
      loadClientDetails(client.clientId);
    }
  }, [open, client]);

  const loadClientDetails = async (clientId: string) => {
    try {
      setInitialLoading(true);
      setError(null);
      const response = await ClientRegistrationService.getClient(clientId);
      
      if (response?.data) {
        const clientData = response.data;
        resetForm({
          clientId: clientData.clientId || '',
          clientName: clientData.clientName || '',
          clientSecret: clientData.clientSecret || '',
          authorizationGrantTypes: clientData.authorizationGrantTypes || ['authorization_code'],
          redirectUris: clientData.redirectUris || [''],
          postLogoutRedirectUris: clientData.postLogoutRedirectUris || [''],
          scopes: Array.isArray(clientData.scopes) ? clientData.scopes : Array.from(clientData.scopes || []),
          clientAuthenticationMethods: clientData.clientAuthenticationMethods || ['client_secret_basic'],
          accessTokenValidity: clientData.accessTokenValidity || 3600,
          refreshTokenValidity: clientData.refreshTokenValidity || 3600,
          authorizationCodeValidity: clientData.authorizationCodeValidity || 300,
          requireAuthorizationConsent: clientData.requireAuthorizationConsent ?? true,
          additionalInformation: clientData.additionalInformation || '',
          status: clientData.status || 'approved',
          createdBy: clientData.createdBy || 'web-admin'
        });
      }
    } catch (err: any) {
      console.error('Failed to load client details:', err);
      setError('Failed to load client details');
    } finally {
      setInitialLoading(false);
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
      
      if (onSuccess) {
        onSuccess('Client updated successfully');
      }
      
      onSave();
    } catch (err: any) {
      console.error('Failed to update client:', err);
      setError(`Failed to update client: ${err.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setValidationErrors([]);
    onClose();
  };

  return (
    <ClientModalWrapper
      open={open}
      onClose={handleClose}
      title={`Edit Client: ${client?.clientName ?? ''}`}
      error={error}
      validationErrors={validationErrors}
      loading={loading || initialLoading}
      primaryButtonLabel={loading ? 'Updating...' : 'Update Client'}
      onPrimaryAction={handleUpdate}
    >
      {initialLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <ClientFormFields
          formData={formData}
          onInputChange={handleInputChange}
          onArrayFieldChange={handleArrayFieldChange}
          onAddArrayField={addArrayField}
          onRemoveArrayField={removeArrayField}
          clientIdReadOnly={true}
        />
      )}
    </ClientModalWrapper>
  );
};
