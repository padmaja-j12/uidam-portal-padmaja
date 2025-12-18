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
import { renderHook, act } from '@testing-library/react';
import { useClientForm } from './useClientForm';
import { ClientFormData } from '../../../types/client';

describe('useClientForm', () => {
  const mockInitialData: ClientFormData = {
    clientId: 'test-client',
    clientName: 'Test Client',
    clientSecret: 'secret123',
    authorizationGrantTypes: ['authorization_code'],
    redirectUris: ['https://example.com/callback'],
    postLogoutRedirectUris: ['https://example.com/logout'],
    scopes: ['openid', 'profile'],
    clientAuthenticationMethods: ['client_secret_basic'],
    accessTokenValidity: 3600,
    refreshTokenValidity: 7200,
    authorizationCodeValidity: 300,
    requireAuthorizationConsent: true,
    status: 'approved',
    createdBy: 'admin',
  };

  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    expect(result.current.formData).toEqual(mockInitialData);
    expect(result.current.validationErrors).toEqual([]);
  });

  it('should update input field value', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    act(() => {
      result.current.handleInputChange('clientName', 'Updated Client Name');
    });

    expect(result.current.formData.clientName).toBe('Updated Client Name');
    expect(result.current.formData.clientId).toBe('test-client'); // Other fields unchanged
  });

  it('should clear validation errors when input changes', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    // Set validation errors
    act(() => {
      result.current.setValidationErrors(['Error 1', 'Error 2']);
    });

    expect(result.current.validationErrors).toHaveLength(2);

    // Change input
    act(() => {
      result.current.handleInputChange('clientName', 'New Name');
    });

    expect(result.current.validationErrors).toEqual([]);
  });

  it('should not clear validation errors if there are none', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    expect(result.current.validationErrors).toEqual([]);

    act(() => {
      result.current.handleInputChange('clientName', 'New Name');
    });

    expect(result.current.validationErrors).toEqual([]);
  });

  it('should update array field value at specific index', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    act(() => {
      result.current.handleArrayFieldChange('redirectUris', 0, 'https://newurl.com/callback');
    });

    expect(result.current.formData.redirectUris[0]).toBe('https://newurl.com/callback');
  });

  it('should add new item to array field', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    const initialLength = result.current.formData.redirectUris.length;

    act(() => {
      result.current.addArrayField('redirectUris');
    });

    expect(result.current.formData.redirectUris).toHaveLength(initialLength + 1);
    expect(result.current.formData.redirectUris[initialLength]).toBe('');
  });

  it('should remove item from array field', () => {
    const { result } = renderHook(() => useClientForm({
      ...mockInitialData,
      redirectUris: ['https://url1.com', 'https://url2.com', 'https://url3.com'],
    }));

    expect(result.current.formData.redirectUris).toHaveLength(3);

    act(() => {
      result.current.removeArrayField('redirectUris', 1);
    });

    expect(result.current.formData.redirectUris).toHaveLength(2);
    expect(result.current.formData.redirectUris).toEqual(['https://url1.com', 'https://url3.com']);
  });

  it('should handle postLogoutRedirectUris array operations', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    // Add
    act(() => {
      result.current.addArrayField('postLogoutRedirectUris');
    });

    expect(result.current.formData.postLogoutRedirectUris).toHaveLength(2);

    // Update
    act(() => {
      result.current.handleArrayFieldChange('postLogoutRedirectUris', 1, 'https://new-logout.com');
    });

    expect(result.current.formData.postLogoutRedirectUris[1]).toBe('https://new-logout.com');

    // Remove
    act(() => {
      result.current.removeArrayField('postLogoutRedirectUris', 0);
    });

    expect(result.current.formData.postLogoutRedirectUris).toHaveLength(1);
    expect(result.current.formData.postLogoutRedirectUris[0]).toBe('https://new-logout.com');
  });

  it('should reset form with new data', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    // Modify form
    act(() => {
      result.current.handleInputChange('clientName', 'Modified Name');
      result.current.setValidationErrors(['Error']);
    });

    expect(result.current.formData.clientName).toBe('Modified Name');
    expect(result.current.validationErrors).toHaveLength(1);

    // Reset
    const newData: ClientFormData = {
      ...mockInitialData,
      clientName: 'Reset Name',
    };

    act(() => {
      result.current.resetForm(newData);
    });

    expect(result.current.formData.clientName).toBe('Reset Name');
    expect(result.current.validationErrors).toEqual([]);
  });

  it('should set form data directly', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    const newData: ClientFormData = {
      ...mockInitialData,
      clientId: 'new-id',
      clientName: 'New Name',
    };

    act(() => {
      result.current.setFormData(newData);
    });

    expect(result.current.formData).toEqual(newData);
  });

  it('should set validation errors', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    const errors = ['Error 1', 'Error 2', 'Error 3'];

    act(() => {
      result.current.setValidationErrors(errors);
    });

    expect(result.current.validationErrors).toEqual(errors);
  });

  it('should update boolean field', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    expect(result.current.formData.requireAuthorizationConsent).toBe(true);

    act(() => {
      result.current.handleInputChange('requireAuthorizationConsent', false);
    });

    expect(result.current.formData.requireAuthorizationConsent).toBe(false);
  });

  it('should update numeric field', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    act(() => {
      result.current.handleInputChange('accessTokenValidity', 7200);
    });

    expect(result.current.formData.accessTokenValidity).toBe(7200);
  });

  it('should handle multiple rapid changes', () => {
    const { result } = renderHook(() => useClientForm(mockInitialData));

    act(() => {
      result.current.handleInputChange('clientName', 'Name 1');
      result.current.handleInputChange('clientName', 'Name 2');
      result.current.handleInputChange('clientName', 'Name 3');
    });

    expect(result.current.formData.clientName).toBe('Name 3');
  });
});
