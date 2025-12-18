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
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, AuthTokens } from '@/types';
import { OAUTH_CONFIG } from '@config/app.config';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initialize state from localStorage
const getInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
    const refreshToken = localStorage.getItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
    const userProfile = localStorage.getItem('uidam_user_profile');
    const expirationTime = localStorage.getItem('uidam_token_expires_at');

    if (token && refreshToken && userProfile && expirationTime) {
      // Check if token is not expired
      const isExpired = Date.now() >= parseInt(expirationTime);
      
      if (!isExpired) {
        return {
          user: JSON.parse(userProfile),
          tokens: {
            accessToken: token,
            refreshToken,
            expiresIn: Math.floor((parseInt(expirationTime) - Date.now()) / 1000),
            tokenType: 'Bearer',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
      }
    }
  } catch (error) {
    console.warn('Failed to initialize auth state from localStorage:', error);
  }

  return {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: AuthUser; tokens: AuthTokens }>) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem(OAUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(OAUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem('uidam_token_expires_at');
      localStorage.removeItem('uidam_user_profile');
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, clearError } = authSlice.actions;
