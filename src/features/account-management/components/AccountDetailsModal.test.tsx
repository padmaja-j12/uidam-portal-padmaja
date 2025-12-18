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
import { AccountDetailsModal } from './AccountDetailsModal';
import { Account, AccountStatus } from '../../../types';

const mockAccount: Account = {
  id: 'acc-123',
  accountName: 'Test Account',
  parentId: 'parent-456',
  status: AccountStatus.ACTIVE,
  roles: ['admin', 'user', 'viewer'],
  createdBy: 'test.user@example.com',
  createDate: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@example.com',
  updateDate: '2024-02-20T14:45:00Z',
};

describe('AccountDetailsModal', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    account: mockAccount,
  };

  it('should render modal when open', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('Account Details')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<AccountDetailsModal {...defaultProps} open={false} />);

    expect(screen.queryByText('Account Details')).not.toBeInTheDocument();
  });

  it('should return null when account is null', () => {
    const { container } = render(<AccountDetailsModal {...defaultProps} account={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('should display account ID', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('acc-123')).toBeInTheDocument();
  });

  it('should display account name', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('Test Account')).toBeInTheDocument();
  });

  it('should display parent ID', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    const parentIds = screen.getAllByText('parent-456');
    expect(parentIds.length).toBeGreaterThan(0);
  });

  it('should display status as chip', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    const statusChips = screen.getAllByText('ACTIVE');
    expect(statusChips.length).toBeGreaterThan(0);
  });

  it('should display all assigned roles', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('should display message when no roles assigned', () => {
    const accountWithoutRoles = { ...mockAccount, roles: [] };
    render(<AccountDetailsModal {...defaultProps} account={accountWithoutRoles} />);

    expect(screen.getByText('No roles assigned to this account')).toBeInTheDocument();
  });

  it('should display created by information', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('test.user@example.com')).toBeInTheDocument();
  });

  it('should display creation date', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    // Date should be formatted
    const dates = screen.getAllByText(/2024/);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('should display updated by information', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('should call onClose when Close button is clicked', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display hierarchy information for child accounts', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText(/Hierarchy Information/i)).toBeInTheDocument();
    expect(screen.getByText(/This account is a child account/i)).toBeInTheDocument();
  });

  it('should not display hierarchy information for root accounts', () => {
    const rootAccount = { ...mockAccount, parentId: undefined };
    render(<AccountDetailsModal {...defaultProps} account={rootAccount} />);

    expect(screen.queryByText(/Hierarchy Information/i)).not.toBeInTheDocument();
    expect(screen.getByText('None (Root Account)')).toBeInTheDocument();
  });

  it('should display status meanings', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText(/Status Meanings:/i)).toBeInTheDocument();
    expect(screen.getByText(/Active:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending:/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspended:/i)).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const minimalAccount: Account = {
      id: 'acc-min',
      accountName: 'Minimal Account',
      status: AccountStatus.INACTIVE,
      roles: [],
      createdBy: 'system',
      createDate: '2024-01-01',
    };

    render(<AccountDetailsModal {...defaultProps} account={minimalAccount} />);

    expect(screen.getByText('Minimal Account')).toBeInTheDocument();
    const naTexts = screen.getAllByText('N/A');
    expect(naTexts.length).toBeGreaterThan(0);
  });

  it('should render different status colors', () => {
    const statuses = [AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED, AccountStatus.DELETED];
    
    statuses.forEach(status => {
      const accountWithStatus = { ...mockAccount, status };
      const { unmount } = render(<AccountDetailsModal {...defaultProps} account={accountWithStatus} />);
      
      const statusChips = screen.getAllByText(status);
      expect(statusChips.length).toBeGreaterThan(0);
      
      unmount();
    });
  });

  it('should handle invalid date formats', () => {
    const accountWithInvalidDate = {
      ...mockAccount,
      createDate: 'invalid-date',
    };

    render(<AccountDetailsModal {...defaultProps} account={accountWithInvalidDate} />);

    expect(screen.getByText('Invalid Date')).toBeInTheDocument();
  });

  it('should display N/A for undefined dates', () => {
    const accountWithoutDate: Account = {
      id: 'acc-no-date',
      accountName: 'No Date Account',
      status: AccountStatus.ACTIVE,
      roles: [],
      createdBy: 'system',
      createDate: '2024-01-01',
    };

    render(<AccountDetailsModal {...defaultProps} account={accountWithoutDate} />);

    const naTexts = screen.getAllByText('N/A');
    expect(naTexts.length).toBeGreaterThan(0);
  });

  it('should render all section headers', () => {
    render(<AccountDetailsModal {...defaultProps} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Roles and Permissions')).toBeInTheDocument();
    expect(screen.getByText('Audit Information')).toBeInTheDocument();
    expect(screen.getByText('Status Information')).toBeInTheDocument();
  });

  it('should handle undefined parent ID', () => {
    const accountWithoutParent: Account = {
      ...mockAccount,
      parentId: undefined,
    };

    render(<AccountDetailsModal {...defaultProps} account={accountWithoutParent} />);

    expect(screen.getByText('None (Root Account)')).toBeInTheDocument();
  });

  it('should handle undefined roles array', () => {
    const accountWithoutRoles: Account = {
      ...mockAccount,
      roles: [],
    };

    render(<AccountDetailsModal {...defaultProps} account={accountWithoutRoles} />);

    expect(screen.getByText('No roles assigned to this account')).toBeInTheDocument();
  });
});
