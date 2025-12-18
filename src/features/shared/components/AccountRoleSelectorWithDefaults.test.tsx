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
import { AccountRoleSelectorWithDefaults } from './AccountRoleSelectorWithDefaults';
import { Role } from '../../../types';

// Mock RoleSelector component
jest.mock('./RoleSelector', () => ({
  RoleSelector: ({ accountName, selectedRoles, onRoleSelectionChange }: {
    accountName: string;
    selectedRoles: string[];
    onRoleSelectionChange: (roles: string[]) => void;
  }) => (
    <div data-testid="role-selector">
      <div>Account: {accountName}</div>
      <div>Selected Roles: {selectedRoles.join(', ')}</div>
      <button onClick={() => onRoleSelectionChange(['role1', 'role2'])}>
        Change Roles
      </button>
    </div>
  ),
}));

describe('AccountRoleSelectorWithDefaults', () => {
  const mockAvailableRoles: Role[] = [
    { id: 1, name: 'ADMIN', description: 'Admin role', scopes: [] },
    { id: 2, name: 'USER', description: 'User role', scopes: [] },
    { id: 3, name: 'VIEWER', description: 'Viewer role', scopes: [] },
  ];

  const mockOnRoleSelectionChange = jest.fn();

  const defaultProps = {
    accountId: 'account-1',
    accountName: 'Test Account',
    isAccountSelected: true,
    selectedRoles: ['ADMIN', 'USER'],
    defaultRoles: ['USER', 'VIEWER'],
    originalRoles: ['USER'],
    availableRoles: mockAvailableRoles,
    onRoleSelectionChange: mockOnRoleSelectionChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when account is not selected', () => {
    it('should display message that account is not selected', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          isAccountSelected={false}
        />
      );

      expect(screen.getByText(/Account not selected/i)).toBeInTheDocument();
      expect(screen.getByText(/user will not have access to this account/i)).toBeInTheDocument();
    });

    it('should not render RoleSelector when account is not selected', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          isAccountSelected={false}
        />
      );

      expect(screen.queryByTestId('role-selector')).not.toBeInTheDocument();
    });

    it('should not render default roles chips when account is not selected', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          isAccountSelected={false}
        />
      );

      expect(screen.queryByText('USER')).not.toBeInTheDocument();
      expect(screen.queryByText('VIEWER')).not.toBeInTheDocument();
    });

    it('should display text in italic style', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          isAccountSelected={false}
        />
      );

      const text = screen.getByText(/Account not selected/i);
      expect(text).toHaveStyle({ fontStyle: 'italic' });
    });
  });

  describe('when account is selected', () => {
    it('should render RoleSelector component', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      expect(screen.getByTestId('role-selector')).toBeInTheDocument();
    });

    it('should pass correct props to RoleSelector', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      expect(screen.getByText(/Account: Test Account/)).toBeInTheDocument();
      expect(screen.getByText(/Selected Roles: ADMIN, USER/)).toBeInTheDocument();
    });

    it('should not display "not selected" message', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      expect(screen.queryByText(/Account not selected/i)).not.toBeInTheDocument();
    });
  });

  describe('default roles display', () => {
    it('should render default roles chips when defaultRoles array has items', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      expect(screen.getByText('USER')).toBeInTheDocument();
      expect(screen.getByText('VIEWER')).toBeInTheDocument();
    });

    it('should display caption explaining default roles', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      expect(screen.getByText(/Default roles for this account/i)).toBeInTheDocument();
      expect(screen.getByText(/can be deselected/i)).toBeInTheDocument();
    });

    it('should not render default roles section when defaultRoles is empty', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          defaultRoles={[]}
        />
      );

      expect(screen.queryByText(/Default roles for this account/i)).not.toBeInTheDocument();
    });

    it('should render all roles from defaultRoles array', () => {
      const multipleDefaultRoles = ['ADMIN', 'USER', 'VIEWER', 'EDITOR'];
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          defaultRoles={multipleDefaultRoles}
        />
      );

      multipleDefaultRoles.forEach(role => {
        expect(screen.getByText(role)).toBeInTheDocument();
      });
    });
  });

  describe('chip styling based on selection', () => {
    it('should render chips with primary color for selected default roles', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      // USER is in both selectedRoles and defaultRoles
      const userChip = screen.getByText('USER').closest('.MuiChip-root');
      expect(userChip).toHaveClass('MuiChip-colorPrimary');
      expect(userChip).toHaveClass('MuiChip-filled');
    });

    it('should render chips with default color for unselected default roles', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          selectedRoles={['ADMIN']}
          defaultRoles={['USER', 'VIEWER']}
        />
      );

      // USER and VIEWER are default but not selected
      const userChip = screen.getByText('USER').closest('.MuiChip-root');
      const viewerChip = screen.getByText('VIEWER').closest('.MuiChip-root');
      
      expect(userChip).toHaveClass('MuiChip-colorDefault');
      expect(userChip).toHaveClass('MuiChip-outlined');
      expect(viewerChip).toHaveClass('MuiChip-colorDefault');
      expect(viewerChip).toHaveClass('MuiChip-outlined');
    });

    it('should handle mixed selection of default roles', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          selectedRoles={['USER']}
          defaultRoles={['USER', 'VIEWER']}
        />
      );

      const userChip = screen.getByText('USER').closest('.MuiChip-root');
      const viewerChip = screen.getByText('VIEWER').closest('.MuiChip-root');
      
      // USER is selected
      expect(userChip).toHaveClass('MuiChip-colorPrimary');
      expect(userChip).toHaveClass('MuiChip-filled');
      
      // VIEWER is not selected
      expect(viewerChip).toHaveClass('MuiChip-colorDefault');
      expect(viewerChip).toHaveClass('MuiChip-outlined');
    });
  });

  describe('role selection callback', () => {
    it('should call onRoleSelectionChange with accountId when roles change in RoleSelector', () => {
      render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      const changeButton = screen.getByText('Change Roles');
      changeButton.click();

      expect(mockOnRoleSelectionChange).toHaveBeenCalledWith('account-1', ['role1', 'role2']);
    });

    it('should pass correct accountId to callback', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          accountId="different-account-id"
        />
      );

      const changeButton = screen.getByText('Change Roles');
      changeButton.click();

      expect(mockOnRoleSelectionChange).toHaveBeenCalledWith(
        'different-account-id',
        ['role1', 'role2']
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty selectedRoles array', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          selectedRoles={[]}
        />
      );

      expect(screen.getByTestId('role-selector')).toBeInTheDocument();
    });

    it('should handle single default role', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          defaultRoles={['ADMIN']}
        />
      );

      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.queryByText('USER')).not.toBeInTheDocument();
    });

    it('should handle empty availableRoles array', () => {
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          availableRoles={[]}
        />
      );

      expect(screen.getByTestId('role-selector')).toBeInTheDocument();
    });

    it('should handle long account names', () => {
      const longAccountName = 'This is a very long account name that might wrap';
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          accountName={longAccountName}
        />
      );

      expect(screen.getByText(new RegExp(longAccountName))).toBeInTheDocument();
    });

    it('should handle many default roles', () => {
      const manyRoles = Array.from({ length: 10 }, (_, i) => `ROLE_${i}`);
      render(
        <AccountRoleSelectorWithDefaults
          {...defaultProps}
          defaultRoles={manyRoles}
        />
      );

      manyRoles.forEach(role => {
        expect(screen.getByText(role)).toBeInTheDocument();
      });
    });
  });

  describe('component composition', () => {
    it('should render default roles section before RoleSelector', () => {
      const { container } = render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      const elements = container.querySelectorAll('*');
      const defaultRolesIndex = Array.from(elements).findIndex(el => 
        el.textContent?.includes('Default roles for this account')
      );
      const roleSelectorIndex = Array.from(elements).findIndex(el => 
        el.getAttribute('data-testid') === 'role-selector'
      );

      expect(defaultRolesIndex).toBeLessThan(roleSelectorIndex);
    });

    it('should use Box component for default roles layout', () => {
      const { container } = render(<AccountRoleSelectorWithDefaults {...defaultProps} />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });
  });
});
