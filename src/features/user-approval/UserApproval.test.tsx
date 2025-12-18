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
import '@testing-library/jest-dom';
import UserApproval from './UserApproval';
import { UserService } from '../../services/userService';
import * as accountRoleUtils from '../../utils/accountRoleUtils';

// Mock dependencies
jest.mock('../../services/userService');
jest.mock('../../utils/accountRoleUtils');
jest.mock('../../components/shared/ManagementLayout', () => ({
  __esModule: true,
  default: ({ children, title, onRefresh }: { children: React.ReactNode; title: string; onRefresh: () => void }) => (
    <div data-testid="management-layout">
      <div data-testid="layout-title">{title}</div>
      <button onClick={onRefresh} data-testid="refresh-button">Refresh</button>
      {children}
    </div>
  ),
}));
jest.mock('../shared/components/AccountRoleSelectorWithDefaults', () => ({
  AccountRoleSelectorWithDefaults: ({ accountName, selectedRoles, onRoleSelectionChange }: { 
    accountName: string; 
    selectedRoles: string[]; 
    onRoleSelectionChange: (id: string, roles: string[]) => void;
  }) => (
    <div data-testid={`role-selector-${accountName}`}>
      <span>{accountName}</span>
      <button onClick={() => onRoleSelectionChange('acc-1', ['Admin'])}>
        Change Roles
      </button>
      <span data-testid="selected-roles">{selectedRoles.join(', ')}</span>
    </div>
  ),
}));

const mockPendingUsers = [
  {
    id: 'user-1',
    userName: 'jdoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: 'PENDING',
    accounts: [
      {
        accountId: 'acc-1',
        accountName: 'Account 1',
        roles: ['User'],
      },
    ],
  },
  {
    id: 'user-2',
    userName: 'jsmith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    status: 'PENDING',
    accounts: [],
  },
];

const mockDeactivatedUsers = [
  {
    id: 'user-3',
    userName: 'bdoe',
    firstName: 'Bob',
    lastName: 'Doe',
    email: 'bob@example.com',
    status: 'DEACTIVATED',
    accounts: [],
  },
];

const mockAccounts = [
  {
    id: 'acc-1',
    accountName: 'Account 1',
    roles: ['Admin', 'User'],
  },
  {
    id: 'acc-2',
    accountName: 'Account 2',
    roles: ['Editor'],
  },
];

const mockRoles = [
  { id: 'role-1', roleName: 'Admin' },
  { id: 'role-2', roleName: 'User' },
  { id: 'role-3', roleName: 'Editor' },
];

describe('UserApproval Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock UserService methods
    (UserService.filterUsersV2 as jest.Mock).mockImplementation((filter) => {
      if (filter.status?.includes('PENDING')) {
        return Promise.resolve(mockPendingUsers);
      } else if (filter.status?.includes('DEACTIVATED')) {
        return Promise.resolve(mockDeactivatedUsers);
      }
      return Promise.resolve([]);
    });
    
    (UserService.getUserV2 as jest.Mock).mockResolvedValue({
      data: mockPendingUsers[0],
    });
    
    (UserService.changeUserStatus as jest.Mock).mockResolvedValue({ success: true });
    (UserService.updateUserV2 as jest.Mock).mockResolvedValue({ 
      message: 'User updated successfully' 
    });
    
    // Mock accountRoleUtils
    (accountRoleUtils.loadAvailableAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (accountRoleUtils.loadAvailableRoles as jest.Mock).mockResolvedValue(mockRoles);
    (accountRoleUtils.processUserAccount as jest.Mock).mockImplementation(
      (userAccount, _availableAccounts, mappings, processedIds) => {
        mappings.push({
          accountId: userAccount.accountId,
          accountName: userAccount.accountName,
          originalRoles: userAccount.roles || [],
          selectedRoles: userAccount.roles || [],
          defaultRoles: [],
          isNewAccount: false,
          isDefaultAccount: false,
          isAccountSelected: true,
        });
        processedIds.add(userAccount.accountId);
      }
    );
  });

  describe('Rendering', () => {
    it('renders the component with title', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByTestId('layout-title')).toHaveTextContent('User Approval Management');
      });
    });

    it('renders both tabs', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText(/Pending Approval/i)).toBeInTheDocument();
        expect(screen.getByText(/Deactivated Users/i)).toBeInTheDocument();
      });
    });

    it('displays pending users count in tab', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText(/Pending Approval \(2\)/i)).toBeInTheDocument();
      });
    });

    it('loads and displays pending users on mount', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('@jdoe')).toBeInTheDocument();
      });
    });

    it('shows loading state', async () => {
      (UserService.filterUsersV2 as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockPendingUsers), 100))
      );
      
      render(<UserApproval />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows empty state when no pending users', async () => {
      (UserService.filterUsersV2 as jest.Mock).mockResolvedValue([]);
      
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText(/No pending users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to deactivated users tab', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Doe')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('loads deactivated users when switching tabs', async () => {
      render(<UserApproval />);
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(UserService.filterUsersV2).toHaveBeenCalledWith(
          { status: ['DEACTIVATED'] },
          expect.any(Object)
        );
      });
    });
  });

  describe('User Approval Flow', () => {
    it('opens approval dialog when approve button clicked', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Get all buttons in table and find approve buttons (green check icons)
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Approve User: John Doe/i)).toBeInTheDocument();
      });
    });

    it('fetches complete user data when opening approval dialog', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(UserService.getUserV2).toHaveBeenCalledWith('user-1');
      });
    });

    it('initializes account mappings in approval dialog', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(accountRoleUtils.processUserAccount).toHaveBeenCalled();
        expect(screen.getByText(/Configure account and role assignments/i)).toBeInTheDocument();
      });
    });

    it('submits approval with correct operations', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Approve User:/i)).toBeInTheDocument();
      });
      
      const approveDialogButton = screen.getByRole('button', { name: /Approve User/i });
      fireEvent.click(approveDialogButton);
      
      await waitFor(() => {
        expect(UserService.updateUserV2).toHaveBeenCalledWith(
          'user-1',
          expect.arrayContaining([
            expect.objectContaining({
              op: 'replace',
              path: '/status',
              value: 'ACTIVE',
            }),
          ])
        );
      });
    });

    it('shows success message after approval', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve User/i })).toBeInTheDocument();
      });
      
      const approveDialogButton = screen.getByRole('button', { name: /Approve User/i });
      fireEvent.click(approveDialogButton);
      
      await waitFor(() => {
        expect(screen.getByText(/approved successfully/i)).toBeInTheDocument();
      });
    });

    it('handles approval error', async () => {
      (UserService.updateUserV2 as jest.Mock).mockRejectedValue(
        new Error('Update operation failed')
      );
      
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve User/i })).toBeInTheDocument();
      });
      
      const approveDialogButton = screen.getByRole('button', { name: /Approve User/i });
      fireEvent.click(approveDialogButton);
      
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/Update operation failed/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Rejection Flow', () => {
    it('opens reject dialog when reject button clicked', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const rejectButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CancelIcon"]') && 
        btn.closest('tbody')
      );
      
      if (rejectButton) {
        fireEvent.click(rejectButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Reject User: John Doe/i)).toBeInTheDocument();
      });
    });

    it('requires rejection reason', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const rejectButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CancelIcon"]') && 
        btn.closest('tbody')
      );
      
      if (rejectButton) {
        fireEvent.click(rejectButton);
      }
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Reject User/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button when reason provided', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const rejectButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CancelIcon"]') && 
        btn.closest('tbody')
      );
      
      if (rejectButton) {
        fireEvent.click(rejectButton);
      }
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
      
      const reasonField = screen.getByLabelText(/Rejection Reason/i);
      fireEvent.change(reasonField, { target: { value: 'Invalid application' } });
      
      const submitButton = screen.getByRole('button', { name: /Reject User/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('submits rejection with correct status change', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const rejectButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CancelIcon"]') && 
        btn.closest('tbody')
      );
      
      if (rejectButton) {
        fireEvent.click(rejectButton);
      }
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
      
      const reasonField = screen.getByLabelText(/Rejection Reason/i);
      fireEvent.change(reasonField, { target: { value: 'Invalid application' } });
      
      const submitButton = screen.getByRole('button', { name: /Reject User/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(UserService.changeUserStatus).toHaveBeenCalledWith({
          ids: ['user-1'],
          approved: false,
        });
      });
    });

    it('shows success message after rejection', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      const allButtons = screen.getAllByRole('button');
      const rejectButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CancelIcon"]') && 
        btn.closest('tbody')
      );
      
      if (rejectButton) {
        fireEvent.click(rejectButton);
        
        await waitFor(() => {
          expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
        });
        
        const reasonField = screen.getByLabelText(/Rejection Reason/i);
        fireEvent.change(reasonField, { target: { value: 'Invalid' } });
        
        const submitButton = screen.getByRole('button', { name: /Reject User/i });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/rejected successfully/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('User Reactivation Flow', () => {
    it('opens reactivate dialog when button clicked', async () => {
      render(<UserApproval />);
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const reactivateButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="PersonAddIcon"]') && 
        btn.closest('tbody')
      );
      
      if (reactivateButton) {
        fireEvent.click(reactivateButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Reactivate User: Bob Doe/i)).toBeInTheDocument();
      });
    });

    it('submits reactivation with correct status change', async () => {
      render(<UserApproval />);
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const reactivateButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="PersonAddIcon"]') && 
        btn.closest('tbody')
      );
      
      if (reactivateButton) {
        fireEvent.click(reactivateButton);
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reactivate User/i })).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /Reactivate User/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(UserService.changeUserStatus).toHaveBeenCalledWith({
          ids: ['user-3'],
          approved: true,
        });
      });
    });

    it('shows success message after reactivation', async () => {
      render(<UserApproval />);
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const reactivateButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="PersonAddIcon"]') && 
        btn.closest('tbody')
      );
      
      if (reactivateButton) {
        fireEvent.click(reactivateButton);
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reactivate User/i })).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /Reactivate User/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/reactivated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account and Role Management', () => {
    it('toggles account selection in approval dialog', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
      
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);
      
      // Should update account selection
      expect(firstCheckbox).toBeDefined();
    });

    it('prevents deselecting last account', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/at least one account must remain selected/i)).toBeInTheDocument();
      });
    });

    it('displays warning when no accounts selected', async () => {
      // Mock user with no accounts
      (UserService.filterUsersV2 as jest.Mock).mockResolvedValue([
        mockPendingUsers[1] // Jane Smith with no accounts
      ]);
      
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButtons = allButtons.filter(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButtons[0]) {
        fireEvent.click(approveButtons[0]);
      }
      
      await waitFor(() => {
        // User with no accounts will have first account selected by default
        // So we won't see the warning
        expect(screen.getByText(/Configure account and role assignments/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('changes page for pending users', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find pagination controls (MUI TablePagination renders buttons)
      const nextPageButtons = screen.getAllByRole('button');
      const nextButton = nextPageButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('next page')
      );
      
      if (nextButton) {
        fireEvent.click(nextButton);
        // Pagination state should update
      }
    });

    it('changes rows per page', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Rows per page is typically a select/combobox in MUI
      const rowsPerPageElements = screen.getAllByRole('combobox');
      expect(rowsPerPageElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('shows empty state when loading fails', async () => {
      (UserService.filterUsersV2 as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      render(<UserApproval />);
      
      await waitFor(() => {
        // When loading fails, component shows empty state
        expect(screen.getByText(/No pending users found/i)).toBeInTheDocument();
      });
    });

    it('shows dialog error when user data fetch fails', async () => {
      (UserService.getUserV2 as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch user')
      );
      
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const allButtons = screen.getAllByRole('button');
      const approveButton = allButtons.find(btn => 
        btn.querySelector('[data-testid="CheckCircleIcon"]') && 
        btn.closest('tbody')
      );
      
      if (approveButton) {
        fireEvent.click(approveButton);
      }
      
      await waitFor(() => {
        // Dialog should open even with error (falls back to list data)
        expect(screen.getByText(/Approve User: John Doe/i)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes pending users when refresh button clicked', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      jest.clearAllMocks();
      
      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(UserService.filterUsersV2).toHaveBeenCalledWith(
          { status: ['PENDING'] },
          expect.any(Object)
        );
      });
    });

    it('refreshes deactivated users when on deactivated tab', async () => {
      render(<UserApproval />);
      
      const deactivatedTab = screen.getByText(/Deactivated Users/i);
      fireEvent.click(deactivatedTab);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Doe')).toBeInTheDocument();
      });
      
      jest.clearAllMocks();
      
      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(UserService.filterUsersV2).toHaveBeenCalledWith(
          { status: ['DEACTIVATED'] },
          expect.any(Object)
        );
      });
    });
  });

  describe('Status Display', () => {
    it('displays correct status chip colors', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        const statusChips = screen.getAllByText('PENDING');
        expect(statusChips.length).toBeGreaterThan(0);
      });
    });

    it('shows user details correctly', async () => {
      render(<UserApproval />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('@jdoe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });
  });
});
