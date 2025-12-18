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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  it('renders dashboard component', () => {
    const { container } = render(<Dashboard />, { wrapper: createWrapper() });
    expect(container).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays dashboard title after loading', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays stat cards after loading', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      const statCards = screen.getAllByRole('heading', { level: 4 });
      expect(statCards.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('renders grid layout', async () => {
    const { container } = render(<Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(container.querySelector('[class*="MuiGrid-container"]')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
