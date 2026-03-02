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
import ActiveSessionsManagement from './ActiveSessionsManagement';
import { SessionService } from '@services/sessionService';
import { ActiveSession } from '@/types';

jest.mock('@services/sessionService');

const mockSessions: ActiveSession[] = [
  {
    sessionId: 'session-1',
    deviceInfo: 'Chrome on Windows',
    browser: 'Chrome 120',
    os: 'Windows 11',
    ipAddress: '192.168.1.1',
    location: 'New York, USA',
    loginTime: '2026-02-19T10:00:00Z',
    lastActivity: '2026-02-19T11:00:00Z',
    isCurrent: true,
  },
  {
    sessionId: 'session-2',
    deviceInfo: 'Safari on iPhone',
    browser: 'Safari 17',
    os: 'iOS 17',
    ipAddress: '192.168.1.2',
    location: 'San Francisco, USA',
    loginTime: '2026-02-19T09:00:00Z',
    lastActivity: '2026-02-19T10:30:00Z',
    isCurrent: false,
  },
];

describe('ActiveSessionsManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render active sessions', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });
  });

  it('should show current session badge', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Current Session')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (SessionService.getActiveSessions as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ActiveSessionsManagement />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should open confirmation dialog when terminating a session', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /terminate this session/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Terminate Session?')).toBeInTheDocument();
    });
  });

  it('should terminate a session when confirmed', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    (SessionService.terminateSessions as jest.Mock).mockResolvedValue(undefined);

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /terminate this session/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Terminate Session?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: 'Terminate' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(SessionService.terminateSessions).toHaveBeenCalledWith(['session-2']);
      expect(screen.getByText('Session terminated successfully')).toBeInTheDocument();
    });
  });

  it('should open confirmation dialog for terminating all sessions', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const terminateAllButton = screen.getByRole('button', {
      name: 'Terminate All Other Sessions',
    });
    fireEvent.click(terminateAllButton);

    await waitFor(() => {
      expect(screen.getByText('Terminate All Other Sessions?')).toBeInTheDocument();
    });
  });

  it('should terminate all other sessions when confirmed', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    (SessionService.terminateSessions as jest.Mock).mockResolvedValue(undefined);

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const terminateAllButton = screen.getByRole('button', {
      name: 'Terminate All Other Sessions',
    });
    fireEvent.click(terminateAllButton);

    await waitFor(() => {
      expect(screen.getByText('Terminate All Other Sessions?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: 'Terminate' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(SessionService.terminateSessions).toHaveBeenCalledWith(['session-2']);
      expect(screen.getByText('All other sessions terminated successfully')).toBeInTheDocument();
    });
  });

  it('should refresh sessions periodically', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(SessionService.getActiveSessions).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(SessionService.getActiveSessions).toHaveBeenCalledTimes(2);
    });
  });

  it('should manually refresh sessions when refresh button is clicked', async () => {
    (SessionService.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });

    render(<ActiveSessionsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(SessionService.getActiveSessions).toHaveBeenCalledTimes(2);
    });
  });
});
