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
import { RoleSelector } from './RoleSelector';
import { Role } from '../../../types';

describe('RoleSelector', () => {
  const mockRoles: Role[] = [
    {
      id: 1,
      name: 'Admin',
      description: 'Admin role',
      scopes: []
    },
    {
      id: 2,
      name: 'User',
      description: 'User role',
      scopes: []
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Viewer role',
      scopes: []
    }
  ];

  const mockOnRoleSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render role selector with account name', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    expect(screen.getAllByText(/Select Roles for Test Account/i).length).toBeGreaterThan(0);
  });

  it('should display selected roles as chips', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={['Admin', 'User']}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('should mark default roles with primary color', () => {
    const { container } = render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={['Admin']}
        defaultRoles={['Admin']}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const chip = container.querySelector('[class*="MuiChip-colorPrimary"]');
    expect(chip).toBeInTheDocument();
  });

  it('should mark non-default roles with secondary color', () => {
    const { container } = render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={['User']}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const chip = container.querySelector('[class*="MuiChip-colorSecondary"]');
    expect(chip).toBeInTheDocument();
  });

  it('should display all available roles in dropdown', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('should show "Default" label for default roles', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={['Admin']}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('should show "Current" label for original roles that are not default', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={['Admin']}
        originalRoles={['User']}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should not show "Current" label for default roles even if they are original', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={['Admin']}
        originalRoles={['Admin']}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    const currentLabels = screen.queryAllByText('Current');
    expect(currentLabels.length).toBe(0);
  });

  it('should display help text', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    expect(screen.getByText(/You can select any combination of roles/i)).toBeInTheDocument();
  });

  it('should handle empty roles list', () => {
    render(
      <RoleSelector
        accountName="Test Account"
        selectedRoles={[]}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={[]}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render with no selected roles', () => {
    render(
      <RoleSelector
        accountName="Empty Account"
        selectedRoles={[]}
        defaultRoles={[]}
        originalRoles={[]}
        availableRoles={mockRoles}
        onRoleSelectionChange={mockOnRoleSelectionChange}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
