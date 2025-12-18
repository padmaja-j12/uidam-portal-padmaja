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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
} from '@mui/material';

interface ClientModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  error: string | null;
  validationErrors: string[];
  loading: boolean;
  children: React.ReactNode;
  primaryButtonLabel: string;
  onPrimaryAction: () => void;
}

/**
 * Shared wrapper component for client modals
 * Eliminates Dialog structure duplication between Create and Edit modals
 */
export const ClientModalWrapper: React.FC<ClientModalWrapperProps> = ({
  open,
  onClose,
  title,
  error,
  validationErrors,
  loading,
  children,
  primaryButtonLabel,
  onPrimaryAction
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {validationErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={`error-${index}-${error.substring(0, 20)}`}>
                  {error}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        
        {children}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onPrimaryAction}
          variant="contained"
          disabled={loading}
        >
          {primaryButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
