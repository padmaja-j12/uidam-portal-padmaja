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
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { authService } from '@services/auth.service';
import { loginSuccess, loginFailure } from '@store/slices/authSlice';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        console.log('AuthCallback - URL params:', {
          code: code ? 'present' : 'missing',
          state: state ? 'present' : 'missing',
          error: errorParam,
          errorDescription: searchParams.get('error_description'),
          fullUrl: window.location.href,
          timestamp: new Date().toISOString(),
          codeLength: code?.length ?? 0
        });

        if (errorParam) {
          const errorDescription = searchParams.get('error_description') ?? 'Authorization failed';
          console.error('OAuth2 error from server:', errorParam, errorDescription);
          throw new Error(errorDescription);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        console.log('Starting OAuth2 callback handling...');
        // Handle the OAuth2 callback
        const authResult = await authService.handleAuthCallback(code, state);
        
        console.log('OAuth2 callback successful:', authResult.user);
        dispatch(loginSuccess(authResult));
        navigate('/dashboard');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        console.error('AuthCallback error:', err);
        setError(errorMessage);
        dispatch(loginFailure(errorMessage));
        
        // Redirect to login after 5 seconds for debugging
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, dispatch, navigate]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 2,
        }}
      >
        <Box textAlign="center" maxWidth={400}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" gutterBottom>
              Authentication Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          <Typography variant="body2" color="white">
            Redirecting to login page...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Box textAlign="center">
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white" gutterBottom>
          Completing Authentication...
        </Typography>
        <Typography variant="body2" color="white">
          Please wait while we verify your credentials.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallback;
