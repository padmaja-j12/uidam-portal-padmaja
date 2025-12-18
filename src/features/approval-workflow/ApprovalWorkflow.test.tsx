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
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ApprovalWorkflow from './ApprovalWorkflow';

// Mock the UserApproval component
jest.mock('../user-approval', () => ({
  UserApproval: () => <div data-testid="user-approval">User Approval Component</div>,
}));

describe('ApprovalWorkflow', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders ApprovalWorkflow component', () => {
    renderWithRouter(<ApprovalWorkflow />);
    expect(screen.getByTestId('user-approval')).toBeInTheDocument();
  });

  it('renders UserApproval component', () => {
    renderWithRouter(<ApprovalWorkflow />);
    expect(screen.getByText('User Approval Component')).toBeInTheDocument();
  });

  it('passes through to UserApproval', () => {
    const { container } = renderWithRouter(<ApprovalWorkflow />);
    expect(container.querySelector('[data-testid="user-approval"]')).toBeInTheDocument();
  });
});
