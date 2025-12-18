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
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// ReactQueryDevtools removed - no floating debug icon needed
import { Provider } from 'react-redux';

import { store } from '@store/index';
import { useTheme } from '@hooks/useTheme';
import { getTheme } from '@/theme';
import Layout from '@components/Layout';
import ProtectedRoute from '@components/ProtectedRoute';

// Feature components (lazy loaded)
const Dashboard = React.lazy(() => import('@features/dashboard/Dashboard'));
const UserManagement = React.lazy(() => import('@features/user-management/UserManagement'));
const AccountManagement = React.lazy(() => import('@features/account-management/AccountManagement'));
const RoleManagement = React.lazy(() => import('@features/role-management/RoleManagement'));
const ScopeManagement = React.lazy(() => import('@features/scope-management/ScopeManagement'));
const ApprovalWorkflow = React.lazy(() => import('@features/approval-workflow/ApprovalWorkflow'));
const ClientManagement = React.lazy(() => import('@features/client-management/ClientManagement'));
const Assistant = React.lazy(() => import('@features/assistant/Assistant'));
const Login = React.lazy(() => import('@features/auth/Login'));
const AuthCallback = React.lazy(() => import('@features/auth/AuthCallback'));

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users/*" element={<UserManagement />} />
                      <Route path="/accounts/*" element={<AccountManagement />} />
                      <Route path="/roles/*" element={<RoleManagement />} />
                      <Route path="/scopes/*" element={<ScopeManagement />} />
                      <Route path="/approvals/*" element={<ApprovalWorkflow />} />
                      <Route path="/clients/*" element={<ClientManagement />} />
                      <Route path="/assistant" element={<Assistant />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        {/* ReactQueryDevtools removed - no floating debug icon */}
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
