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
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AccountBox as AccountBoxIcon
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell, StyledTableRow } from '../../components/shared/StyledTableComponents';
import { AccountService, Account as ServiceAccount, AccountSearchParams } from '../../services/accountService';
// Modal components
import { CreateAccountModal } from './components/CreateAccountModal';
import { EditAccountModal } from './components/EditAccountModal';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { DeleteAccountDialog } from './components/DeleteAccountDialog';

interface AccountSearchFilters {
  ids?: string[];
  accountNames?: string[];
  parentIds?: string[];
  roles?: string[];
  status?: string[];
}

export const AccountManagement: React.FC = () => {
  // State management
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [parentIdFilter, setParentIdFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('ACCOUNT_NAMES');
  const [sortOrder, setSortOrder] = useState<string>('DESC');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ServiceAccount | null>(null);

  // Load accounts on component mount and when filters change
  useEffect(() => {
    loadAccounts();
  }, [page, rowsPerPage, searchTerm, statusFilter, parentIdFilter, sortBy, sortOrder]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms to show loader

    try {
      const filters: AccountSearchFilters = {};
      
      // Apply search term to account names
      if (searchTerm.trim()) {
        filters.accountNames = [searchTerm.trim()];
      }

      // Apply status filter
      if (statusFilter) {
        filters.status = [statusFilter];
      }

      // Apply parent ID filter
      if (parentIdFilter) {
        try {
          filters.parentIds = [parentIdFilter];
        } catch (e) {
          console.warn('Invalid parent ID filter:', parentIdFilter);
        }
      }

      const filterParams: AccountSearchParams = {
        pageNumber: page,
        pageSize: rowsPerPage,
        sortBy: sortBy as AccountSearchParams['sortBy'],
        sortOrder: sortOrder as 'DESC' | 'ASC',
        ignoreCase: true,
        searchType: 'CONTAINS'
      };

      const response = await AccountService.filterAccounts(
        filters,
        filterParams
      );

      if (response.success && response.data) {
        setAccounts(response.data.content ?? []);
        setTotalCount(response.data.totalElements ?? 0);
      } else {
        throw new Error(response.error ?? 'Failed to load accounts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(errorMessage);
      console.error('Error loading accounts:', err);
    } finally {
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setCreateModalOpen(true);
  };

  const handleEditAccount = (account: ServiceAccount) => {
    setSelectedAccount(account);
    setEditModalOpen(true);
  };

  const handleViewAccount = (account: ServiceAccount) => {
    setSelectedAccount(account);
    setViewModalOpen(true);
  };

  const handleDeleteAccount = (account: ServiceAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleAccountCreated = (newAccount: ServiceAccount) => {
    setSuccessMessage(`Account "${newAccount.accountName}" created successfully`);
    setCreateModalOpen(false);
    loadAccounts();
  };

  const handleAccountUpdated = (updatedAccount: ServiceAccount) => {
    setSuccessMessage(`Account "${updatedAccount.accountName}" updated successfully`);
    setEditModalOpen(false);
    loadAccounts();
  };

  const handleAccountDeleted = (accountName: string) => {
    setSuccessMessage(`Account "${accountName}" deleted successfully`);
    setDeleteDialogOpen(false);
    loadAccounts();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setParentIdFilter('');
    setPage(0);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      case 'BLOCKED': return 'error';
      case 'DELETED': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      <ManagementLayout
        title="Account Management"
        subtitle="Manage accounts and organizational structure"
        icon={<AccountBoxIcon />}
        onRefresh={loadAccounts}
        error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      >

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Accounts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                placeholder="Enter account name..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="BLOCKED">Blocked</MenuItem>
                  <MenuItem value="DELETED">Deleted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Parent ID"
                value={parentIdFilter}
                onChange={(e) => setParentIdFilter(e.target.value)}
                placeholder="Filter by parent..."
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="ACCOUNT_NAMES">Account Name</MenuItem>
                  <MenuItem value="IDS">ID</MenuItem>
                  <MenuItem value="STATUS">Status</MenuItem>
                  <MenuItem value="PARENTIDS">Parent ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <MenuItem value="ASC">ASC</MenuItem>
                  <MenuItem value="DESC">DESC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  size="small"
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          color: 'primary.main',
          fontSize: '1.2rem'
        }}>
          Accounts ({totalCount})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAccount}
          disabled={loading}
        >
          Create Account
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}        {/* Accounts Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Account Name</StyledTableCell>
                <StyledTableCell>Parent ID</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Roles</StyledTableCell>
                <StyledTableCell>Created By</StyledTableCell>
                <StyledTableCell>Created Date</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>Loading accounts...</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No accounts found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && accounts.length > 0 && accounts.map((account) => (
                <StyledTableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {account.accountName}
                    </Typography>
                  </TableCell>
                  <TableCell>{account.parentId ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={account.status}
                      color={getStatusColor(account.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {account.roles && account.roles.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {account.roles.slice(0, 3).map((role) => (
                          <Chip key={role} label={role} size="small" variant="outlined" />
                        ))}
                        {account.roles.length > 3 && (
                          <Chip label={`+${account.roles.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{account.createdBy ?? 'N/A'}</TableCell>
                  <TableCell>{formatDate(account.createDate)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewAccount(account)}
                        title="View Details"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAccount(account)}
                        title="Edit Account"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAccount(account)}
                        title="Delete Account"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      </ManagementLayout>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Modals and Dialogs */}
      <CreateAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAccountCreated={handleAccountCreated}
      />

      <EditAccountModal
        open={editModalOpen}
        account={selectedAccount}
        onClose={() => setEditModalOpen(false)}
        onAccountUpdated={handleAccountUpdated}
      />

      <AccountDetailsModal
        open={viewModalOpen}
        account={selectedAccount}
        onClose={() => setViewModalOpen(false)}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        account={selectedAccount}
        onClose={() => setDeleteDialogOpen(false)}
        onAccountDeleted={handleAccountDeleted}
      />
    </>
  );
};

export default AccountManagement;
