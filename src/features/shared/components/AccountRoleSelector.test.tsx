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
import { render, screen, fireEvent } from '@testing-library/react';
import AccountRoleSelector from './AccountRoleSelector';
import { Role } from '../../../types';
import { AccountRoleMapping } from '../../../utils/accountRoleUtils';

// Mock the child component
jest.mock('./AccountRoleSelectorWithDefaults', () => ({
  AccountRoleSelectorWithDefaults: ({ accountName }: { accountName: string }) => (
    <div data-testid="role-selector-with-defaults">{accountName} Role Selector</div>
  ),
}));

const mockRoles: Role[] = [
  { id: 1, name: 'Admin', description: 'Admin role', scopes: [] },
  { id: 2, name: 'User', description: 'User role', scopes: [] },
  { id: 3, name: 'Viewer', description: 'Viewer role', scopes: [] },
];

const mockAccountRoleMappings: AccountRoleMapping[] = [
  {
    accountId: 'acc-1',
    accountName: 'Account 1',
    isAccountSelected: true,
    isNewAccount: false,
    isDefaultAccount: false,
    selectedRoles: ['Admin'],
    defaultRoles: ['User'],
    originalRoles: ['Admin'],
  },
  {
    accountId: 'acc-2',
    accountName: 'Account 2',
    isAccountSelected: false,
    isNewAccount: true,
    isDefaultAccount: false,
    selectedRoles: [],
    defaultRoles: [],
    originalRoles: [],
  },
];

describe('AccountRoleSelector', () => {
  const mockOnRoleSelectionChange = jest.fn();
  const mockOnAccountToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    accountRoleMappings: mockAccountRoleMappings,
    availableRoles: mockRoles,
    onRoleSelectionChange: mockOnRoleSelectionChange,
    onAccountToggle: mockOnAccountToggle,
  };

  describe('Rendering', () => {
    it('renders component with description text', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByText(/Configure account and role assignments/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one account must remain selected/i)).toBeInTheDocument();
    });

    it('renders all account mappings', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByText('Account 1')).toBeInTheDocument();
      expect(screen.getByText('Account 2')).toBeInTheDocument();
    });

    it('displays "User\'s Current Account" chip for existing accounts', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByText("User's Current Account")).toBeInTheDocument();
    });

    it('displays "Available Account" chip for new accounts', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByText('Available Account')).toBeInTheDocument();
    });

    it('shows role selector for selected accounts', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByTestId('role-selector-with-defaults')).toBeInTheDocument();
    });

    it('shows info text for unselected accounts', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      expect(screen.getByText(/Account not selected/i)).toBeInTheDocument();
    });
  });

  describe('Account Toggle', () => {
    it('calls onAccountToggle when checkbox is clicked', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      const checkbox = screen.getAllByRole('checkbox')[1]; // Second account
      fireEvent.click(checkbox);
      
      expect(mockOnAccountToggle).toHaveBeenCalledWith('acc-2', true);
    });

    it('disables checkbox when it is the last selected account', () => {
      const singleSelectedMapping: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['Admin'],
          defaultRoles: [],
          originalRoles: ['Admin'],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={singleSelectedMapping}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('enables checkbox when multiple accounts are selected', () => {
      const multipleSelectedMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['Admin'],
          defaultRoles: [],
          originalRoles: [],
        },
        {
          accountId: 'acc-2',
          accountName: 'Account 2',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['User'],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={multipleSelectedMappings}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeDisabled();
      expect(checkboxes[1]).not.toBeDisabled();
    });
  });

  describe('Empty Selection Mode', () => {
    it('allows unchecking all accounts when allowEmptySelection is true', () => {
      const singleSelectedMapping: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['Admin'],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={singleSelectedMapping}
          allowEmptySelection={true}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('does not show "at least one account" text when allowEmptySelection is true', () => {
      render(
        <AccountRoleSelector
          {...defaultProps}
          allowEmptySelection={true}
        />
      );
      
      expect(screen.queryByText(/At least one account must remain selected/i)).not.toBeInTheDocument();
    });
  });

  describe('Approval Warning', () => {
    it('shows approval warning when no accounts are selected and showApprovalWarning is true', () => {
      const noSelectedMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: false,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: [],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={noSelectedMappings}
          showApprovalWarning={true}
        />
      );
      
      expect(screen.getByText(/At least one account must be selected to proceed/i)).toBeInTheDocument();
    });

    it('hides approval warning when showApprovalWarning is false', () => {
      const noSelectedMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: false,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: [],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={noSelectedMappings}
          showApprovalWarning={false}
        />
      );
      
      expect(screen.queryByText(/At least one account must be selected to proceed/i)).not.toBeInTheDocument();
    });

    it('does not show warning when allowEmptySelection is true', () => {
      const noSelectedMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: false,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: [],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={noSelectedMappings}
          allowEmptySelection={true}
        />
      );
      
      expect(screen.queryByText(/At least one account must be selected to proceed/i)).not.toBeInTheDocument();
    });
  });

  describe('Multiple Accounts', () => {
    it('renders multiple account role selectors when multiple accounts are selected', () => {
      const multipleSelectedMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['Admin'],
          defaultRoles: [],
          originalRoles: [],
        },
        {
          accountId: 'acc-2',
          accountName: 'Account 2',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['User'],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={multipleSelectedMappings}
        />
      );
      
      const roleSelectors = screen.getAllByTestId('role-selector-with-defaults');
      expect(roleSelectors).toHaveLength(2);
    });

    it('handles mixed selected and unselected accounts', () => {
      render(<AccountRoleSelector {...defaultProps} />);
      
      // One role selector (for selected account)
      expect(screen.getByTestId('role-selector-with-defaults')).toBeInTheDocument();
      // One "not selected" message (for unselected account)
      expect(screen.getByText(/Account not selected/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty account mappings array', () => {
      render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={[]}
        />
      );
      
      expect(screen.getByText(/Configure account and role assignments/i)).toBeInTheDocument();
    });

    it('handles accounts with duplicate IDs', () => {
      const duplicateMappings: AccountRoleMapping[] = [
        {
          accountId: 'acc-1',
          accountName: 'Account 1',
          isAccountSelected: true,
          isNewAccount: false,
          isDefaultAccount: false,
          selectedRoles: ['Admin'],
          defaultRoles: [],
          originalRoles: [],
        },
        {
          accountId: 'acc-1',
          accountName: 'Account 1 Duplicate',
          isAccountSelected: false,
          isNewAccount: true,
          isDefaultAccount: false,
          selectedRoles: [],
          defaultRoles: [],
          originalRoles: [],
        },
      ];

      const { container } = render(
        <AccountRoleSelector
          {...defaultProps}
          accountRoleMappings={duplicateMappings}
        />
      );
      
      expect(container).toBeTruthy();
    });
  });
});
