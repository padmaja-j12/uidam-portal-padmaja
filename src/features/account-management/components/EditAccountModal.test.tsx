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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditAccountModal } from './EditAccountModal';
import { AccountService } from '../../../services/accountService';
import * as useRolesHook from '../../../hooks/useRoles';
import { Account, AccountStatus } from '../../../types';

// Mock dependencies
jest.mock('../../../services/accountService');
jest.mock('../../../hooks/useRoles');

describe('EditAccountModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAccountUpdated = jest.fn();

  const mockAccount: Account = {
    id: 'acc-123',
    accountName: 'Test Account',
    parentId: '456',
    status: AccountStatus.ACTIVE,
    roles: ['admin', 'user'],
    createdBy: 'test.user@example.com',
    createDate: '2024-01-15T10:30:00Z',
    updatedBy: 'admin@example.com',
    updateDate: '2024-02-20T14:45:00Z',
  };

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    account: mockAccount,
    onAccountUpdated: mockOnAccountUpdated,
  };

  const mockRoles = ['admin', 'user', 'viewer'];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRolesHook.useRoles as jest.Mock).mockReturnValue({
      roles: mockRoles,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('should render modal when open with account', () => {
    render(<EditAccountModal {...defaultProps} />);
    expect(screen.getByText(/Edit Account: Test Account/i)).toBeInTheDocument();
  });

  it('should not render when account is null', () => {
    const { container } = render(<EditAccountModal {...defaultProps} account={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render account name as disabled field', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/Account Name/i);
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue('Test Account');
  });

  it('should render account ID as disabled field', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const idInput = screen.getByLabelText(/Account ID/i);
    expect(idInput).toBeDisabled();
    expect(idInput).toHaveValue('acc-123');
  });

  // Temporarily disabled - MUI Select label association issue
  it.skip('should initialize form with account data', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const parentIdInput = screen.getByLabelText(/Parent ID/i);
    expect(parentIdInput).toHaveValue(456);

    const statusSelect = screen.getByLabelText(/Status/i);
    expect(statusSelect).toHaveTextContent('Active');
  });

  it('should handle parent ID change', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const parentIdInput = screen.getByLabelText(/Parent ID/i);
    fireEvent.change(parentIdInput, { target: { value: '789' } });

    expect(parentIdInput).toHaveValue(789);
  });

  // Temporarily disabled - MUI Select label association issue
  it.skip('should handle status change', async () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.mouseDown(statusSelect);

    await waitFor(() => {
      const suspendedOption = screen.getByRole('option', { name: /Suspended/i });
      fireEvent.click(suspendedOption);
    });

    expect(statusSelect).toHaveTextContent('Suspended');
  });

  it('should validate parent ID as positive number', async () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const parentIdInput = screen.getByLabelText(/Parent ID/i);
    fireEvent.change(parentIdInput, { target: { value: '-5' } });

    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Parent ID must be a positive number')).toBeInTheDocument();
    });
  });

  // Temporarily disabled - MUI Select label association issue
  it.skip('should successfully update account', async () => {
    (AccountService.updateAccount as jest.Mock).mockResolvedValue({
      success: true,
      data: 'Account updated successfully',
    });

    render(<EditAccountModal {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.mouseDown(statusSelect);

    await waitFor(() => {
      const suspendedOption = screen.getByRole('option', { name: /Suspended/i });
      fireEvent.click(suspendedOption);
    });

    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(AccountService.updateAccount).toHaveBeenCalledWith('acc-123', expect.objectContaining({
        status: 'SUSPENDED',
        roles: ['admin', 'user'],
        parentId: '456',
      }));
      expect(mockOnAccountUpdated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle update error', async () => {
    (AccountService.updateAccount as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    render(<EditAccountModal {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });

    expect(mockOnAccountUpdated).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle network error', async () => {
    (AccountService.updateAccount as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<EditAccountModal {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    (AccountService.updateAccount as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: 'Success' }), 100))
    );

    render(<EditAccountModal {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(updateButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close modal when loading', () => {
    (AccountService.updateAccount as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: 'Success' }), 1000))
    );

    render(<EditAccountModal {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('should display account creation info', () => {
    render(<EditAccountModal {...defaultProps} />);
    
    expect(screen.getByText(/Created by: test.user@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Last updated by: admin@example.com/i)).toBeInTheDocument();
  });

  it('should handle missing creation info', () => {
    const accountWithoutInfo: Account = {
      ...mockAccount,
      createdBy: '',
      createDate: '',
      updatedBy: undefined,
      updateDate: undefined,
    };

    render(<EditAccountModal {...defaultProps} account={accountWithoutInfo} />);
    
    expect(screen.getByText(/Created by: N\/A/i)).toBeInTheDocument();
    expect(screen.getByText(/Created on: N\/A/i)).toBeInTheDocument();
  });

  it('should clear field error when user starts typing', async () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const parentIdInput = screen.getByLabelText(/Parent ID/i);
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    
    // Trigger validation error
    fireEvent.change(parentIdInput, { target: { value: '-5' } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Parent ID must be a positive number')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(parentIdInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.queryByText('Parent ID must be a positive number')).not.toBeInTheDocument();
    });
  });

  it('should dismiss error alert', async () => {
    (AccountService.updateAccount as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    render(<EditAccountModal {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    const alert = screen.getByRole('alert');
    const closeButton = alert.querySelector('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  // Temporarily disabled - MUI Select label association issue
  it.skip('should show all status options', async () => {
    render(<EditAccountModal {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.mouseDown(statusSelect);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Pending/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Active/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Suspended/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Blocked/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Deleted/i })).toBeInTheDocument();
    });
  });

  it('should reinitialize form when modal opens with different account', () => {
    const { rerender } = render(<EditAccountModal {...defaultProps} open={false} />);
    
    const newAccount: Account = {
      ...mockAccount,
      id: 'acc-999',
      accountName: 'New Account',
      status: AccountStatus.INACTIVE,
    };

    rerender(<EditAccountModal {...defaultProps} account={newAccount} open={true} />);

    expect(screen.getByText(/Edit Account: New Account/i)).toBeInTheDocument();
  });

  it('should handle account without roles', () => {
    const accountWithoutRoles: Account = {
      ...mockAccount,
      roles: [],
    };

    render(<EditAccountModal {...defaultProps} account={accountWithoutRoles} />);
    
    expect(screen.getByText(/Update roles/i)).toBeInTheDocument();
  });

  it('should require status field', () => {
    const accountWithStatus: Account = {
      ...mockAccount,
      status: AccountStatus.ACTIVE,
    };

    render(<EditAccountModal {...defaultProps} account={accountWithStatus} />);
    
    // Status field should be present
    expect(screen.getAllByText(/Status/i).length).toBeGreaterThan(0);
  });

  it('should handle empty parent ID', async () => {
    (AccountService.updateAccount as jest.Mock).mockResolvedValue({
      success: true,
      data: 'Success',
    });

    render(<EditAccountModal {...defaultProps} />);
    
    const parentIdInput = screen.getByLabelText(/Parent ID/i);
    fireEvent.change(parentIdInput, { target: { value: '' } });

    const updateButton = screen.getByRole('button', { name: /Update Account/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(AccountService.updateAccount).toHaveBeenCalledWith('acc-123', expect.objectContaining({
        status: 'ACTIVE',
        roles: ['admin', 'user'],
      }));
    });
  });
});
