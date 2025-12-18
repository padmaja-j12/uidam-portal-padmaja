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
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRoles } from './useRoles';
import { RoleService } from '@/services/role.service';

// Mock the RoleService
jest.mock('@/services/role.service');

describe('useRoles', () => {
  const mockRoles = [
    { id: '1', name: 'Admin', description: 'Administrator role', scopes: ['read', 'write'] },
    { id: '2', name: 'User', description: 'Standard user role', scopes: ['read'] },
  ];

  const mockRoleService = {
    getRoles: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (RoleService as jest.MockedClass<typeof RoleService>).mockImplementation(() => mockRoleService as unknown as RoleService);
  });

  it('should initialize with empty roles and not loading when shouldLoad is false', () => {
    const { result } = renderHook(() => useRoles(false));

    expect(result.current.roles).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch roles when shouldLoad is true', async () => {
    mockRoleService.getRoles.mockResolvedValue({
      content: mockRoles,
      totalElements: 2,
      totalPages: 1,
    });

    const { result } = renderHook(() => useRoles(true));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.error).toBeNull();
    expect(mockRoleService.getRoles).toHaveBeenCalledWith({
      page: 0,
      size: 100,
      filter: {},
    });
  });

  it('should handle error when fetching roles fails', async () => {
    const error = new Error('Failed to fetch roles');
    mockRoleService.getRoles.mockRejectedValue(error);

    const { result } = renderHook(() => useRoles(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch roles');
    expect(result.current.roles).toEqual([]);
  });

  it('should handle non-Error object when fetching fails', async () => {
    mockRoleService.getRoles.mockRejectedValue('String error');

    const { result } = renderHook(() => useRoles(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load roles');
    expect(result.current.roles).toEqual([]);
  });

  it('should handle response without content', async () => {
    mockRoleService.getRoles.mockResolvedValue({});

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { result } = renderHook(() => useRoles(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith('No roles found or unexpected response format');
    
    consoleWarnSpy.mockRestore();
  });

  it('should refetch roles when refetch is called', async () => {
    mockRoleService.getRoles.mockResolvedValue({
      content: mockRoles,
      totalElements: 2,
      totalPages: 1,
    });

    const { result } = renderHook(() => useRoles(false));

    expect(result.current.roles).toEqual([]);

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
    expect(mockRoleService.getRoles).toHaveBeenCalledTimes(1);
  });

  it('should fetch roles when shouldLoad changes from false to true', async () => {
    mockRoleService.getRoles.mockResolvedValue({
      content: mockRoles,
      totalElements: 2,
      totalPages: 1,
    });

    const { result, rerender } = renderHook(
      ({ shouldLoad }) => useRoles(shouldLoad),
      { initialProps: { shouldLoad: false } }
    );

    expect(result.current.roles).toEqual([]);
    expect(mockRoleService.getRoles).not.toHaveBeenCalled();

    // Change shouldLoad to true
    rerender({ shouldLoad: true });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
    expect(mockRoleService.getRoles).toHaveBeenCalledTimes(1);
  });

  it('should not fetch roles again when shouldLoad remains true', async () => {
    mockRoleService.getRoles.mockResolvedValue({
      content: mockRoles,
      totalElements: 2,
      totalPages: 1,
    });

    const { result, rerender } = renderHook(
      ({ shouldLoad }) => useRoles(shouldLoad),
      { initialProps: { shouldLoad: true } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockRoleService.getRoles).toHaveBeenCalledTimes(1);

    // Rerender with same shouldLoad value
    rerender({ shouldLoad: true });

    // Should not call getRoles again
    expect(mockRoleService.getRoles).toHaveBeenCalledTimes(1);
  });

  it('should clear error on successful refetch', async () => {
    mockRoleService.getRoles
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({
        content: mockRoles,
        totalElements: 2,
        totalPages: 1,
      });

    const { result } = renderHook(() => useRoles(true));

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.roles).toEqual(mockRoles);
  });
});
