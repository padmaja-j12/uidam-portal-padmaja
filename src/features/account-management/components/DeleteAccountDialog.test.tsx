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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { AccountService } from '../../../services/accountService';
import { AccountStatus } from '../../../types';

jest.mock('../../../services/accountService');

const mockAccount = {
  id: '1',
  accountName: 'Test Account',
  parentId: 'parent-123',
  status: 'ACTIVE' as AccountStatus,
  roles: ['USER', 'ADMIN'],
  createdBy: 'admin@test.com',
  createDate: '2024-01-01T00:00:00Z',
};

describe('DeleteAccountDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnAccountDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (AccountService.deleteAccount as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  describe('Rendering', () => {
    it('should not render when account is null', () => {
      const { container } = render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={null} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders when open with all account details', () => {
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Test Account/i)).toBeInTheDocument();
      expect(screen.getByText(/parent-123/i)).toBeInTheDocument();
      expect(screen.getByText(/USER, ADMIN/i)).toBeInTheDocument();
    });

    it('should render without parentId', () => {
      const accountWithoutParent = { ...mockAccount, parentId: undefined };
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={accountWithoutParent} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Test Account/i)).toBeInTheDocument();
      expect(screen.queryByText(/Parent ID:/i)).not.toBeInTheDocument();
    });

    it('should render without roles', () => {
      const accountWithoutRoles = { ...mockAccount, roles: [] };
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={accountWithoutRoles} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Test Account/i)).toBeInTheDocument();
      expect(screen.queryByText(/Roles:/i)).not.toBeInTheDocument();
    });

    it('should render status chips for different statuses', () => {
      const statuses = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED', 'DELETED'] as const;
      
      statuses.forEach(status => {
        const { unmount } = render(
          <BrowserRouter>
            <DeleteAccountDialog 
              open={true} 
              account={{ ...mockAccount, status: status as unknown as AccountStatus }} 
              onClose={mockOnClose} 
              onAccountDeleted={mockOnAccountDeleted} 
            />
          </BrowserRouter>
        );

        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays confirmation warning', () => {
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );
      
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('displays precautionary checklist', () => {
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );
      
      expect(screen.getByText(/Ensure no users are currently associated/i)).toBeInTheDocument();
      expect(screen.getByText(/Consider suspending the account instead/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('successfully deletes account and calls callbacks', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(AccountService.deleteAccount).toHaveBeenCalledWith('1');
        expect(mockOnAccountDeleted).toHaveBeenCalledWith('Test Account');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('displays loading state during deletion', async () => {
      const user = userEvent.setup();
      let resolvePromise: (() => void) | undefined;
      (AccountService.deleteAccount as jest.Mock).mockImplementation(
        () => new Promise((resolve) => {
          resolvePromise = () => resolve({ success: true });
        })
      );

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteButton);

      // Button should be disabled immediately
      expect(deleteButton).toBeDisabled();
      
      // Resolve the promise
      if (resolvePromise) {
        resolvePromise();
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles error from API response', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Custom error message',
      });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/i)).toBeInTheDocument();
      });
    });

    it('handles 400 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 400 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/dependent resources/i)).toBeInTheDocument();
      });
    });

    it('handles 401 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 401 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
      });
    });

    it('handles 403 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 403 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
      });
    });

    it('handles 404 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 404 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('handles 409 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 409 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/associated users/i)).toBeInTheDocument();
      });
    });

    it('handles 500 error', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue({ status: 500 });

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });

    it('handles Error object', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue(new Error('Test error'));

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });
    });

    it('clears error when close icon is clicked', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue(new Error('Test error'));

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      const errorAlert = screen.getByText(/Test error/i).closest('[role="alert"]');
      const closeButton = within(errorAlert as HTMLElement).getByRole('button');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
      });
    });

    it('clears error state when dialog closes', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockRejectedValue(new Error('Test error'));

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents closing dialog during deletion', async () => {
      const user = userEvent.setup();
      (AccountService.deleteAccount as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <BrowserRouter>
          <DeleteAccountDialog open={true} account={mockAccount} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
        </BrowserRouter>
      );

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
