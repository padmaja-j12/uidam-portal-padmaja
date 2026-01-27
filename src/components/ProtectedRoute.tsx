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
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { shouldRefreshToken, handleTokenRefresh } from '@/utils/tokenManager';
import { loginSuccess } from '@/store/slices/authSlice';
import { OAUTH_CONFIG } from '@/config/app.config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // If already authenticated, no need to check
      if (isAuthenticated) {
        setIsChecking(false);
        return;
      }

      // Check if there's a token in localStorage
      const token = localStorage.getItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
      const refreshToken = localStorage.getItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);

      if (!token || !refreshToken) {
        // No tokens at all, redirect to login
        setShouldRedirect(true);
        setIsChecking(false);
        return;
      }

      // Check if token needs refresh
      if (shouldRefreshToken()) {
        console.log('ProtectedRoute: Token expired/expiring, attempting refresh...');
        try {
          const newToken = await handleTokenRefresh();
          if (newToken) {
            console.log('ProtectedRoute: Token refreshed successfully');
            
            // Update Redux state with refreshed token
            const userProfile = localStorage.getItem('uidam_user_profile');
            const newRefreshToken = localStorage.getItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
            const expiresAt = localStorage.getItem('uidam_token_expires_at');
            
            if (userProfile && newRefreshToken && expiresAt) {
              dispatch(loginSuccess({
                user: JSON.parse(userProfile),
                tokens: {
                  accessToken: newToken,
                  refreshToken: newRefreshToken,
                  expiresIn: Math.floor((parseInt(expiresAt) - Date.now()) / 1000),
                  tokenType: 'Bearer',
                },
              }));
              setIsChecking(false);
              return;
            }
          }
          
          // Token refresh failed
          console.warn('ProtectedRoute: Token refresh failed');
          setShouldRedirect(true);
        } catch (error) {
          console.error('ProtectedRoute: Error refreshing token:', error);
          setShouldRedirect(true);
        }
      } else {
        // Token exists and is valid, but Redux state not initialized
        // This can happen if page was refreshed
        const userProfile = localStorage.getItem('uidam_user_profile');
        const expiresAt = localStorage.getItem('uidam_token_expires_at');
        
        if (userProfile && expiresAt) {
          dispatch(loginSuccess({
            user: JSON.parse(userProfile),
            tokens: {
              accessToken: token,
              refreshToken: refreshToken,
              expiresIn: Math.floor((parseInt(expiresAt) - Date.now()) / 1000),
              tokenType: 'Bearer',
            },
          }));
        }
      }

      setIsChecking(false);
    };

    checkAndRefreshToken();
  }, [isAuthenticated, dispatch]);

  // Show loading while checking token
  if (isChecking) {
    return <div>Loading...</div>;
  }

  // Redirect to login if needed
  if (shouldRedirect || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
