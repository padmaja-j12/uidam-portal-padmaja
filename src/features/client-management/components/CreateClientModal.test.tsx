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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateClientModal } from './CreateClientModal';
import { ClientRegistrationService } from '../../../services/clientRegistrationService';

jest.mock('../../../services/clientRegistrationService');
jest.mock('../../../utils/logger');

jest.mock('./ClientFormFields', () => ({
  ClientFormFields: () => <div data-testid="client-form-fields">Form Fields</div>,
}));

jest.mock('./ClientModalWrapper', () => ({
  ClientModalWrapper: ({ children, open, onClose, onPrimaryAction, error, validationErrors }: { children: React.ReactNode; open: boolean; onClose: () => void; onPrimaryAction: () => void; error?: string; validationErrors?: string[] }) =>
    open ? (
      <div data-testid="client-modal-wrapper">
        {error && <div data-testid="error">{error}</div>}
        {validationErrors && validationErrors.length > 0 && (
          <div data-testid="validation-errors">{validationErrors.join(', ')}</div>
        )}
        {children}
        <button onClick={onPrimaryAction}>Create Client</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

describe('CreateClientModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockCreateClient = jest.fn();
  const mockValidateClientData = jest.fn();
  const mockGetDefaultClientData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ClientRegistrationService.createClient as jest.Mock) = mockCreateClient;
    (ClientRegistrationService.validateClientData as jest.Mock) = mockValidateClientData;
    (ClientRegistrationService.getDefaultClientData as jest.Mock) = mockGetDefaultClientData;
    
    mockGetDefaultClientData.mockReturnValue({
      clientId: '',
      clientName: '',
      clientSecret: '',
      authorizationGrantTypes: ['authorization_code'],
      redirectUris: [''],
      postLogoutRedirectUris: [''],
      scopes: [],
      clientAuthenticationMethods: ['client_secret_basic'],
      accessTokenValidity: 3600,
      refreshTokenValidity: 86400,
      authorizationCodeValidity: 600,
      requireAuthorizationConsent: true,
      additionalInformation: '',
      status: 'approved',
      createdBy: 'web-admin',
    });
  });

  it('should render modal when open', () => {
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByTestId('client-modal-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('client-form-fields')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(
      <CreateClientModal
        open={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    expect(screen.queryByTestId('client-modal-wrapper')).not.toBeInTheDocument();
  });

  it('should create client successfully', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockCreateClient.mockResolvedValue({});
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onSuccess={mockOnSuccess}
      />
    );
    
    const createButton = screen.getByRole('button', { name: /Create Client/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith('Client created successfully');
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    const validationErrors = ['Client ID is required', 'Client Name is required'];
    mockValidateClientData.mockReturnValue(validationErrors);
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const createButton = screen.getByRole('button', { name: /Create Client/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  it('should handle creation error', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockCreateClient.mockRejectedValue(new Error('Creation failed'));
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const createButton = screen.getByRole('button', { name: /Create Client/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to create client/i)).toBeInTheDocument();
    });
  });

  it('should reset form when closing', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should work without onSuccess callback', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockCreateClient.mockResolvedValue({});
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const createButton = screen.getByRole('button', { name: /Create Client/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('should handle error without message property', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockCreateClient.mockRejectedValue('String error');
    
    render(
      <CreateClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    const createButton = screen.getByRole('button', { name: /Create Client/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });
});
