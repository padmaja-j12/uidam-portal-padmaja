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
import { ClientRegistrationService } from '../../../services/clientRegistrationService';
import { ClientFormFields } from './ClientFormFields';
import { ClientModalWrapper } from './ClientModalWrapper';
import { useClientForm } from '../hooks/useClientForm';
import { logger } from '../../../utils/logger';

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSuccess?: (message: string) => void;
}

/**
 * Modal for creating a new OAuth2 client
 * Separated from EditClientModal following Single Responsibility Principle
 */
export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  open,
  onClose,
  onSave,
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
  const [error, setError] = useState<string | null>(null);

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
      
      if (onSuccess) {
        onSuccess('Client created successfully');
      }
      
      onSave();
      
      // Reset form for next use
      resetForm(ClientRegistrationService.getDefaultClientData());
    } catch (err: any) {
      logger.error('Failed to create client:', err);
      setError(`Failed to create client: ${err.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    resetForm(ClientRegistrationService.getDefaultClientData());
    setError(null);
    onClose();
  };

  return (
    <ClientModalWrapper
      open={open}
      onClose={handleClose}
      title="Register New OAuth2 Client"
      error={error}
      validationErrors={validationErrors}
      loading={loading}
      primaryButtonLabel={loading ? 'Creating...' : 'Create Client'}
      onPrimaryAction={handleCreate}
    >
      <ClientFormFields
        formData={formData}
        onInputChange={handleInputChange}
        onArrayFieldChange={handleArrayFieldChange}
        onAddArrayField={addArrayField}
        onRemoveArrayField={removeArrayField}
        clientIdReadOnly={false}
      />
    </ClientModalWrapper>
  );
};
