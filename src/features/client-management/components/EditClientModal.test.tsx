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
import { EditClientModal } from './EditClientModal';
import { ClientRegistrationService } from '../../../services/clientRegistrationService';
import { ClientListItem, CLIENT_STATUS } from '../../../types/client';

jest.mock('../../../services/clientRegistrationService');

jest.mock('./ClientFormFields', () => ({
  ClientFormFields: () => <div data-testid="client-form-fields">Form Fields</div>,
}));

jest.mock('./ClientModalWrapper', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any  
  ClientModalWrapper: ({ children, open, onClose, onPrimaryAction, error, validationErrors, loading }: any) =>
    open ? (
      <div data-testid="client-modal-wrapper">
        {loading && <div data-testid="loading">Loading...</div>}
        {error && <div data-testid="error">{error}</div>}
        {validationErrors && validationErrors.length > 0 && (
          <div data-testid="validation-errors">{validationErrors.join(', ')}</div>
        )}
        {children}
        <button onClick={onPrimaryAction}>Update Client</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

const mockClient: ClientListItem = {
  clientId: 'test-client',
  clientName: 'Test Client',
  status: CLIENT_STATUS.APPROVED,
  authorizationGrantTypes: ['authorization_code'],
  scopes: ['openid', 'profile'],
  requestedBy: 'admin',
};

const mockClientDetails = {
  clientId: 'test-client',
  clientName: 'Test Client',
  clientSecret: 'secret',
  authorizationGrantTypes: ['authorization_code'],
  redirectUris: ['https://example.com/callback'],
  postLogoutRedirectUris: ['https://example.com/logout'],
  scopes: ['openid', 'profile'],
  clientAuthenticationMethods: ['client_secret_basic'],
  accessTokenValidity: 3600,
  refreshTokenValidity: 86400,
  authorizationCodeValidity: 600,
  requireAuthorizationConsent: true,
  additionalInformation: '',
  status: CLIENT_STATUS.APPROVED,
  createdBy: 'admin',
};

describe('EditClientModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockGetClient = jest.fn();
  const mockUpdateClient = jest.fn();
  const mockValidateClientData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ClientRegistrationService.getClient as jest.Mock) = mockGetClient;
    (ClientRegistrationService.updateClient as jest.Mock) = mockUpdateClient;
    (ClientRegistrationService.validateClientData as jest.Mock) = mockValidateClientData;
    
    mockGetClient.mockResolvedValue({ data: mockClientDetails });
  });

  it('should render modal when open', () => {
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    expect(screen.getByTestId('client-modal-wrapper')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(
      <EditClientModal
        open={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    expect(screen.queryByTestId('client-modal-wrapper')).not.toBeInTheDocument();
  });

  it('should load client details when opened', async () => {
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalledWith('test-client');
    });
  });

  it('should show loading state while fetching client details', () => {
    mockGetClient.mockImplementation(() => new Promise(() => {}));
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should handle error when loading client details fails', async () => {
    mockGetClient.mockRejectedValue(new Error('Load failed'));
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  it('should update client successfully', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockUpdateClient.mockResolvedValue({});
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onSuccess={mockOnSuccess}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith('test-client', expect.any(Object));
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith('Client updated successfully');
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    const validationErrors = ['Client Name is required'];
    mockValidateClientData.mockReturnValue(validationErrors);
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      expect(mockUpdateClient).not.toHaveBeenCalled();
    });
  });

  it('should handle update error', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockUpdateClient.mockRejectedValue(new Error('Update failed'));
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to update client/i)).toBeInTheDocument();
    });
  });

  it('should clear errors when closing', async () => {
    const user = userEvent.setup();
    mockUpdateClient.mockRejectedValue(new Error('Update failed'));
    mockValidateClientData.mockReturnValue([]);
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not update if client is null', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    expect(mockUpdateClient).not.toHaveBeenCalled();
  });

  it('should work without onSuccess callback', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockUpdateClient.mockResolvedValue({});
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('should handle response without data', async () => {
    mockGetClient.mockResolvedValue({});
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
  });

  it('should handle scopes as Set', async () => {
    const clientDetailsWithSet = {
      ...mockClientDetails,
      scopes: new Set(['openid', 'profile']),
    };
    mockGetClient.mockResolvedValue({ data: clientDetailsWithSet });
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
  });

  it('should handle update error without message property', async () => {
    const user = userEvent.setup();
    mockValidateClientData.mockReturnValue([]);
    mockUpdateClient.mockRejectedValue('String error');
    
    render(
      <EditClientModal
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={mockClient}
      />
    );
    
    await waitFor(() => {
      expect(mockGetClient).toHaveBeenCalled();
    });
    
    const updateButton = screen.getByRole('button', { name: /Update Client/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });
});
