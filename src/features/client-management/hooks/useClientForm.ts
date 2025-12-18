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
import { useState } from 'react';
import { ClientFormData } from '../../../types/client';

/**
 * Custom hook for managing client form state and handlers
 * Eliminates code duplication across CreateClientModal and EditClientModal
 */
export const useClientForm = (initialData: ClientFormData) => {
  const [formData, setFormData] = useState<ClientFormData>(initialData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const handleArrayFieldChange = (
    field: 'redirectUris' | 'postLogoutRedirectUris', 
    index: number, 
    value: string
  ) => {
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

  const resetForm = (data: ClientFormData) => {
    setFormData(data);
    setValidationErrors([]);
  };

  return {
    formData,
    setFormData,
    validationErrors,
    setValidationErrors,
    handleInputChange,
    handleArrayFieldChange,
    addArrayField,
    removeArrayField,
    resetForm
  };
};
