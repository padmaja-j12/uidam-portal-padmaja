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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientModalWrapper } from './ClientModalWrapper';

describe('ClientModalWrapper Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    error: null,
    validationErrors: [],
    loading: false,
    primaryButtonLabel: 'Save',
    onPrimaryAction: jest.fn(),
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders modal with title and content', () => {
      render(<ClientModalWrapper {...defaultProps} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders primary and cancel buttons', () => {
      render(<ClientModalWrapper {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<ClientModalWrapper {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      render(
        <ClientModalWrapper
          {...defaultProps}
          error="Something went wrong"
        />
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('does not display error alert when error is null', () => {
      render(<ClientModalWrapper {...defaultProps} error={null} />);
      
      const alerts = screen.queryAllByRole('alert');
      expect(alerts).toHaveLength(0);
    });

    it('displays validation errors when provided', () => {
      const validationErrors = [
        'Email is required',
        'Name must be at least 3 characters',
      ];

      render(
        <ClientModalWrapper
          {...defaultProps}
          validationErrors={validationErrors}
        />
      );
      
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });

    it('does not display validation errors when array is empty', () => {
      render(<ClientModalWrapper {...defaultProps} validationErrors={[]} />);
      
      expect(screen.queryByText('Please fix the following errors:')).not.toBeInTheDocument();
    });

    it('displays both error and validation errors simultaneously', () => {
      render(
        <ClientModalWrapper
          {...defaultProps}
          error="Server error"
          validationErrors={['Field is required']}
        />
      );
      
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onClose when Cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ClientModalWrapper {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onPrimaryAction when primary button is clicked', () => {
      const onPrimaryAction = jest.fn();
      render(<ClientModalWrapper {...defaultProps} onPrimaryAction={onPrimaryAction} />);
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);
      
      expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when loading is true', () => {
      render(<ClientModalWrapper {...defaultProps} loading={true} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const saveButton = screen.getByRole('button', { name: 'Save' });
      
      expect(cancelButton).toBeDisabled();
      expect(saveButton).toBeDisabled();
    });

    it('enables buttons when loading is false', () => {
      render(<ClientModalWrapper {...defaultProps} loading={false} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const saveButton = screen.getByRole('button', { name: 'Save' });
      
      expect(cancelButton).not.toBeDisabled();
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Custom Labels', () => {
    it('renders custom primary button label', () => {
      render(
        <ClientModalWrapper
          {...defaultProps}
          primaryButtonLabel="Create Client"
        />
      );
      
      expect(screen.getByRole('button', { name: 'Create Client' })).toBeInTheDocument();
    });

    it('renders different modal titles', () => {
      const { rerender } = render(<ClientModalWrapper {...defaultProps} title="Create Client" />);
      expect(screen.getByText('Create Client')).toBeInTheDocument();
      
      rerender(<ClientModalWrapper {...defaultProps} title="Edit Client" />);
      expect(screen.getByText('Edit Client')).toBeInTheDocument();
    });
  });

  describe('Validation Error Keys', () => {
    it('renders multiple validation errors correctly', () => {
      const validationErrors = [
        'Error message one',
        'Error message two',
        'Error message three',
      ];

      render(
        <ClientModalWrapper
          {...defaultProps}
          validationErrors={validationErrors}
        />
      );
      
      expect(screen.getByText('Error message one')).toBeInTheDocument();
      expect(screen.getByText('Error message two')).toBeInTheDocument();
      expect(screen.getByText('Error message three')).toBeInTheDocument();
    });
  });
});
