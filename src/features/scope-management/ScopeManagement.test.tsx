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
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ScopeManagement from './ScopeManagement';
import { scopeService } from '@services/index';
import type { Scope, PaginatedResponse } from '@/types';

// Mock services
jest.mock('@services/index', () => ({
  scopeService: {
    getScopes: jest.fn(),
    createScope: jest.fn(),
    updateScope: jest.fn(),
    deleteScope: jest.fn(),
  },
}));

const mockScopeService = scopeService as jest.Mocked<typeof scopeService>;

// Mock data
const mockScopes: Scope[] = [
  {
    id: '1',
    name: 'read:users',
    description: 'Read user information',
    administrative: false,
    predefined: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isSystemScope: true,
  },
  {
    id: '2',
    name: 'write:users',
    description: 'Write user information',
    administrative: true,
    predefined: false,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    isSystemScope: false,
  },
];

const mockScopePageResponse: PaginatedResponse<Scope> = {
  content: mockScopes,
  totalElements: 2,
  totalPages: 1,
  size: 25,
  number: 0,
  first: true,
  last: true,
};

// Test store
const createMockStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ user: { id: '1', username: 'testuser' }, isAuthenticated: true }),
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('ScopeManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockScopeService.getScopes.mockResolvedValue(mockScopePageResponse);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders the scope management page with title', async () => {
      renderWithProviders(<ScopeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Scope Management/i)).toBeInTheDocument();
      });
    });

    it('renders search input and add button', async () => {
      renderWithProviders(<ScopeManagement />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by scope name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add scope/i })).toBeInTheDocument();
      });
    });
  });

  describe('Scope Loading', () => {
    it('shows loading state initially', () => {
      renderWithProviders(<ScopeManagement />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('loads and displays scopes successfully', async () => {
      renderWithProviders(<ScopeManagement />);

      // Fast-forward minimum loading time
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
        expect(screen.getByText('write:users')).toBeInTheDocument();
        expect(screen.getByText('Read user information')).toBeInTheDocument();
      });

      expect(mockScopeService.getScopes).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
          size: 10,
          sortBy: 'name',
          sortOrder: 'asc',
          filter: {},
        })
      );
    });

    it('displays error message when loading fails', async () => {
      mockScopeService.getScopes.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('triggers search when typing in search field', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by scope name/i);
      await user.type(searchInput, 'read');

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockScopeService.getScopes).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: { name: 'read' },
          })
        );
      });
    });

    it.skip('resets page to 0 when searching', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      // Change page first
      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextPageButton);

      // Then search
      const searchInput = screen.getByPlaceholderText(/Search by scope name/i);
      await user.type(searchInput, 'read');

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockScopeService.getScopes).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 0,
            filter: { name: 'read' },
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('changes page when next button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockScopeService.getScopes.mockResolvedValue({
        ...mockScopePageResponse,
        totalElements: 100,
        totalPages: 4,
      });

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextPageButton);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockScopeService.getScopes).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });

    it('changes rows per page', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const rowsPerPageSelect = screen.getByRole('combobox');
      await user.click(rowsPerPageSelect);
      
      const option50 = await screen.findByRole('option', { name: '50' });
      await user.click(option50);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockScopeService.getScopes).toHaveBeenLastCalledWith(
          expect.objectContaining({ size: 50 })
        );
      });
    });
  });

  describe('Scope Type Display', () => {
    it('displays administrative badge for administrative scopes', async () => {
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        const adminChips = screen.getAllByText(/Admin/i);
        expect(adminChips.length).toBeGreaterThan(0);
      });
    });

    it.skip('displays predefined badge for predefined scopes', async () => {
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        const predefinedChips = screen.getAllByText(/Predefined/i);
        expect(predefinedChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Create Scope', () => {
    it.skip('opens dialog when Add Scope button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add scope/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Create Scope/i)).toBeInTheDocument();
      });
    });

    it.skip('creates new scope with valid data', async () => {
      const user = userEvent.setup({ delay: null });
      mockScopeService.createScope.mockResolvedValueOnce({
        id: '3',
        name: 'new:scope',
        description: 'New scope description',
        administrative: false,
        predefined: false,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        isSystemScope: false,
      });

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add scope/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/^Scope Name/i);
      const descInput = screen.getByLabelText(/Description/i);
      await user.type(nameInput, 'new:scope');
      await user.type(descInput, 'New scope description');

      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockScopeService.createScope).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'new:scope',
            description: 'New scope description',
            administrative: false,
          })
        );
      });
    });

    it.skip('shows validation errors for invalid scope name', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add scope/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/^Scope Name/i);
      await user.type(nameInput, 'invalid scope!');

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Test description');

      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/can only contain letters, numbers/i)).toBeInTheDocument();
      });

      expect(mockScopeService.createScope).not.toHaveBeenCalled();
    });
  });

  describe('Edit Scope', () => {
    it.skip('opens edit dialog with scope data', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('write:users')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[1]); // Click edit for non-predefined scope

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Edit Scope/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('write:users')).toBeInTheDocument();
      });
    });

    it.skip('updates scope with new data', async () => {
      const user = userEvent.setup({ delay: null });
      mockScopeService.updateScope.mockResolvedValueOnce({
        id: '2',
        name: 'write:users',
        description: 'Updated description',
        administrative: true,
        predefined: false,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        isSystemScope: false,
      });

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('write:users')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/Description/i);
      await user.clear(descInput);
      await user.type(descInput, 'Updated description');

      const saveButton = screen.getByRole('button', { name: /update/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockScopeService.updateScope).toHaveBeenCalledWith(
          'write:users',
          expect.objectContaining({
            description: 'Updated description',
          })
        );
      });
    });

    it('does not allow editing predefined scopes', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]); // Click edit for predefined scope

      // Dialog should not open for predefined scopes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Scope', () => {
    it.skip('opens delete confirmation dialog', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('write:users')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[1]); // Click delete for non-predefined scope

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });
    });

    it.skip('deletes scope when confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      mockScopeService.deleteScope.mockResolvedValueOnce(undefined);

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('write:users')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockScopeService.deleteScope).toHaveBeenCalledWith('write:users');
      });
    });

    it('does not allow deleting predefined scopes', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]); // Click delete for predefined scope

      // Dialog should not open for predefined scopes
      await waitFor(() => {
        expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
      });
    });

    it.skip('closes dialog when cancel button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('write:users')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
      });

      expect(mockScopeService.deleteScope).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it.skip('refreshes scope list and clears search', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
      });

      // Add search term
      const searchInput = screen.getByPlaceholderText(/Search scopes/i);
      await user.type(searchInput, 'test');

      jest.advanceTimersByTime(500);

      // Click refresh
      const refreshButton = screen.getByLabelText(/refresh/i);
      await user.click(refreshButton);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockScopeService.getScopes).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 0,
            filter: {},
          })
        );
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Empty State', () => {
    it.skip('displays message when no scopes found', async () => {
      mockScopeService.getScopes.mockResolvedValueOnce({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 25,
        number: 0,
        first: true,
        last: true,
      });

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/No scopes found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it.skip('retries loading after error', async () => {
      const user = userEvent.setup({ delay: null });
      mockScopeService.getScopes
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockScopePageResponse);

      renderWithProviders(<ScopeManagement />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      await user.click(refreshButton);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('read:users')).toBeInTheDocument();
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
      });
    });
  });
});
