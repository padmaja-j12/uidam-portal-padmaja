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
import userEvent from '@testing-library/user-event';
import Assistant from './Assistant';
import { assistantService } from '@services/assistant.service';

jest.mock('@services/assistant.service');

// Mock scrollIntoView since jsdom doesn't implement it
Element.prototype.scrollIntoView = jest.fn();

describe('Assistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (assistantService.startSession as jest.Mock).mockResolvedValue({ sessionId: 'test-session-123' });
    (assistantService.sendMessage as jest.Mock).mockResolvedValue('This is a response from the assistant');
    (assistantService.endSession as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders assistant title', () => {
    render(<Assistant />);
    expect(screen.getByText('UIDAM Assistant')).toBeInTheDocument();
  });

  it('displays welcome message on mount', () => {
    render(<Assistant />);
    expect(screen.getByText(/Welcome to UIDAM Assistant/i)).toBeInTheDocument();
  });

  it('starts session on mount', async () => {
    render(<Assistant />);
    await waitFor(() => {
      expect(assistantService.startSession).toHaveBeenCalled();
    });
  });

  it('displays input field', () => {
    render(<Assistant />);
    expect(screen.getByPlaceholderText(/Ask me about UIDAM operations/i)).toBeInTheDocument();
  });

  it('displays send button', () => {
    render(<Assistant />);
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<Assistant />);
    
    const input = screen.getByPlaceholderText(/Ask me about UIDAM operations/i);
    await user.type(input, 'Hello assistant');
    
    expect(input).toHaveValue('Hello assistant');
  });

  it('disables send button when input is empty', () => {
    render(<Assistant />);
    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });
});
