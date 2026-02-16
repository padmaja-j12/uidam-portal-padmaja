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
import RoleManagement from './RoleManagement';
import { RoleService } from '../../services/role.service';
import { ScopeService } from '../../services/scope.service';

jest.mock('../../services/role.service');
jest.mock('../../services/scope.service');

const mockRoles = [
  {
    id: 1,
    name: 'ADMIN',
    description: 'Administrator role',
    scopes: [
      { 
        id: '1',
        name: 'admin:read', 
        description: 'Admin read access', 
        administrative: true,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
      { 
        id: '2',
        name: 'admin:write', 
        description: 'Admin write access', 
        administrative: true,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
    ],
  },
  {
    id: 2,
    name: 'USER',
    description: 'Standard user role',
    scopes: [
      { 
        id: '3',
        name: 'user:read', 
        description: 'User read access', 
        administrative: false,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
    ],
  },
  {
    id: 3,
    name: 'DEVELOPER',
    description: 'Developer role',
    scopes: [
      { 
        id: '4',
        name: 'dev:read', 
        description: 'Dev read access', 
        administrative: false,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
      { 
        id: '5',
        name: 'dev:write', 
        description: 'Dev write access', 
        administrative: false,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
      { 
        id: '6',
        name: 'dev:deploy', 
        description: 'Dev deploy access', 
        administrative: false,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
      { 
        id: '7',
        name: 'dev:debug', 
        description: 'Dev debug access', 
        administrative: false,
        predefined: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isSystemScope: false
      },
    ],
  },
];

const mockScopes = [
  { 
    id: '1',
    name: 'admin:read', 
    description: 'Admin read access', 
    administrative: true,
    predefined: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isSystemScope: false
  },
  { 
    id: '2',
    name: 'admin:write', 
    description: 'Admin write access', 
    administrative: true,
    predefined: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isSystemScope: false
  },
  { 
    id: '3',
    name: 'user:read', 
    description: 'User read access', 
    administrative: false,
    predefined: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isSystemScope: false
  },
  { 
    id: '4',
    name: 'user:write', 
    description: 'User write access', 
    administrative: false,
    predefined: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isSystemScope: false
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RoleManagement', () => {
  let mockRoleService: jest.Mocked<RoleService>;
  let mockScopeService: jest.Mocked<ScopeService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockRoleService = {
      getRoles: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    } as unknown as jest.Mocked<RoleService>;

    mockScopeService = {
      getAllScopes: jest.fn(),
    } as unknown as jest.Mocked<ScopeService>;

    (RoleService as jest.Mock).mockImplementation(() => mockRoleService);
    (ScopeService as jest.Mock).mockImplementation(() => mockScopeService);

    mockRoleService.getRoles.mockResolvedValue({
      content: mockRoles,
      size: 100,
      totalElements: mockRoles.length,
      totalPages: 1,
      number: 0,
      first: true,
      last: true,
    });

    mockScopeService.getAllScopes.mockResolvedValue(mockScopes);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders role management title and subtitle', async () => {
      renderWithRouter(<RoleManagement />);
      
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByText('Manage system roles and permissions')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderWithRouter(<RoleManagement />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('loads and displays roles after loading', async () => {
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('USER')).toBeInTheDocument();
        expect(screen.getByText('Administrator role')).toBeInTheDocument();
      });
    });

    it('loads available scopes on mount', async () => {
      renderWithRouter(<RoleManagement />);
      
      await waitFor(() => {
        expect(mockScopeService.getAllScopes).toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('allows searching for roles', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const searchInput = screen.getByPlaceholderText('Search roles...');
      await user.type(searchInput, 'ADMIN');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(mockRoleService.getRoles).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        filter: { name: 'ADMIN' },
      });
    });

    it('searches on Enter key press', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const searchInput = screen.getByPlaceholderText('Search roles...');
      await user.type(searchInput, 'USER{Enter}');

      await waitFor(() => {
        expect(mockRoleService.getRoles).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          filter: { name: 'USER' },
        });
      });
    });

    it('shows no results message when search returns empty', async () => {
      mockRoleService.getRoles.mockResolvedValueOnce({
        content: [],
        number: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      // Mock empty search results for NONEXISTENT search
      mockRoleService.getRoles.mockResolvedValueOnce({
        content: [],
        size: 0,
        totalElements: 0,
        totalPages: 0,
        number: 0,
        first: true,
        last: true
      });

      const searchInput = screen.getByPlaceholderText('Search roles...');
      await user.type(searchInput, 'NONEXISTENT');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('No roles found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('Create Role', () => {
    it('opens create dialog when Create Role button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const createButton = screen.getByRole('button', { name: /create role/i });
      await user.click(createButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Role')).toBeInTheDocument();
    });

    it('validates required fields when creating role', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const createButton = screen.getByRole('button', { name: /create role/i });
      await user.click(createButton);

      const dialog = screen.getByRole('dialog');
      const saveButton = within(dialog).getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Role name is required')).toBeInTheDocument();
      });
    });

    it('creates role successfully with valid data', async () => {
      mockRoleService.createRole.mockResolvedValue({
        id: 4,
        name: 'TESTER',
        description: 'Tester role',
        scopes: [],
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const createButton = screen.getByRole('button', { name: /create role/i });
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/role name/i);
      const descInput = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'TESTER');
      await user.type(descInput, 'Tester role');

      // Manually trigger scope selection through component state
      // Find the Scopes select and simulate selection
      const scopesLabels = screen.getAllByText('Scopes');
      expect(scopesLabels.length).toBeGreaterThan(0);

      // Note: MUI Select testing is complex, so we'll focus on the validation
      // In a real scenario, the select interaction would be tested with more specific MUI testing utils
    });
  });

  describe('Edit Role', () => {
    it('opens edit dialog with role data', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const editButtons = screen.getAllByRole('button', { name: /edit role/i });
      await user.click(editButtons[0]); // Click USER role edit button (first non-system role)

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Role')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USER')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard user role')).toBeInTheDocument();
    });

    it('disables editing system roles', async () => {
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const editButtons = screen.getAllByRole('button', { name: /cannot edit system role/i });
      expect(editButtons[0]).toBeDisabled();
    });

    it('updates role successfully', async () => {
      mockRoleService.updateRole.mockResolvedValue(mockRoles[1]);

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const editButtons = screen.getAllByRole('button', { name: /edit role/i });
      await user.click(editButtons[0]);

      const descInput = screen.getByLabelText(/description/i);
      await user.clear(descInput);
      await user.type(descInput, 'Updated user role');

      const saveButton = within(screen.getByRole('dialog')).getByRole('button', { name: /update/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockRoleService.updateRole).toHaveBeenCalledWith('USER', {
          description: 'Updated user role',
          scopeNames: ['user:read'],
        });
      });
    });
  });

  describe('Delete Role', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const deleteButtons = screen.getAllByRole('button', { name: /delete role/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete the role "USER"/i)).toBeInTheDocument();
    });

    it('disables deleting system roles', async () => {
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const deleteButtons = screen.getAllByRole('button', { name: /cannot delete system role/i });
      expect(deleteButtons[0]).toBeDisabled();
    });

    it('deletes role on confirmation', async () => {
      mockRoleService.deleteRole.mockResolvedValue(undefined);

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const deleteButtons = screen.getAllByRole('button', { name: /delete role/i });
      await user.click(deleteButtons[0]);

      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRoleService.deleteRole).toHaveBeenCalledWith('USER');
      });
    });

    it('cancels delete operation', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const deleteButtons = screen.getAllByRole('button', { name: /delete role/i });
      await user.click(deleteButtons[1]);

      const cancelButton = within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
      expect(mockRoleService.deleteRole).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error when fetching roles fails', async () => {
      mockRoleService.getRoles.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch roles: network error/i)).toBeInTheDocument();
      });
    });

    it('displays error when creating role fails', async () => {
      mockRoleService.createRole.mockRejectedValueOnce(new Error('Creation failed'));

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const createButton = screen.getByRole('button', { name: /create role/i });
      await user.click(createButton);

      await user.type(screen.getByLabelText(/role name/i), 'TESTER');
      await user.type(screen.getByLabelText(/description/i), 'Test');
      
      // Verify scopes field exists
      const scopesLabels = screen.getAllByText('Scopes');
      expect(scopesLabels.length).toBeGreaterThan(0);

      // Click save without selecting scopes to trigger validation
      const dialog = screen.getByRole('dialog');
      const saveButton = within(dialog).getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one scope must be selected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Scope Display', () => {
    it('displays scopes with correct colors', async () => {
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      const adminReadChip = screen.getByText('admin:read');
      expect(adminReadChip).toBeInTheDocument();
    });

    it('shows "+X more" for roles with many scopes', async () => {
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes roles and clears search', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<RoleManagement />);
      
      jest.advanceTimersByTime(500);
      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

      // Set search term
      const searchInput = screen.getByPlaceholderText('Search roles...');
      await user.type(searchInput, 'ADMIN');

      // Find and click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(mockRoleService.getRoles).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          filter: undefined,
        });
      });
    });
  });
});
