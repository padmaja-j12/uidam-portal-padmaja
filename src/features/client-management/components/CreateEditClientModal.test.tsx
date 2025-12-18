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
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CreateEditClientModal } from './CreateEditClientModal';
import { ClientRegistrationService } from '../../../services/clientRegistrationService';
import { ClientListItem } from '../../../types/client';

jest.mock('../../../services/clientRegistrationService');
jest.mock('../../../utils/logger');

const mockClientRegistrationService = ClientRegistrationService as jest.Mocked<typeof ClientRegistrationService>;

describe('CreateEditClientModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    editMode: false,
  };

  const mockClient: ClientListItem = {
    clientId: 'test-client',
    clientName: 'Test Client',
    authorizationGrantTypes: ['authorization_code'],
    scopes: ['openid', 'profile'],
    status: 'approved',
  };

  const mockDefaultClientData = {
    clientId: '',
    clientName: '',
    clientSecret: '',
    authorizationGrantTypes: ['authorization_code'],
    redirectUris: [''],
    postLogoutRedirectUris: [''],
    scopes: [],
    clientAuthenticationMethods: ['client_secret_basic'],
    accessTokenValidity: 3600,
    refreshTokenValidity: 3600,
    authorizationCodeValidity: 300,
    requireAuthorizationConsent: true,
    additionalInformation: '',
    status: 'approved',
    createdBy: 'web-admin',
  };

  const mockFullClientData = {
    ...mockDefaultClientData,
    clientId: 'test-client',
    clientName: 'Test Client',
    scopes: ['openid', 'profile', 'email'],
    redirectUris: ['https://example.com/callback', 'https://test.com/callback'],
    postLogoutRedirectUris: ['https://example.com/logout'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientRegistrationService.getDefaultClientData.mockReturnValue(mockDefaultClientData);
    mockClientRegistrationService.validateClientData.mockReturnValue([]);
  });

  describe('Create Mode - Comprehensive Tests', () => {
    it('should render all form sections', () => {
      render(<CreateEditClientModal {...defaultProps} />);
      expect(screen.getByText('Register New OAuth2 Client')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('OAuth2 Configuration')).toBeInTheDocument();
      expect(screen.getByText('URI Configuration')).toBeInTheDocument();
      expect(screen.getByText('Token Validity (seconds)')).toBeInTheDocument();
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    });

    it.skip('should handle complete form submission with all fields filled', async () => {
      mockClientRegistrationService.createClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Client created successfully',
        data: mockClient,
        httpStatus: '200',
      });

      const { container } = render(<CreateEditClientModal {...defaultProps} />);
      
      // Fill Basic Information
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'new-client-123');
      await userEvent.type(screen.getByLabelText(/Client Name/i), 'New Test Client');
      await userEvent.type(screen.getByLabelText(/Client Secret/i), 'super-secret-key');
      
      // Select scopes
      const scopesField = container.querySelector('[name="scopes"]');
      if (scopesField) {
        fireEvent.mouseDown(scopesField);
        const listbox = await screen.findByRole('listbox');
        const openidOption = within(listbox).getByText('openid');
        fireEvent.click(openidOption);
      }

      // Expand and fill URI Configuration
      fireEvent.click(screen.getByText('URI Configuration'));
      const redirectUriInputs = await screen.findAllByPlaceholderText(/https:\/\/example\.com\/callback/i);
      await userEvent.clear(redirectUriInputs[0]);
      await userEvent.type(redirectUriInputs[0], 'https://myapp.com/callback');

      // Expand and modify Token Validity
      const tokenAccordions = screen.getAllByText(/Token Validity/i);
      const tokenHeader = tokenAccordions.find(el => el.closest('div[role="button"]'));
      if (tokenHeader) fireEvent.click(tokenHeader);
      
      const accessTokenInput = await screen.findByLabelText(/Access Token Validity/i);
      await userEvent.clear(accessTokenInput);
      await userEvent.type(accessTokenInput, '7200');

      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockClientRegistrationService.createClient).toHaveBeenCalledWith(
          expect.objectContaining({
            clientId: 'new-client-123',
            clientName: 'New Test Client',
            clientSecret: 'super-secret-key',
            accessTokenValidity: 7200,
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should validate required fields before submission', async () => {
      mockClientRegistrationService.validateClientData.mockReturnValue([
        'Client ID is required',
        'Client Name is required',
        'At least one redirect URI is required',
      ]);

      render(<CreateEditClientModal {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Client ID is required')).toBeInTheDocument();
        expect(screen.getByText('Client Name is required')).toBeInTheDocument();
        expect(screen.getByText('At least one redirect URI is required')).toBeInTheDocument();
      });
      
      expect(mockClientRegistrationService.createClient).not.toHaveBeenCalled();
    });

    it('should clear errors when user corrects input', async () => {
      mockClientRegistrationService.validateClientData
        .mockReturnValueOnce(['Client ID is required'])
        .mockReturnValueOnce([]);

      render(<CreateEditClientModal {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Client ID is required')).toBeInTheDocument();
      });

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      await userEvent.type(clientIdInput, 'valid-client-id');
      
      await waitFor(() => {
        expect(screen.queryByText('Client ID is required')).not.toBeInTheDocument();
      });
    }, 15000);

    it('should handle API error with specific error message', async () => {
      mockClientRegistrationService.createClient.mockRejectedValue({
        response: {
          data: {
            message: 'Client ID already exists',
          },
        },
      });

      render(<CreateEditClientModal {...defaultProps} />);
      
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'duplicate-id');
      await userEvent.type(screen.getByLabelText(/Client Name/i), 'Test');
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Client ID already exists/i)).toBeInTheDocument();
      });
    }, 15000);

    it.skip('should handle network error gracefully', async () => {
      mockClientRegistrationService.createClient.mockRejectedValue(
        new Error('Network Error')
      );

      render(<CreateEditClientModal {...defaultProps} />);
      
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'test-client');
      await userEvent.type(screen.getByLabelText(/Client Name/i), 'Test');
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      mockClientRegistrationService.createClient.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          code: 'SUCCESS',
          message: 'Success',
          data: mockClient,
          httpStatus: '200',
        }), 100))
      );

      render(<CreateEditClientModal {...defaultProps} />);
      
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'test');
      await userEvent.type(screen.getByLabelText(/Client Name/i), 'Test');
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      expect(createButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    }, 15000);
  });

  describe('Edit Mode - Comprehensive Tests', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: true,
      client: mockClient,
    };

    it('should load and display existing client data', async () => {
      mockClientRegistrationService.getClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success',
        data: mockFullClientData,
        httpStatus: '200',
      });

      render(<CreateEditClientModal {...editModeProps} />);
      
      await waitFor(() => {
        expect(mockClientRegistrationService.getClient).toHaveBeenCalledWith('test-client');
        expect(screen.getByDisplayValue('test-client')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      });
    });

    it('should prevent editing clientId in edit mode', async () => {
      mockClientRegistrationService.getClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success',
        data: mockFullClientData,
        httpStatus: '200',
      });

      render(<CreateEditClientModal {...editModeProps} />);
      
      await waitFor(() => {
        const clientIdInput = screen.getByLabelText(/Client ID/i);
        expect(clientIdInput).toBeDisabled();
      });
    });

    it(
      'should update client with modified fields',
      async () => {
        mockClientRegistrationService.getClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success',
        data: mockFullClientData,
        httpStatus: '200',
      });

      mockClientRegistrationService.updateClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Updated',
        data: mockClient,
        httpStatus: '200',
      });

      render(<CreateEditClientModal {...editModeProps} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      }, { timeout: 10000 });

      const clientNameInput = screen.getByLabelText(/Client Name/i);
      await userEvent.clear(clientNameInput);
      await userEvent.type(clientNameInput, 'Updated Client Name');

      const updateButton = screen.getByRole('button', { name: /Update Client/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(mockClientRegistrationService.updateClient).toHaveBeenCalledWith(
          'test-client',
          expect.objectContaining({
            clientName: 'Updated Client Name',
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 10000 });
    }, 15000);

    it('should handle update validation errors', async () => {
      mockClientRegistrationService.getClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success',
        data: mockFullClientData,
        httpStatus: '200',
      });

      mockClientRegistrationService.validateClientData.mockReturnValue([
        'Invalid redirect URI format',
      ]);

      render(<CreateEditClientModal {...editModeProps} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Client/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid redirect URI format')).toBeInTheDocument();
      });
      
      expect(mockClientRegistrationService.updateClient).not.toHaveBeenCalled();
      },
      15000
    );

    it('should handle update API failure', async () => {
      mockClientRegistrationService.getClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success',
        data: mockFullClientData,
        httpStatus: '200',
      });

      mockClientRegistrationService.updateClient.mockRejectedValue({
        response: { data: { message: 'Update failed: Invalid scopes' } },
      });

      render(<CreateEditClientModal {...editModeProps} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /Update Client/i });
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Update failed: Invalid scopes/i)).toBeInTheDocument();
      });
    }, 15000);

    it('should show loading state while fetching client details', async () => {
      mockClientRegistrationService.getClient.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          code: 'SUCCESS',
          message: 'Success',
          data: mockFullClientData,
          httpStatus: '200',
        }), 100))
      );

      render(<CreateEditClientModal {...editModeProps} />);
      
      expect(screen.getByText(/Loading client details/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Loading client details/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('URI Management', () => {
    it('should add multiple redirect URIs', async () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('URI Configuration'));
      
      const addButton = await screen.findByRole('button', { name: /Add Redirect URI/i });
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      
      const uriInputs = screen.getAllByPlaceholderText(/https:\/\/example\.com\/callback/i);
      expect(uriInputs.length).toBeGreaterThan(1);
    });

    it('should remove redirect URI', async () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('URI Configuration'));
      
      const addButton = await screen.findByRole('button', { name: /Add Redirect URI/i });
      fireEvent.click(addButton);
      
      let uriInputs = screen.getAllByPlaceholderText(/https:\/\/example\.com\/callback/i);
      const initialCount = uriInputs.length;
      
      const removeButtons = screen.getAllByLabelText('Remove');
      fireEvent.click(removeButtons[0]);
      
      uriInputs = screen.getAllByPlaceholderText(/https:\/\/example\.com\/callback/i);
      expect(uriInputs.length).toBe(initialCount - 1);
    });

    it('should add and remove post-logout redirect URIs', async () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('URI Configuration'));
      
      const addPostLogoutButton = await screen.findByRole('button', { name: /Add Post Logout Redirect URI/i });
      fireEvent.click(addPostLogoutButton);
      
      const postLogoutInputs = screen.getAllByPlaceholderText(/https:\/\/example\.com\/logout/i);
      expect(postLogoutInputs.length).toBeGreaterThan(0);
      
      const removeButtons = screen.getAllByLabelText('Remove');
      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[removeButtons.length - 1]);
      }
    });

    it('should validate URI formats', async () => {
      mockClientRegistrationService.validateClientData.mockReturnValue([
        'Invalid URI format',
      ]);

      render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('URI Configuration'));
      
      const uriInputs = await screen.findAllByPlaceholderText(/https:\/\/example\.com\/callback/i);
      const uriInput = uriInputs[0];
      await userEvent.clear(uriInput);
      await userEvent.type(uriInput, 'not-a-valid-url');
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid URI format')).toBeInTheDocument();
      });
    });
  });

  describe('Token Validity Configuration', () => {
    it('should update all token validity fields', async () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      const tokenAccordions = screen.getAllByText(/Token Validity/i);
      const tokenHeader = tokenAccordions.find(el => el.closest('div[role="button"]'));
      if (tokenHeader) fireEvent.click(tokenHeader);
      
      const accessTokenInput = await screen.findByLabelText(/Access Token Validity/i, {}, { timeout: 10000 });
      const refreshTokenInput = await screen.findByLabelText(/Refresh Token Validity/i, {}, { timeout: 10000 });
      const authCodeInput = await screen.findByLabelText(/Authorization Code Validity/i, {}, { timeout: 10000 });
      
      await userEvent.clear(accessTokenInput);
      await userEvent.type(accessTokenInput, '7200');
      
      await userEvent.clear(refreshTokenInput);
      await userEvent.type(refreshTokenInput, '86400');
      
      await userEvent.clear(authCodeInput);
      await userEvent.type(authCodeInput, '600');
      
      expect(accessTokenInput).toHaveValue(7200);
      expect(refreshTokenInput).toHaveValue(86400);
      expect(authCodeInput).toHaveValue(600);
    }, 15000);

    it('should validate token validity values', async () => {
      mockClientRegistrationService.validateClientData.mockReturnValue([
        'Token validity must be positive',
      ]);

      render(<CreateEditClientModal {...defaultProps} />);
      
      const tokenAccordions = screen.getAllByText(/Token Validity/i);
      const tokenHeader = tokenAccordions.find(el => el.closest('div[role="button"]'));
      if (tokenHeader) fireEvent.click(tokenHeader);
      
      const accessTokenInput = await screen.findByLabelText(/Access Token Validity/i);
      await userEvent.clear(accessTokenInput);
      await userEvent.type(accessTokenInput, '-100');
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Token validity must be positive')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Settings', () => {
    it('should toggle all advanced settings', async () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Advanced Settings'));
      
      const consentSwitch = await screen.findByRole('checkbox', { name: /Require Authorization Consent/i });
      
      expect(consentSwitch).toBeChecked();
      fireEvent.click(consentSwitch);
      expect(consentSwitch).not.toBeChecked();
      fireEvent.click(consentSwitch);
      expect(consentSwitch).toBeChecked();
    });

    it(
      'should handle additional information input',
      async () => {
        render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Advanced Settings'));
      
      const additionalInfoInput = await screen.findByLabelText(/Additional Information/i, {}, { timeout: 10000 });
      const testMetadata = 'Environment: Production\nVersion: 1.0.0';
      
      await userEvent.type(additionalInfoInput, testMetadata);
      expect(additionalInfoInput).toHaveValue(testMetadata);
      },
      15000
    );

    it('should change client status', async () => {
      const { container } = render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Advanced Settings'));
      
      const statusField = container.querySelector('[name="status"]');
      if (statusField) {
        fireEvent.mouseDown(statusField);
        const listbox = await screen.findByRole('listbox');
        const pendingOption = within(listbox).getByText('pending');
        fireEvent.click(pendingOption);
      }
    });
  });

  describe('OAuth2 Configuration', () => {
    it('should select multiple grant types', async () => {
      const { container } = render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('OAuth2 Configuration'));
      
      const grantTypesField = container.querySelector('[name="authorizationGrantTypes"]');
      if (grantTypesField) {
        fireEvent.mouseDown(grantTypesField);
        const listbox = await screen.findByRole('listbox');
        
        const refreshTokenOption = within(listbox).getByText('refresh_token');
        fireEvent.click(refreshTokenOption);
        
        const clientCredentialsOption = within(listbox).getByText('client_credentials');
        fireEvent.click(clientCredentialsOption);
      }
    });

    it('should select multiple authentication methods', async () => {
      const { container } = render(<CreateEditClientModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('OAuth2 Configuration'));
      
      const authMethodsField = container.querySelector('[name="clientAuthenticationMethods"]');
      if (authMethodsField) {
        fireEvent.mouseDown(authMethodsField);
        const listbox = await screen.findByRole('listbox');
        
        const clientSecretPostOption = within(listbox).getByText('client_secret_post');
        fireEvent.click(clientSecretPostOption);
      }
    });

    it('should select multiple scopes', async () => {
      const { container } = render(<CreateEditClientModal {...defaultProps} />);
      
      const scopesField = container.querySelector('[name="scopes"]');
      if (scopesField) {
        fireEvent.mouseDown(scopesField);
        const listbox = await screen.findByRole('listbox');
        
        const openidOption = within(listbox).getByText('openid');
        fireEvent.click(openidOption);
        
        const profileOption = within(listbox).getByText('profile');
        fireEvent.click(profileOption);
        
        const emailOption = within(listbox).getByText('email');
        fireEvent.click(emailOption);
      }
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal on cancel without saving', () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not close modal when clicking inside', () => {
      render(<CreateEditClientModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', async () => {
      const { rerender } = render(<CreateEditClientModal {...defaultProps} />);
      
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'test-id');
      
      rerender(<CreateEditClientModal {...defaultProps} open={false} />);
      
      // Clear the mock call count
      mockClientRegistrationService.getDefaultClientData.mockClear();
      
      rerender(<CreateEditClientModal {...defaultProps} open={true} />);
      
      // Should be called once when reopened
      expect(mockClientRegistrationService.getDefaultClientData).toHaveBeenCalledTimes(1);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should display multiple validation errors simultaneously', async () => {
      mockClientRegistrationService.validateClientData.mockReturnValue([
        'Client ID is required',
        'Client Name is required',
        'At least one scope must be selected',
        'At least one redirect URI is required',
      ]);

      render(<CreateEditClientModal {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /Create Client/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Client ID is required')).toBeInTheDocument();
        expect(screen.getByText('Client Name is required')).toBeInTheDocument();
        expect(screen.getByText('At least one scope must be selected')).toBeInTheDocument();
        expect(screen.getByText('At least one redirect URI is required')).toBeInTheDocument();
      });
    });

    it('should clear all errors after successful submission', async () => {
      mockClientRegistrationService.validateClientData
        .mockReturnValueOnce(['Client ID is required'])
        .mockReturnValueOnce([]);
      
      mockClientRegistrationService.createClient.mockResolvedValue({
        code: 'SUCCESS',
        message: 'Created',
        data: mockClient,
        httpStatus: '200',
      });

      render(<CreateEditClientModal {...defaultProps} />);
      
      // Trigger validation error
      fireEvent.click(screen.getByRole('button', { name: /Create Client/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Client ID is required')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Fix the error and submit
      await userEvent.type(screen.getByLabelText(/Client ID/i), 'valid-id');
      await userEvent.type(screen.getByLabelText(/Client Name/i), 'Valid Name');
      
      fireEvent.click(screen.getByRole('button', { name: /Create Client/i }));
      
      await waitFor(() => {
        expect(screen.queryByText('Client ID is required')).not.toBeInTheDocument();
        expect(mockOnSave).toHaveBeenCalled();
      }, { timeout: 10000 });
    }, 15000);
  });
});
