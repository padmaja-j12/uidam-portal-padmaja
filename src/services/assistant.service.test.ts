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
import { AssistantService, assistantService } from './assistant.service';
import { userManagementApi } from './api-client';

jest.mock('./api-client');

describe('AssistantService', () => {
  let service: AssistantService;
  const mockedApi = userManagementApi as jest.Mocked<typeof userManagementApi>;

  beforeEach(() => {
    service = new AssistantService();
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should start a new session and return session ID', async () => {
      const mockResponse = { sessionId: 'session-123' };
      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await service.startSession();

      expect(result).toEqual(mockResponse);
      expect(mockedApi.post).toHaveBeenCalledWith('/session/start');
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    it('should handle start session errors', async () => {
      const mockError = new Error('Failed to start session');
      mockedApi.post.mockRejectedValueOnce(mockError);

      await expect(service.startSession()).rejects.toThrow('Failed to start session');
      expect(mockedApi.post).toHaveBeenCalledWith('/session/start');
    });

    it('should return different session IDs for multiple calls', async () => {
      mockedApi.post
        .mockResolvedValueOnce({ sessionId: 'session-1' })
        .mockResolvedValueOnce({ sessionId: 'session-2' });

      const result1 = await service.startSession();
      const result2 = await service.startSession();

      expect(result1.sessionId).toBe('session-1');
      expect(result2.sessionId).toBe('session-2');
      expect(mockedApi.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const mockResponse = 'Session ended successfully';
      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await service.endSession();

      expect(result).toBe(mockResponse);
      expect(mockedApi.post).toHaveBeenCalledWith('/session/end');
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    it('should handle end session errors', async () => {
      const mockError = new Error('Failed to end session');
      mockedApi.post.mockRejectedValueOnce(mockError);

      await expect(service.endSession()).rejects.toThrow('Failed to end session');
      expect(mockedApi.post).toHaveBeenCalledWith('/session/end');
    });

    it('should return success message on session termination', async () => {
      mockedApi.post.mockResolvedValueOnce('Session terminated');

      const result = await service.endSession();

      expect(result).toBe('Session terminated');
    });
  });

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      const message = 'Hello, assistant!';
      const mockResponse = 'Hello! How can I help you?';
      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await service.sendMessage(message);

      expect(result).toBe(mockResponse);
      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message });
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    it('should handle send message errors', async () => {
      const message = 'Test message';
      const mockError = new Error('Network error');
      mockedApi.post.mockRejectedValueOnce(mockError);

      await expect(service.sendMessage(message)).rejects.toThrow('Network error');
      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message });
    });

    it('should send message with correct payload structure', async () => {
      const message = 'What is my account status?';
      mockedApi.post.mockResolvedValueOnce('Your account is active');

      await service.sendMessage(message);

      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message: message });
    });

    it('should handle empty message', async () => {
      const message = '';
      mockedApi.post.mockResolvedValueOnce('Please provide a message');

      const result = await service.sendMessage(message);

      expect(result).toBe('Please provide a message');
      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message: '' });
    });

    it('should handle long messages', async () => {
      const longMessage = 'a'.repeat(1000);
      mockedApi.post.mockResolvedValueOnce('Message received');

      const result = await service.sendMessage(longMessage);

      expect(result).toBe('Message received');
      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message: longMessage });
    });

    it('should handle special characters in message', async () => {
      const message = 'Test with special chars: @#$%^&*()';
      mockedApi.post.mockResolvedValueOnce('Response');

      await service.sendMessage(message);

      expect(mockedApi.post).toHaveBeenCalledWith('/chat', { message });
    });
  });

  describe('Service Instance', () => {
    it('should export a singleton instance', () => {
      expect(assistantService).toBeInstanceOf(AssistantService);
    });

    it('should allow creating new instances', () => {
      const newService = new AssistantService();
      expect(newService).toBeInstanceOf(AssistantService);
      expect(newService).not.toBe(assistantService);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete conversation flow', async () => {
      mockedApi.post
        .mockResolvedValueOnce({ sessionId: 'session-123' })
        .mockResolvedValueOnce('How can I help?')
        .mockResolvedValueOnce('Your query has been processed')
        .mockResolvedValueOnce('Session ended');

      const sessionResponse = await service.startSession();
      expect(sessionResponse.sessionId).toBe('session-123');

      const response1 = await service.sendMessage('First question');
      expect(response1).toBe('How can I help?');

      const response2 = await service.sendMessage('Second question');
      expect(response2).toBe('Your query has been processed');

      const endResponse = await service.endSession();
      expect(endResponse).toBe('Session ended');

      expect(mockedApi.post).toHaveBeenCalledTimes(4);
    });

    it('should handle rapid consecutive messages', async () => {
      mockedApi.post
        .mockResolvedValueOnce('Response 1')
        .mockResolvedValueOnce('Response 2')
        .mockResolvedValueOnce('Response 3');

      const results = await Promise.all([
        service.sendMessage('Message 1'),
        service.sendMessage('Message 2'),
        service.sendMessage('Message 3'),
      ]);

      expect(results).toEqual(['Response 1', 'Response 2', 'Response 3']);
      expect(mockedApi.post).toHaveBeenCalledTimes(3);
    });
  });
});
