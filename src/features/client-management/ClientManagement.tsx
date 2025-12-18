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
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  FileCopy as CopyIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell, StyledTableRow } from '../../components/shared/StyledTableComponents';
import { ClientRegistrationService } from '../../services/clientRegistrationService';
import { ClientListItem, CLIENT_STATUS } from '../../types/client';
import { CreateClientModal } from './components/CreateClientModal';
import { EditClientModal } from './components/EditClientModal';
import { ViewClientModal } from './components/ViewClientModal';
import { logger } from '../../utils/logger';

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuClient, setMenuClient] = useState<ClientListItem | null>(null);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientListItem | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadClients = async () => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms to show loader
    
    try {
      setLoading(true);
      setError(null);
      const clientList = await ClientRegistrationService.getClients();
      setClients(clientList);
      
      // Show info message if no clients and it's likely due to missing backend endpoint
      if (clientList.length === 0) {
        console.info('No clients loaded - this may be due to missing backend list endpoint');
      }
    } catch (err: unknown) {
      logger.error('Failed to load clients:', err);
      setError('Failed to load OAuth2 clients. Please try again.');
    } finally {
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case CLIENT_STATUS.APPROVED:
        return 'success';
      case CLIENT_STATUS.PENDING:
        return 'warning';
      case CLIENT_STATUS.REJECTED:
        return 'error';
      case CLIENT_STATUS.SUSPENDED:
        return 'error';
      case CLIENT_STATUS.DELETED:
        return 'default';
      default:
        return 'default';
    }
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setCreateModalOpen(true);
  };

  const handleEditClient = (client: ClientListItem) => {
    setSelectedClient(client);
    setEditModalOpen(true);
    setAnchorEl(null);
  };

  const handleViewClient = (client: ClientListItem) => {
    setSelectedClient(client);
    setViewModalOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteClient = (client: ClientListItem) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await ClientRegistrationService.deleteClient(clientToDelete.clientId);
      setSuccessMessage(`Client "${clientToDelete.clientName}" deleted successfully`);
      await loadClients();
    } catch (err: unknown) {
      logger.error('Failed to delete client:', err);
      setError(`Failed to delete client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: ClientListItem) => {
    setAnchorEl(event.currentTarget);
    setMenuClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuClient(null);
  };

  const handleCopyClientId = (clientId: string) => {
    navigator.clipboard.writeText(clientId);
    setSuccessMessage('Client ID copied to clipboard');
    setAnchorEl(null);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setViewModalOpen(false);
    setSelectedClient(null);
  };

  const handleClientSaved = async () => {
    await loadClients();
    handleModalClose();
    // Success message will be shown by each modal
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading OAuth2 clients...</Typography>
      </Box>
    );
  }

  return (
    <ManagementLayout
      title="OAuth2 Client Management"
      subtitle="Manage registered OAuth2/OIDC application clients"
      icon={<AppsIcon />}
      onRefresh={loadClients}
      error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      success={successMessage && <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}
      headerActions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClient}
        >
            Register New Client
          </Button>
        }
      >
        {/* Client Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Client Name</StyledTableCell>
                <StyledTableCell>Client ID</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Grant Types</StyledTableCell>
                <StyledTableCell>Scopes</StyledTableCell>
                <StyledTableCell>Requested By</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          No OAuth2 clients available to display.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Note: Client listing requires backend API support. 
                          You can still register new clients using the &quot;Register New Client&quot; button.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <StyledTableRow key={client.clientId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {client.clientName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {client.clientId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.status || 'Unknown'}
                            color={getStatusColor(client.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {client.authorizationGrantTypes?.map((type: string) => (
                            <Chip
                              key={type}
                              label={type}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          {client.scopes?.slice(0, 3).map((scope: string) => (
                            <Chip
                              key={scope}
                              label={scope}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {client.scopes && client.scopes.length > 3 && (
                            <Chip
                              label={`+${client.scopes.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.requestedBy ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, client)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action Menu */}
            <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => menuClient && handleViewClient(menuClient)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => menuClient && handleEditClient(menuClient)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Client</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => menuClient && handleCopyClientId(menuClient.clientId)}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Client ID</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => menuClient && handleDeleteClient(menuClient)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Client</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the client &quot;{clientToDelete?.clientName}&quot;?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone. All applications using this client will lose access.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete Client
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Client Modal */}
        <CreateClientModal
          open={createModalOpen}
          onClose={handleModalClose}
          onSave={handleClientSaved}
          onSuccess={setSuccessMessage}
        />

        {/* Edit Client Modal */}
        <EditClientModal
          open={editModalOpen}
          onClose={handleModalClose}
          onSave={handleClientSaved}
          client={selectedClient}
          onSuccess={setSuccessMessage}
        />

        {/* View Client Modal */}
        {viewModalOpen && selectedClient && (
          <ViewClientModal
            open={viewModalOpen}
            onClose={handleModalClose}
            client={selectedClient}
          />
        )}
      </ManagementLayout>
  );
};

export default ClientManagement;
