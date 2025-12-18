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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientFormFields } from './ClientFormFields';
import { ClientFormData, GRANT_TYPES, AUTH_METHODS, CLIENT_STATUS } from '../../../types/client';

const mockFormData: ClientFormData = {
  clientId: 'test-client',
  clientName: 'Test Client',
  clientSecret: 'secret',
  authorizationGrantTypes: [GRANT_TYPES.AUTHORIZATION_CODE],
  redirectUris: ['https://example.com/callback'],
  postLogoutRedirectUris: ['https://example.com/logout'],
  scopes: ['openid', 'profile'],
  clientAuthenticationMethods: [AUTH_METHODS.CLIENT_SECRET_BASIC],
  accessTokenValidity: 3600,
  refreshTokenValidity: 86400,
  authorizationCodeValidity: 600,
  requireAuthorizationConsent: true,
  additionalInformation: '',
  status: CLIENT_STATUS.APPROVED,
  createdBy: 'admin',
};

// Tests for ClientFormFields component
describe('ClientFormFields', () => {
  const mockOnInputChange = jest.fn();
  const mockOnArrayFieldChange = jest.fn();
  const mockOnAddArrayField = jest.fn();
  const mockOnRemoveArrayField = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ClientFormFields
        formData={mockFormData}
        onInputChange={mockOnInputChange}
        onArrayFieldChange={mockOnArrayFieldChange}
        onAddArrayField={mockOnAddArrayField}
        onRemoveArrayField={mockOnRemoveArrayField}
        {...props}
      />
    );
  };

  describe('Basic Information Fields', () => {
    it('should render all basic information fields', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
   //   expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    it('should display form data values', () => {
      renderComponent();
      
      expect(screen.getByDisplayValue('test-client')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
    });

    it('should call onInputChange when client name changes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const clientNameInput = screen.getByLabelText(/Client Name/i);
      await user.clear(clientNameInput);
      await user.type(clientNameInput, 'New Client Name');
      
      expect(mockOnInputChange).toHaveBeenCalledWith('clientName', expect.any(String));
    });

    it('should disable client ID when clientIdReadOnly is true', () => {
      renderComponent({ clientIdReadOnly: true });
      
      const clientIdInput = screen.getByLabelText(/Client ID/i);
      expect(clientIdInput).toBeDisabled();
    });

    it('should enable client ID when clientIdReadOnly is false', () => {
      renderComponent({ clientIdReadOnly: false });
      
      const clientIdInput = screen.getByLabelText(/Client ID/i);
      expect(clientIdInput).not.toBeDisabled();
    });
  });

  describe('OAuth2 Configuration', () => {
    it('should render OAuth2 configuration fields', () => {
      renderComponent();
      
      expect(screen.getAllByText(/Authorization Grant Types/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Client Authentication Methods/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Scopes/i).length).toBeGreaterThan(0);
    });

    it('should display selected grant types as chips', () => {
      renderComponent();
      
      expect(screen.getByText(GRANT_TYPES.AUTHORIZATION_CODE)).toBeInTheDocument();
    });

    it('should display selected scopes as chips', () => {
      renderComponent();
      
      expect(screen.getByText('openid')).toBeInTheDocument();
      expect(screen.getByText('profile')).toBeInTheDocument();
    });
  });

  describe('URI Configuration', () => {
    it('should render URI accordion', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      expect(screen.getAllByText(/Redirect URIs/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Post Logout Redirect URIs/i)).toBeInTheDocument();
    });

    it('should display redirect URIs', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      expect(screen.getByDisplayValue('https://example.com/callback')).toBeInTheDocument();
    });

    it('should call onAddArrayField when adding a redirect URI', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      const addButton = screen.getByRole('button', { name: /Add Redirect URI/i });
      await user.click(addButton);
      
      expect(mockOnAddArrayField).toHaveBeenCalledWith('redirectUris');
    });

    it('should call onArrayFieldChange when URI value changes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      const uriInput = screen.getByDisplayValue('https://example.com/callback');
      await user.clear(uriInput);
      await user.type(uriInput, 'https://new.example.com');
      
      expect(mockOnArrayFieldChange).toHaveBeenCalled();
    });

    it('should show delete button for multiple URIs', async () => {
      const user = userEvent.setup();
      const formDataWithMultipleUris = {
        ...mockFormData,
        redirectUris: ['https://example.com/callback', 'https://example2.com/callback'],
      };
      
      renderComponent({ formData: formDataWithMultipleUris });
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg[data-testid="DeleteIcon"]')
      );
      
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should call onRemoveArrayField when deleting a URI', async () => {
      const user = userEvent.setup();
      const formDataWithMultipleUris = {
        ...mockFormData,
        redirectUris: ['https://example.com/callback', 'https://example2.com/callback'],
      };
      
      renderComponent({ formData: formDataWithMultipleUris });
      
      const uriAccordion = screen.getByText('URI Configuration');
      await user.click(uriAccordion);
      
      const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg[data-testid="DeleteIcon"]')
      );
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        expect(mockOnRemoveArrayField).toHaveBeenCalled();
      }
    });
  });

  describe('Token Validity Configuration', () => {
    it('should render token validity accordion', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tokenAccordion = screen.getByText(/Token Validity \(seconds\)/i);
      await user.click(tokenAccordion);
      
      expect(screen.getByLabelText(/Access Token Validity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Refresh Token Validity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Authorization Code Validity/i)).toBeInTheDocument();
    });

    it('should display token validity values', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tokenAccordion = screen.getByText(/Token Validity \(seconds\)/i);
      await user.click(tokenAccordion);
      
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
      expect(screen.getByDisplayValue('86400')).toBeInTheDocument();
      expect(screen.getByDisplayValue('600')).toBeInTheDocument();
    });

    it('should call onInputChange when token validity changes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const tokenAccordion = screen.getByText(/Token Validity \(seconds\)/i);
      await user.click(tokenAccordion);
      
      const accessTokenInput = screen.getByLabelText(/Access Token Validity/i);
      await user.clear(accessTokenInput);
      await user.type(accessTokenInput, '7200');
      
      expect(mockOnInputChange).toHaveBeenCalledWith('accessTokenValidity', expect.any(Number));
    });
  });

  describe('Advanced Settings', () => {
    it('should render advanced settings accordion', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const advancedAccordion = screen.getByText('Advanced Settings');
      await user.click(advancedAccordion);
      
      expect(screen.getByLabelText(/Require Authorization Consent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Additional Information/i)).toBeInTheDocument();
    });

    it('should toggle authorization consent switch', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const advancedAccordion = screen.getByText('Advanced Settings');
      await user.click(advancedAccordion);
      
      const consentSwitch = screen.getByRole('checkbox', { name: /Require Authorization Consent/i });
      await user.click(consentSwitch);
      
      expect(mockOnInputChange).toHaveBeenCalledWith('requireAuthorizationConsent', expect.any(Boolean));
    });

    it('should call onInputChange when additional information changes', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const advancedAccordion = screen.getByText('Advanced Settings');
      await user.click(advancedAccordion);
      
      const additionalInfoInput = screen.getByLabelText(/Additional Information/i);
      await user.type(additionalInfoInput, 'Some additional info');
      
      expect(mockOnInputChange).toHaveBeenCalledWith('additionalInformation', expect.any(String));
    });
  });
});
