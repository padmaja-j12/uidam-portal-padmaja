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
import AdminSessionsModal from './AdminSessionsModal';
import { SessionService } from '@services/sessionService';
import { ActiveSession } from '@/types';

jest.mock('@services/sessionService');

const mockSessions: ActiveSession[] = [
  {
    sessionId: 'session-1',
    deviceInfo: 'Chrome on Windows',
    browser: 'Chrome 120',
    os: 'Windows 11',
    loginTime: '2026-03-20T05:34:56Z',
    lastActivity: '2026-03-20T06:34:56Z',
    isCurrent: true,
  },
  {
    sessionId: 'session-2',
    deviceInfo: 'Edge on Windows',
    browser: 'Edge 120',
    os: 'Windows 11',
    loginTime: '2026-03-20T05:37:19Z',
    lastActivity: '2026-03-20T06:37:19Z',
    isCurrent: false,
  },
];

describe('AdminSessionsModal', () => {
  const defaultProps = {
    open: true,
    username: 'testuser',
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('does not fetch when modal is closed', () => {
    render(<AdminSessionsModal open={false} username="testuser" onClose={jest.fn()} />);
    expect(SessionService.getAdminActiveSessions).not.toHaveBeenCalled();
  });

  it('does not fetch when username is null', () => {
    render(<AdminSessionsModal open={true} username={null} onClose={jest.fn()} />);
    expect(SessionService.getAdminActiveSessions).not.toHaveBeenCalled();
  });

  it('shows loading spinner while fetching', () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    render(<AdminSessionsModal {...defaultProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays username in dialog title', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: [],
      totalCount: 0,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText('Active Sessions — testuser')).toBeInTheDocument()
    );
  });

  it('displays sessions when fetched successfully', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      expect(screen.getByText('Edge on Windows')).toBeInTheDocument();
    });
  });

  it('shows Current chip for the current session', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Current')).toBeInTheDocument());
  });

  it('shows no sessions message when list is empty', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: [],
      totalCount: 0,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText(/No active sessions found for/i)).toBeInTheDocument()
    );
  });

  it('shows error alert when fetch fails', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockRejectedValue(
      new Error('Fetch failed')
    );
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Fetch failed')).toBeInTheDocument());
  });

  it('shows generic error message for non-Error exception', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockRejectedValue('oops');
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText('Failed to fetch sessions')).toBeInTheDocument()
    );
  });

  it('terminates a non-current session', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    (SessionService.terminateAdminSessions as jest.Mock).mockResolvedValue(undefined);
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Edge on Windows'));
    fireEvent.click(screen.getByRole('button', { name: /terminate this session/i }));
    await waitFor(() => {
      expect(SessionService.terminateAdminSessions).toHaveBeenCalledWith('testuser', ['session-2']);
      expect(screen.getByText('Session terminated successfully')).toBeInTheDocument();
    });
  });

  it('shows error when terminate fails', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    (SessionService.terminateAdminSessions as jest.Mock).mockRejectedValue(
      new Error('Terminate failed')
    );
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Edge on Windows'));
    fireEvent.click(screen.getByRole('button', { name: /terminate this session/i }));
    await waitFor(() => expect(screen.getByText('Terminate failed')).toBeInTheDocument());
  });

  it('calls onClose when Close button is clicked', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: [],
      totalCount: 0,
    });
    const onClose = jest.fn();
    render(<AdminSessionsModal open={true} username="testuser" onClose={onClose} />);
    await waitFor(() => screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('fetches sessions when modal opens with a username', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(SessionService.getAdminActiveSessions).toHaveBeenCalledWith('testuser')
    );
  });

  it('clears sessions and errors when modal is closed', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    const { rerender } = render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Chrome on Windows'));

    rerender(<AdminSessionsModal open={false} username="testuser" onClose={jest.fn()} />);

    // Dialog is closed — sessions content should not be visible
    await waitFor(() =>
      expect(screen.queryByText('Chrome on Windows')).not.toBeInTheDocument()
    );
  });

  it('shows browser and OS info when available', async () => {
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      totalCount: 2,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Chrome 120')).toBeInTheDocument();
      expect(screen.getAllByText('Windows 11').length).toBeGreaterThan(0);
    });
  });

  it('renders phone icon for mobile device sessions', async () => {
    const mobileSessions: ActiveSession[] = [{
      sessionId: 'mobile-session',
      deviceInfo: 'Chrome on Android mobile',
      browser: 'Chrome',
      os: 'Android',
      loginTime: '2026-03-20T05:00:00Z',
      lastActivity: '2026-03-20T06:00:00Z',
      isCurrent: false,
    }];
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mobileSessions,
      totalCount: 1,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText('Chrome on Android mobile')).toBeInTheDocument()
    );
  });

  it('renders tablet icon for tablet device sessions', async () => {
    const tabletSessions: ActiveSession[] = [{
      sessionId: 'tablet-session',
      deviceInfo: 'Safari on iPad tablet',
      browser: 'Safari',
      os: 'iPadOS',
      loginTime: '2026-03-20T05:00:00Z',
      lastActivity: '2026-03-20T06:00:00Z',
      isCurrent: false,
    }];
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: tabletSessions,
      totalCount: 1,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText('Safari on iPad tablet')).toBeInTheDocument()
    );
  });

  it('handles sessions with invalid datetime strings without crashing', async () => {
    const badDateSession: ActiveSession[] = [{
      sessionId: 'bad-date-session',
      deviceInfo: 'Firefox',
      loginTime: 'not-a-valid-date',
      lastActivity: 'also-invalid',
      isCurrent: false,
    }];
    (SessionService.getAdminActiveSessions as jest.Mock).mockResolvedValue({
      sessions: badDateSession,
      totalCount: 1,
    });
    render(<AdminSessionsModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText('Firefox')).toBeInTheDocument()
    );
  });
});
