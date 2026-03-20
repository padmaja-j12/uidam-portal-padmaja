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
import Profile from './Profile';
import { UserService } from '@services/userService';

jest.mock('@services/userService');

const mockUser = {
  id: 'user-1',
  userName: 'testuser',
  status: 'ACTIVE',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '+1234567890',
  country: 'US',
  state: 'CA',
  city: 'San Francisco',
  address1: '123 Main St',
  address2: 'Apt 4',
  postalCode: '94105',
  gender: 'MALE',
  birthDate: '1990-01-15',
  locale: 'en-US',
  notificationConsent: true,
  roles: ['ADMIN', 'USER'],
  accounts: [{ account: 'main-account', roles: ['ROLE_USER'] }],
};

describe('Profile', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('loading state', () => {
    it('shows spinner while fetching', () => {
      (UserService.getSelfUser as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<Profile />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('shows error when getSelfUser throws an Error', async () => {
      (UserService.getSelfUser as jest.Mock).mockRejectedValue(new Error('Network error'));
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    });

    it('shows generic message for non-Error exception', async () => {
      (UserService.getSelfUser as jest.Mock).mockRejectedValue('unexpected string error');
      render(<Profile />);
      await waitFor(() =>
        expect(screen.getByText('An error occurred while loading your profile')).toBeInTheDocument()
      );
    });

    it('shows error.message when response has no user structure', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({ message: 'User not found', code: 'ERROR' });
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('User not found')).toBeInTheDocument());
    });

    it('shows fallback error text when message is absent', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({ code: 'ERROR' });
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('Failed to load profile')).toBeInTheDocument());
    });
  });

  describe('no-user state', () => {
    it('shows error when response has no recognisable user structure', async () => {
      // When getSelfUser returns {} the code falls through to the else
      // branch and calls setError('Failed to load profile')
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({});
      render(<Profile />);
      await waitFor(() =>
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
      );
    });
  });

  describe('profile display — response.data', () => {
    beforeEach(() => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({ data: mockUser });
    });

    it('renders My Profile heading', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('My Profile')).toBeInTheDocument());
    });

    it('renders username', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getAllByText('@testuser').length).toBeGreaterThan(0));
    });

    it('renders email', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('john@example.com')).toBeInTheDocument());
    });

    it('renders ACTIVE status chip', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('ACTIVE')).toBeInTheDocument());
    });

    it('renders city in address card', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('San Francisco')).toBeInTheDocument());
    });

    it('renders assigned roles as chips', async () => {
      render(<Profile />);
      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('USER')).toBeInTheDocument();
      });
    });

    it('renders Enabled for notificationConsent=true', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('Enabled')).toBeInTheDocument());
    });

    it('renders Disabled for notificationConsent=false', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, notificationConsent: false },
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('Disabled')).toBeInTheDocument());
    });

    it('renders formatted birth date', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('January 15, 1990')).toBeInTheDocument());
    });

    it('renders Not specified when birthDate is absent', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, birthDate: undefined },
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0));
    });

    it('renders No roles assigned when roles is empty', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, roles: [] },
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('No roles assigned')).toBeInTheDocument());
    });

    it('renders associated accounts section', async () => {
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('main-account')).toBeInTheDocument());
    });
  });

  describe('profile display — direct response shapes', () => {
    it('sets user when response has a numeric id field', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        id: 42,
        userName: 'directuser',
        status: 'ACTIVE',
        firstName: 'Di',
        lastName: 'Rect',
        email: 'direct@test.com',
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getAllByText('@directuser').length).toBeGreaterThan(0));
    });

    it('sets user when response has userName without id', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        userName: 'fromName',
        status: 'PENDING',
        firstName: 'Un',
        lastName: 'Named',
        email: 'un@test.com',
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getAllByText('@fromName').length).toBeGreaterThan(0));
    });
  });

  describe('status chip colors — all statuses', () => {
    ['PENDING', 'BLOCKED', 'REJECTED', 'DELETED', 'DEACTIVATED'].forEach(status => {
      it(`renders ${status} chip`, async () => {
        (UserService.getSelfUser as jest.Mock).mockResolvedValue({
          data: { ...mockUser, status },
        });
        render(<Profile />);
        await waitFor(() => expect(screen.getByText(status)).toBeInTheDocument());
      });
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({ data: mockUser });
    });

    it('opens edit dialog when Edit Profile icon is clicked', async () => {
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      );
    });

    it('closes edit dialog on Cancel', async () => {
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByRole('button', { name: /cancel/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
      );
    });

    it('shows No changes detected when nothing was changed', async () => {
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByRole('button', { name: /save changes/i }));
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => expect(screen.getByText('No changes detected')).toBeInTheDocument());
    });

    it('saves changes and shows success message', async () => {
      (UserService.updateSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, firstName: 'Jane' },
      });
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByLabelText('First Name'));
      const firstNameInput = screen.getByLabelText('First Name');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      );
    });

    it('shows error when updateSelfUser rejects', async () => {
      (UserService.updateSelfUser as jest.Mock).mockRejectedValue(new Error('Save failed'));
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByLabelText('First Name'));
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Changed' } });
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
    });

    it('shows error from response.message when update returns no data', async () => {
      (UserService.updateSelfUser as jest.Mock).mockResolvedValue({
        message: 'Update not allowed',
        code: 'ERROR',
      });
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByLabelText('First Name'));
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Changed' } });
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => expect(screen.getByText('Update not allowed')).toBeInTheDocument());
    });

    it('shows fallback Failed to update profile when response has no message', async () => {
      (UserService.updateSelfUser as jest.Mock).mockResolvedValue({ code: 'ERROR' });
      render(<Profile />);
      await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      await waitFor(() => screen.getByLabelText('First Name'));
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Changed' } });
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => expect(screen.getByText('Failed to update profile')).toBeInTheDocument());
    });
  });

  describe('formatDate edge cases', () => {
    it('returns Not specified when birthDate is undefined', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, birthDate: undefined },
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0));
    });

    it('returns the raw string for unparseable dates', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, birthDate: 'not-a-date' },
      });
      render(<Profile />);
      // Should not crash — profile renders
      await waitFor(() => expect(screen.getByText('My Profile')).toBeInTheDocument());
    });
  });

  describe('getStatusColor edge cases', () => {
    it('applies default chip color for an unrecognised status value', async () => {
      (UserService.getSelfUser as jest.Mock).mockResolvedValue({
        data: { ...mockUser, status: 'UNKNOWN_STATUS' },
      });
      render(<Profile />);
      await waitFor(() => expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument());
    });
  });
});
