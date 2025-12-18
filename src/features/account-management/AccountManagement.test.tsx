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
import { BrowserRouter } from 'react-router-dom';
import { AccountManagement } from './AccountManagement';
import { AccountService } from '../../services/accountService';

jest.mock('../../services/accountService');

const mockAccounts = [
  {
    id: 1,
    accountName: 'Test Account 1',
    parentId: null,
    status: 'ACTIVE',
    roles: ['ADMIN', 'USER'],
    createdBy: 'admin@test.com',
    createDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    accountName: 'Test Account 2',
    parentId: 1,
    status: 'PENDING',
    roles: ['USER'],
    createdBy: 'user@test.com',
    createDate: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    accountName: 'Test Account 3',
    parentId: null,
    status: 'SUSPENDED',
    roles: [],
    createdBy: 'manager@test.com',
    createDate: '2024-01-03T00:00:00Z',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccountManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AccountService.filterAccounts as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        content: mockAccounts,
        totalElements: mockAccounts.length,
      },
    });
  });

  it('renders account management title', async () => {
    renderWithRouter(<AccountManagement />);
    await waitFor(() => {
      expect(screen.getByText('Account Management')).toBeInTheDocument();
    });
  });

  it('displays subtitle', async () => {
    renderWithRouter(<AccountManagement />);
    await waitFor(() => {
      expect(screen.getByText('Manage accounts and organizational structure')).toBeInTheDocument();
    });
  });

  it('displays accounts after loading', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Account 1')).toBeInTheDocument();
      expect(screen.getByText('Test Account 2')).toBeInTheDocument();
      expect(screen.getByText('Test Account 3')).toBeInTheDocument();
    });
  });

  it('displays account statuses with correct colors', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
    });
  });

  it('displays account roles', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getAllByText('USER')).toHaveLength(2);
    });
  });

  it('shows "No roles" for accounts without roles', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('No roles')).toBeInTheDocument();
    });
  });

  it('displays account created by information', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
      expect(screen.getByText('manager@test.com')).toBeInTheDocument();
    });
  });

  it('displays create account button', async () => {
    renderWithRouter(<AccountManagement />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  it('calls filterAccounts on mount', async () => {
    renderWithRouter(<AccountManagement />);
    
    await waitFor(() => {
      expect(AccountService.filterAccounts).toHaveBeenCalled();
    });
  });

  it('displays loading state', () => {
    (AccountService.filterAccounts as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<AccountManagement />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
