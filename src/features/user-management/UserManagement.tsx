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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Email as EmailIcon,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell, StyledTableRow } from '../../components/shared/StyledTableComponents';
import { User, UserService, UsersFilterV2, UserSearchParams } from '../../services/userService';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import UserDetailsModal from './components/UserDetailsModal';
import DeleteUserDialog from './components/DeleteUserDialog';
import ManageUserAccountsModal from './components/ManageUserAccountsModal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal states
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [manageAccountsModalOpen, setManageAccountsModalOpen] = useState(false);
  const [selectedUserForAccounts, setSelectedUserForAccounts] = useState<User | null>(null);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms to show loader
    
    try {
      // Build filter object
      const filter: UsersFilterV2 = {};
      
      // Add search filter if search term exists
      if (searchTerm?.trim()) {
        const search = searchTerm.trim();
        filter.userNames = [search];
      }

      const searchParams: UserSearchParams = {
        pageNumber: page,
        pageSize: rowsPerPage,
        sortBy: 'USER_NAMES',
        sortOrder: 'ASC',
        ignoreCase: true,
        searchType: 'CONTAINS',
      };

      try {
        // Call the real API
        const users = await UserService.filterUsersV2(filter, searchParams);
        
        if (Array.isArray(users)) {
          setUsers(users);
          setTotalUsers(users.length);
        } else {
          console.warn('Unexpected response format:', users);
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        setSnackbar({ 
          open: true, 
          message: `Failed to load users: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`, 
          severity: 'error' 
        });
        // Don't fall back to mock data, let user know there's an issue
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (error) {
      console.error('Error in loadUsers:', error);
      setSnackbar({ 
        open: true, 
        message: `Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        severity: 'error' 
      });
      setUsers([]);
      setTotalUsers(0);
    } finally {
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'BLOCKED':
      case 'REJECTED':
        return 'error';
      case 'DEACTIVATED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon fontSize="small" />;
      case 'PENDING':
        return <EmailIcon fontSize="small" />;
      case 'BLOCKED':
        return <BlockIcon fontSize="small" />;
      case 'REJECTED':
        return <CancelIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    console.log('Menu clicked for user:', user.userName, 'Status:', user.status);
    setSelectedUser(user);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedUser here - it's needed for the modal operations
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // User creation handlers
  const handleCreateUser = () => {
    setCreateUserModalOpen(true);
  };

  const handleCreateUserClose = () => {
    setCreateUserModalOpen(false);
  };

  const handleUserCreated = () => {
    setSnackbar({
      open: true,
      message: 'User created successfully!',
      severity: 'success'
    });
    loadUsers(); // Refresh the user list
  };

  // User editing handlers
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
    handleMenuClose();
  };

  const handleEditUserClose = () => {
    setEditUserModalOpen(false);
    setSelectedUser(null); // Clear when cancelled
  };

  const handleUserUpdated = () => {
    setSnackbar({
      open: true,
      message: 'User updated successfully!',
      severity: 'success'
    });
    setSelectedUser(null); // Clear selected user after successful update
    loadUsers(); // Refresh the user list
  };

  // User details handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailsModalOpen(true);
    handleMenuClose();
  };

  const handleUserDetailsClose = () => {
    setUserDetailsModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditFromDetails = () => {
    setUserDetailsModalOpen(false);
    setEditUserModalOpen(true);
  };

  // User deletion handlers
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUserClose = () => {
    setDeleteUserDialogOpen(false);
    setSelectedUser(null);
  };

  // Manage accounts handlers
  const handleManageAccounts = (user: User) => {
    console.log('Managing accounts for user:', user.userName);
    setSelectedUserForAccounts(user);
    setManageAccountsModalOpen(true);
    handleMenuClose();
  };

  const handleUserDeleted = () => {
    setSnackbar({
      open: true,
      message: 'User deleted successfully',
      severity: 'success'
    });
    loadUsers(); // Refresh the users list
  };

  return (
    <>
      <ManagementLayout
        title="User Management"
        subtitle="Manage users, accounts, and access permissions"
        icon={<PersonIcon />}
        onRefresh={loadUsers}
        error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      >
        {/* Search and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search users by name, username, or email..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 400 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </Box>
        </Box>

        {/* Users Table */}
        <TableContainer component={Paper} sx={{ 
          boxShadow: 2, 
          borderRadius: 2, 
          overflow: 'auto',
          maxWidth: '100%'
        }}>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell sx={{ width: '15%', minWidth: 120 }}>Username</StyledTableCell>
                <StyledTableCell sx={{ width: '20%', minWidth: 150 }}>Email</StyledTableCell>
                <StyledTableCell sx={{ width: '12%', minWidth: 100 }}>Status</StyledTableCell>
                <StyledTableCell sx={{ width: '33%', minWidth: 180 }}>Accounts</StyledTableCell>
                <StyledTableCell sx={{ width: '10%', minWidth: 80 }}>Country</StyledTableCell>
                <StyledTableCell align="center" sx={{ width: '10%', minWidth: 100 }}>Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>Loading users...</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length > 0 && users.map((user) => (
                  <StyledTableRow 
                    key={user.id} 
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewUser(user)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.userName}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(user.status)}
                        label={user.status}
                        color={getStatusColor(user.status) as 'success' | 'warning' | 'error' | 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {user.accounts?.map((acc) => (
                        <Chip
                          key={`${acc.account}-${acc.roles.join('-')}`}
                          label={`${acc.account} (${acc.roles.join(', ')})`}
                          size="small"
                          variant="filled"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{user.country ?? '-'}</TableCell>
                    <TableCell align="center" sx={{ minWidth: 120, width: 120 }}>
                      <IconButton
                        aria-label="actions"
                        size="medium"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleMenuClick(e, user);
                        }}
                        sx={{ 
                          color: 'primary.main',
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          border: '1px solid rgba(25, 118, 210, 0.3)',
                          '&:hover': {
                            color: 'primary.dark',
                            backgroundColor: 'rgba(25, 118, 210, 0.12)'
                          }
                        }}
                      >
                        <MoreVertIcon fontSize="medium" />
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </ManagementLayout>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedUser && handleViewUser(selectedUser)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleEditUser(selectedUser)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleManageAccounts(selectedUser)}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Accounts & Roles</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleDeleteUser(selectedUser)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modals */}
      <CreateUserModal
        open={createUserModalOpen}
        onClose={handleCreateUserClose}
        onUserCreated={handleUserCreated}
      />

      <EditUserModal
        open={editUserModalOpen}
        user={selectedUser}
        onClose={handleEditUserClose}
        onUserUpdated={handleUserUpdated}
      />

      <UserDetailsModal
        open={userDetailsModalOpen}
        user={selectedUser}
        onClose={handleUserDetailsClose}
        onEdit={handleEditFromDetails}
      />

      <DeleteUserDialog
        open={deleteUserDialogOpen}
        user={selectedUser}
        onClose={handleDeleteUserClose}
        onUserDeleted={handleUserDeleted}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Manage User Accounts Modal */}
      <ManageUserAccountsModal
        open={manageAccountsModalOpen}
        onClose={() => {
          setManageAccountsModalOpen(false);
          setSelectedUserForAccounts(null);
        }}
        user={selectedUserForAccounts}
        onSuccess={(message) => {
          setSnackbar({ open: true, message, severity: 'success' });
          loadUsers(); // Refresh the users list
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: 'error' });
        }}
      />
    </>
  );
};

export default UserManagement;
