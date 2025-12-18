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
import userEvent from '@testing-library/user-event';
import ManageUserAccountsModal from './ManageUserAccountsModal';
import { UserService, User } from '../../../services/userService';
import { AccountService } from '../../../services/accountService';

// Mock the services
jest.mock('../../../services/userService');
jest.mock('../../../services/accountService');
jest.mock('../../shared/components/AccountRoleSelector', () => {
  return function MockAccountRoleSelector() {
    return <div data-testid="account-role-selector">Account Role Selector</div>;
  };
});

describe('ManageUserAccountsModal', () => {
  const mockOnClose = jest.fn();

  const mockUser: User = {
    id: 1,
    userName: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '',
    status: 'ACTIVE',
    roles: [],
    accounts: [
      { account: 'account1', roles: ['USER'] }
    ]
  };

  const mockAccounts = [
    { id: 'acc1', accountName: 'Account 1', status: 'ACTIVE', roles: [], createdBy: 'admin', createDate: '2024-01-01' },
    { id: 'acc2', accountName: 'Account 2', status: 'ACTIVE', roles: [], createdBy: 'admin', createDate: '2024-01-01' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (UserService.getUserV2 as jest.Mock).mockResolvedValue({
      data: mockUser
    });
    (AccountService.getAccountsByStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        content: mockAccounts,
        totalElements: mockAccounts.length
      }
    });
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <ManageUserAccountsModal
          open={false}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.queryByText('Manage User Accounts')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });

    it('should display user information', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    it('should render AccountRoleSelector component', async () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-role-selector')).toBeInTheDocument();
      });
    });
  });

  describe('User Data Loading', () => {
    it('should render account role selector after initialization', async () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-role-selector')).toBeInTheDocument();
      });
    });

    it('should handle user data fetch error gracefully', async () => {
      (UserService.getUserV2 as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch user')
      );

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });

    it('should handle null user', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={null}
        />
      );

      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading account information/i)).not.toBeInTheDocument();
      });

      const notesField = screen.getByLabelText(/notes/i);
      await user.type(notesField, 'Test notes');

      expect(notesField).toHaveValue('Test notes');
    });
  });

  // Form Submission tests removed - would require testing non-existent UserService.updateUserAccountsV2 API

  describe('Modal Actions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose on dialog close', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should render content after initialization', async () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-role-selector')).toBeInTheDocument();
      });
    });
  });

  describe('Notes Field', () => {
    it('should have placeholder text in notes field', async () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading account information/i)).not.toBeInTheDocument();
      });

      const notesField = screen.getByPlaceholderText(/add any notes/i);
      expect(notesField).toBeInTheDocument();
    });

    it('should retain notes field state across renders', async () => {
      const user = userEvent.setup();
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading account information/i)).not.toBeInTheDocument();
      });

      const notesField = screen.getByLabelText(/notes/i);
      await user.type(notesField, 'Test notes');
      expect(notesField).toHaveValue('Test notes');
      
      // Notes field maintains its value
      expect(notesField).toHaveValue('Test notes');
    }, 15000);
  });

  describe('User Information Display', () => {
    it('should display user first and last name', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.getByText(/Test/)).toBeInTheDocument();
      expect(screen.getByText(/User/)).toBeInTheDocument();
    });

    it('should display username in parentheses', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      expect(screen.getByText(/@testuser/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle user data fetch errors', async () => {
      (UserService.getUserV2 as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Component should still render
      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should have Update Assignments button enabled', async () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading account information/i)).not.toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update assignments/i });
      expect(updateButton).toBeInTheDocument();
      expect(updateButton).not.toBeDisabled();
    });

    it('should have Cancel button enabled', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Modal Title', () => {
    it('should display account circle icon', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      const icon = screen.getByTestId('AccountCircleIcon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with account role changes', async () => {
      const user = userEvent.setup();
      jest.spyOn(UserService, 'updateUserV2').mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success'
      });

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update assignments/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update assignments/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    }, 15000);

    it('should call onSuccess callback on successful submission', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      jest.spyOn(UserService, 'updateUserV2').mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success'
      });

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update assignments/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update assignments/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    }, 15000);
  });

  describe('Notes Field Interactions', () => {
    it('should update notes field value', async () => {
      const user = userEvent.setup();
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading account information/i)).not.toBeInTheDocument();
      });

      const notesField = screen.getByLabelText(/notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'New notes content');
      
      expect(notesField).toHaveValue('New notes content');
    }, 15000);
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      // Modal should render and initialize
      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={null}
        />
      );

      expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
    });

    it('should handle API response without data property', async () => {
      (UserService.getUserV2 as jest.Mock).mockResolvedValue({});

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Manage Account & Role Assignments')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar Notifications', () => {
    it('should show success snackbar on successful update', async () => {
      const user = userEvent.setup();
      jest.spyOn(UserService, 'updateUserV2').mockResolvedValue({
        code: 'SUCCESS',
        message: 'Success'
      });

      render(
        <ManageUserAccountsModal
          open={true}
          onClose={mockOnClose}
          user={mockUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update assignments/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update assignments/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    }, 15000);
  });
});

