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
import { authService } from '../services/auth.service';

jest.mock('../services/auth.service', () => ({
  authService: {
    getStoredRefreshToken: jest.fn(),
    refreshToken: jest.fn(),
    clearStoredTokens: jest.fn(),
    isTokenExpired: jest.fn(),
    getStoredToken: jest.fn(),
  },
}));

// Import after mocks are set up
import { handleTokenRefresh, shouldRefreshToken, getValidToken } from './tokenManager';

const mockAuth = authService as jest.Mocked<typeof authService>;

describe('tokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── shouldRefreshToken ────────────────────────────────────────────────────

  describe('shouldRefreshToken', () => {
    it('returns true when the token is expired', () => {
      mockAuth.isTokenExpired.mockReturnValue(true);
      expect(shouldRefreshToken()).toBe(true);
    });

    it('returns false when the token is valid', () => {
      mockAuth.isTokenExpired.mockReturnValue(false);
      expect(shouldRefreshToken()).toBe(false);
    });
  });

  // ─── handleTokenRefresh ────────────────────────────────────────────────────

  describe('handleTokenRefresh', () => {
    it('returns null when no refresh token is stored', async () => {
      mockAuth.getStoredRefreshToken.mockReturnValue(null);
      const result = await handleTokenRefresh();
      expect(result).toBeNull();
      expect(mockAuth.refreshToken).not.toHaveBeenCalled();
    });

    it('refreshes successfully and returns the new access token', async () => {
      mockAuth.getStoredRefreshToken.mockReturnValue('refresh-token-abc');
      mockAuth.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      const result = await handleTokenRefresh();
      expect(result).toBe('new-access-token');
      expect(mockAuth.refreshToken).toHaveBeenCalledWith('refresh-token-abc');
    });

    it('clears tokens and redirects to /login when refresh fails', async () => {
      // Make window.location.href writable for the test
      const hrefSetter = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, set href(v: string) { hrefSetter(v); } },
        configurable: true,
      });

      mockAuth.getStoredRefreshToken.mockReturnValue('refresh-token-abc');
      mockAuth.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const result = await handleTokenRefresh();

      expect(result).toBeNull();
      expect(mockAuth.clearStoredTokens).toHaveBeenCalled();
      expect(hrefSetter).toHaveBeenCalledWith('/login');
    });
  });

  // ─── getValidToken ─────────────────────────────────────────────────────────

  describe('getValidToken', () => {
    it('returns null when no access token is stored', async () => {
      mockAuth.getStoredToken.mockReturnValue(null);
      const result = await getValidToken();
      expect(result).toBeNull();
    });

    it('returns the current token directly when it is not expired', async () => {
      mockAuth.getStoredToken.mockReturnValue('valid-token');
      mockAuth.isTokenExpired.mockReturnValue(false);
      const result = await getValidToken();
      expect(result).toBe('valid-token');
      expect(mockAuth.refreshToken).not.toHaveBeenCalled();
    });

    it('refreshes and returns new token when the current one is expired', async () => {
      mockAuth.getStoredToken.mockReturnValue('expired-token');
      mockAuth.isTokenExpired.mockReturnValue(true);
      mockAuth.getStoredRefreshToken.mockReturnValue('refresh-abc');
      mockAuth.refreshToken.mockResolvedValue({
        accessToken: 'refreshed-token',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      const result = await getValidToken();
      expect(result).toBe('refreshed-token');
    });

    it('returns null when expired and refresh also fails', async () => {
      mockAuth.getStoredToken.mockReturnValue('expired-token');
      mockAuth.isTokenExpired.mockReturnValue(true);
      mockAuth.getStoredRefreshToken.mockReturnValue(null); // no refresh token
      const result = await getValidToken();
      expect(result).toBeNull();
    });
  });

  // ─── Concurrent refresh queue ───────────────────────────────────────────

  describe('concurrent refresh handling', () => {
    it('queues a second caller and resolves it with the same token', async () => {
      // Use a controlled promise so the first refresh does not immediately resolve
      let resolveRefresh!: (value: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string }) => void;
      const pendingRefresh = new Promise<{ accessToken: string; refreshToken: string; expiresIn: number; tokenType: string }>(
        (resolve) => { resolveRefresh = resolve; }
      );

      mockAuth.getStoredRefreshToken.mockReturnValue('rt-abc');
      mockAuth.refreshToken.mockReturnValue(pendingRefresh);

      // Start first handleTokenRefresh — sets isRefreshing=true, hangs on await
      const promise1 = handleTokenRefresh();

      // Start second call immediately — isRefreshing is already true
      const promise2 = handleTokenRefresh();

      // Now make the pending refresh complete
      resolveRefresh({
        accessToken: 'shared-new-token',
        refreshToken: 'new-rt',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('shared-new-token');
      expect(result2).toBe('shared-new-token');
      // Only one actual network call was made
      expect(mockAuth.refreshToken).toHaveBeenCalledTimes(1);
    });
  });
});
