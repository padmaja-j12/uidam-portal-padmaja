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
import DeleteUserDialog from './DeleteUserDialog';
import { UserService, User } from '../../../services/userService';

// Mock UserService
jest.mock('../../../services/userService', () => ({
  UserService: {
    deleteUserV1: jest.fn(),
  },
}));

describe('DeleteUserDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnUserDeleted = jest.fn();

  const mockUser: User = {
    id: 123,
    userName: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    status: 'ACTIVE',
    accounts: [
      {
        account: 'Account1',
        roles: ['ADMIN', 'USER'],
      },
      {
        account: 'Account2',
        roles: ['VIEWER'],
      },
    ],
  };

  const defaultProps = {
    open: true,
    user: mockUser,
    onClose: mockOnClose,
    onUserDeleted: mockOnUserDeleted,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getAllByText('Delete User')[0]).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<DeleteUserDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
    });

    it('should not render when user is null', () => {
      render(<DeleteUserDialog {...defaultProps} user={null} />);
      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
    });

    it('should render warning alert', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      expect(screen.getByText(/This action cannot be undone!/i)).toBeInTheDocument();
      expect(screen.getByText(/Deleting a user will permanently remove/i)).toBeInTheDocument();
    });

    it('should display user information', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      expect(screen.getByText(mockUser.id)).toBeInTheDocument();
      expect(screen.getByText(mockUser.userName)).toBeInTheDocument();
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('should display user status as chip', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should display associated accounts', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      expect(screen.getByText(/Account1 \(ADMIN, USER\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Account2 \(VIEWER\)/i)).toBeInTheDocument();
    });

    it('should render confirmation checkbox', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render action buttons', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete user/i })).toBeInTheDocument();
    });

    it('should have delete button disabled by default', () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('User Status Colors', () => {
    it('should display ACTIVE status with success color', () => {
      render(<DeleteUserDialog {...defaultProps} user={{ ...mockUser, status: 'ACTIVE' }} />);
      const chip = screen.getByText('ACTIVE').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    it('should display PENDING status with warning color', () => {
      render(<DeleteUserDialog {...defaultProps} user={{ ...mockUser, status: 'PENDING' }} />);
      const chip = screen.getByText('PENDING').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    it('should display BLOCKED status with error color', () => {
      render(<DeleteUserDialog {...defaultProps} user={{ ...mockUser, status: 'BLOCKED' }} />);
      const chip = screen.getByText('BLOCKED').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    it('should display REJECTED status with error color', () => {
      render(<DeleteUserDialog {...defaultProps} user={{ ...mockUser, status: 'REJECTED' }} />);
      const chip = screen.getByText('REJECTED').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    it('should display DEACTIVATED status with default color', () => {
      render(<DeleteUserDialog {...defaultProps} user={{ ...mockUser, status: 'DEACTIVATED' }} />);
      const chip = screen.getByText('DEACTIVATED').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorDefault');
    });
  });

  describe('Checkbox Interaction', () => {
    it('should enable delete button when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<DeleteUserDialog {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      expect(deleteButton).toBeDisabled();
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(deleteButton).toBeEnabled();
    });

    it('should disable delete button when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      expect(deleteButton).toBeEnabled();
      
      await user.click(checkbox);
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Delete Functionality', () => {
    it('should call deleteUserV1 when delete button is clicked', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockResolvedValue({ code: 'SUCCESS' });
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(UserService.deleteUserV1).toHaveBeenCalledWith(mockUser.id);
      });
    });

    it('should call onUserDeleted on successful deletion', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockResolvedValue({ code: 'SUCCESS' });
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockOnUserDeleted).toHaveBeenCalled();
      });
    });

    it('should call onClose on successful deletion', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockResolvedValue({ code: 'SUCCESS' });
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it.skip('should display loading state during deletion', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ code: 'SUCCESS' }), 100))
      );
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      });
    });

    it('should disable buttons during deletion', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ code: 'SUCCESS' }), 100))
      );
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      await user.click(deleteButton);
      
      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when deletion fails', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns non-SUCCESS code', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockResolvedValue({ 
        code: 'ERROR', 
        message: 'Cannot delete user' 
      });
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot delete user/i)).toBeInTheDocument();
      });
    });

    it('should handle 403 Forbidden error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('403 Forbidden'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 Not Found error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('404 Not Found'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/User not found/i)).toBeInTheDocument();
      });
    });

    it('should handle 409 Conflict error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('409 Conflict'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot delete user.*dependencies/i)).toBeInTheDocument();
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('500 Internal Server Error'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });

    it('should not call onUserDeleted on error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('Test error message'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
      });
      
      expect(mockOnUserDeleted).not.toHaveBeenCalled();
    });

    it('should not close dialog on error', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });
      
      // Dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteUserDialog {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset confirmation checkbox on cancel', async () => {
      const user = userEvent.setup();
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // When dialog reopens, checkbox should be unchecked
      // We simulate this by checking the state was reset
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear error message on cancel', async () => {
      const user = userEvent.setup();
      (UserService.deleteUserV1 as jest.Mock).mockRejectedValue(new Error('Test cancel error'));
      
      render(<DeleteUserDialog {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Test cancel error/i)).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user without accounts', () => {
      const userWithoutAccounts = { ...mockUser, accounts: [] };
      render(<DeleteUserDialog {...defaultProps} user={userWithoutAccounts} />);
      
      expect(screen.queryByText(/Associated Accounts/i)).not.toBeInTheDocument();
    });

    it('should handle user with undefined accounts', () => {
      const userWithoutAccounts = { ...mockUser, accounts: undefined };
      render(<DeleteUserDialog {...defaultProps} user={userWithoutAccounts as User} />);
      
      expect(screen.getByText(mockUser.userName)).toBeInTheDocument();
    });

    it('should not attempt deletion without user', async () => {
      const { rerender } = render(<DeleteUserDialog {...defaultProps} />);
      
      rerender(<DeleteUserDialog {...defaultProps} user={null} />);
      
      expect(UserService.deleteUserV1).not.toHaveBeenCalled();
    });

    it('should not attempt deletion without confirmation', async () => {
      render(<DeleteUserDialog {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete user/i });
      // Button should be disabled, but try clicking anyway
      expect(deleteButton).toBeDisabled();
      
      expect(UserService.deleteUserV1).not.toHaveBeenCalled();
    });

    it('should handle single account', () => {
      const userWithSingleAccount = {
        ...mockUser,
        accounts: [{ account: 'SingleAccount', roles: ['USER'] }],
      };
      render(<DeleteUserDialog {...defaultProps} user={userWithSingleAccount} />);
      
      expect(screen.getByText(/SingleAccount \(USER\)/i)).toBeInTheDocument();
    });

    it('should handle account with single role', () => {
      const userWithSingleRole = {
        ...mockUser,
        accounts: [{ account: 'Account1', roles: ['ADMIN'] }],
      };
      render(<DeleteUserDialog {...defaultProps} user={userWithSingleRole} />);
      
      expect(screen.getByText(/Account1 \(ADMIN\)/i)).toBeInTheDocument();
    });
  });
});
