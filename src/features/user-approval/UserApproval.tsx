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
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  PersonAdd as ActivateIcon,
  HowToReg as ApprovalIcon,
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell } from '../../components/shared/StyledTableComponents';

import { UserService, User as ServiceUser } from '../../services/userService';
import { Account } from '../../services/accountService';
import { Role } from '../../types';
import { getAccountPaperStyles } from '../../utils/accountPaperStyles';
import { AccountRoleSelectorWithDefaults } from '../shared/components/AccountRoleSelectorWithDefaults';
import { 
  AccountRoleMapping, 
  processUserAccount,
  loadAvailableAccounts,
  loadAvailableRoles
} from '../../utils/accountRoleUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface ApprovalDialogData {
  accountRoleMappings: AccountRoleMapping[];
  reason?: string;
}

const UserApproval: React.FC = () => {
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Users state
  const [pendingUsers, setPendingUsers] = useState<ServiceUser[]>([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState<ServiceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(10);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  
  const [deactivatedPage, setDeactivatedPage] = useState(0);
  const [deactivatedRowsPerPage, setDeactivatedRowsPerPage] = useState(10);
  const [deactivatedTotalCount, setDeactivatedTotalCount] = useState(0);
  
  // Dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ServiceUser | null>(null);
  
  // Form state
  const [approvalData, setApprovalData] = useState<ApprovalDialogData>({
    accountRoleMappings: [],
    reason: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  
  // Available options
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Loading and error states
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  
  // Feedback state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load data on component mount and tab change
  useEffect(() => {
    if (currentTab === 0) {
      loadPendingUsers();
    } else if (currentTab === 1) {
      loadDeactivatedUsers();
    }
  }, [currentTab, pendingPage, pendingRowsPerPage, deactivatedPage, deactivatedRowsPerPage]);

  // Load available accounts and roles for approval process
  useEffect(() => {
    const loadData = async () => {
      const [accounts, roles] = await Promise.all([
        loadAvailableAccounts(),
        loadAvailableRoles()
      ]);
      setAvailableAccounts(accounts);
      setAvailableRoles(roles);
    };
    loadData();
  }, []);

  const loadPendingUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use static method call for UserService
      const response = await UserService.filterUsersV2(
        { status: ['PENDING'] }, // This matches the required payload format
        {
          pageNumber: pendingPage,
          pageSize: pendingRowsPerPage,
          sortBy: 'FIRST_NAMES',
          sortOrder: 'ASC'
        }
      );

      if (response && Array.isArray(response)) {
        setPendingUsers(response);
        setPendingTotalCount(response.length);
      } else {
        setPendingUsers([]);
        setPendingTotalCount(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pending users';
      setError(errorMessage);
      console.error('Error loading pending users:', err);
      setPendingUsers([]);
      setPendingTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadDeactivatedUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use static method call for UserService
      const response = await UserService.filterUsersV2(
        { status: ['DEACTIVATED'] }, // Filter for deactivated users
        {
          pageNumber: deactivatedPage,
          pageSize: deactivatedRowsPerPage,
          sortBy: 'FIRST_NAMES',
          sortOrder: 'ASC'
        }
      );

      if (response && Array.isArray(response)) {
        setDeactivatedUsers(response);
        setDeactivatedTotalCount(response.length);
      } else {
        setDeactivatedUsers([]);
        setDeactivatedTotalCount(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deactivated users';
      setError(errorMessage);
      console.error('Error loading deactivated users:', err);
      setDeactivatedUsers([]);
      setDeactivatedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleApprove = async (user: ServiceUser) => {
    setSelectedUser(user);
    setApprovalDialogOpen(true);
    
    // Fetch complete user data including all accounts and roles
    try {
      setDialogLoading(true);
      setDialogError(null);
      
      console.log('Fetching complete user data for approval, user ID:', user.id);
      console.log('User data from list:', {
        id: user.id,
        userName: user.userName,
        accounts: user.accounts,
        accountCount: user.accounts?.length ?? 0
      });
      
      // Ensure available accounts are loaded before processing
      if (availableAccounts.length === 0) {
        console.log('Available accounts not loaded yet, loading now...');
        const accounts = await loadAvailableAccounts();
        setAvailableAccounts(accounts);
      }
      
      // Get complete user details from the API
      const completeUserResponse = await UserService.getUserV2(user.id);
      
      let completeUser: ServiceUser;
      if (completeUserResponse.data) {
        completeUser = completeUserResponse.data;
        console.log('Complete user data from API:', {
          id: completeUser.id,
          userName: completeUser.userName,
          accounts: completeUser.accounts,
          accountCount: completeUser.accounts?.length ?? 0
        });
        
        // Compare account data
        if (user.accounts?.length !== completeUser.accounts?.length) {
          console.warn('Account count mismatch between list and API data:', {
            listAccounts: user.accounts?.length ?? 0,
            apiAccounts: completeUser.accounts?.length ?? 0
          });
        }
      } else {
        console.log('API response format unexpected, using list data as fallback');
        completeUser = user;
      }
      
      // Initialize approval data with complete user information
      await initializeApprovalData(completeUser);
    } catch (err) {
      console.error('Error fetching complete user data:', err);
      setDialogError('Failed to load complete user information');
      // Fallback to using the user data from the list
      await initializeApprovalData(user);
    } finally {
      setDialogLoading(false);
    }
  };

  const initializeApprovalData = async (user: ServiceUser) => {
    try {
      setDialogLoading(true);
      setDialogError(null);
      
      const mappings: AccountRoleMapping[] = [];
      
      console.log('Initializing approval data for user:', user.id);
      console.log('User existing accounts:', user.accounts);
      console.log('Available accounts:', availableAccounts.map(a => ({ id: a.id, name: a.accountName })));
      
      const processedAccountIds = new Set<string>();
      
      if (user.accounts?.length) {
        console.log('Processing user accounts:');
        for (const userAccount of user.accounts) {
          processUserAccount(userAccount, availableAccounts, mappings, processedAccountIds);
        }
      }
      
      // Then, add other available accounts that user doesn't have yet
      for (const account of availableAccounts) {
        if (!processedAccountIds.has(account.id)) {
          mappings.push({
            accountId: account.id,
            accountName: account.accountName,
            originalRoles: [], // No existing roles since user doesn't have this account
            selectedRoles: [], // No roles selected initially
            defaultRoles: account.roles || [], // Default roles for this account
            isNewAccount: true, // This is a new account for the user
            isDefaultAccount: false, // No default account concept
            isAccountSelected: false // Not selected initially
          });
        }
      }
      
      // Ensure at least one account is selected (business requirement)
      const hasSelectedAccount = mappings.some(m => m.isAccountSelected);
      if (!hasSelectedAccount && mappings.length > 0) {
        // If user has no accounts, select the first available account with its default roles
        console.log('User has no accounts, selecting first available account for approval');
        mappings[0].isAccountSelected = true;
        mappings[0].selectedRoles = [...mappings[0].defaultRoles];
      }
      
      console.log('Final account mappings:', mappings);
      console.log(`Total accounts processed: ${mappings.length}`);
      console.log(`User's existing accounts: ${mappings.filter(m => !m.isNewAccount).length}`);
      console.log(`Available new accounts: ${mappings.filter(m => m.isNewAccount).length}`);
      
      setApprovalData({
        accountRoleMappings: mappings,
        reason: ''
      });
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to initialize approval data');
      console.error('Error initializing approval data:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleReject = (user: ServiceUser) => {
    setSelectedUser(user);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReactivate = (user: ServiceUser) => {
    setSelectedUser(user);
    setReactivateDialogOpen(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedUser) return;

    try {
      setDialogLoading(true);
      setDialogError(null);
      
      // Create JsonPatch operations array that includes both status change and account operations
      const jsonPatchOperations: any[] = [];
      
      // Add status change operation - approve the user by changing status to ACTIVE
      jsonPatchOperations.push({
        op: 'replace',
        path: '/status',
        value: 'ACTIVE'
      });
      
      // Calculate the changes needed for account role mappings
      for (const mapping of approvalData.accountRoleMappings) {
        const { accountId, originalRoles, selectedRoles, isAccountSelected } = mapping;
        if (isAccountSelected) {
          // Account is selected - handle role additions and removals
          const rolesToAdd = selectedRoles.filter(role => !originalRoles.includes(role));
          const rolesToRemove = originalRoles.filter(role => !selectedRoles.includes(role));
          
          // Add new roles to account
          rolesToAdd.forEach(role => {
            jsonPatchOperations.push({
              op: 'add', // Backend expects lowercase 'add' for JsonPatch
              path: `/account/${accountId}/roleName`,
              value: role
            });
          });
          
          // Remove roles from account
          // For REMOVE operations, the role name should be in the path, not the value
          rolesToRemove.forEach(role => {
            jsonPatchOperations.push({
              op: 'remove', // Backend expects lowercase 'remove' for JsonPatch
              path: `/account/${accountId}/${role}`, // Role name directly in path for remove operations
              value: null // No value needed for remove operations
            });
          });
        } else if (originalRoles.length > 0) {
          // Account is not selected - remove all roles for this account
          originalRoles.forEach(role => {
            jsonPatchOperations.push({
              op: 'remove',
              path: `/account/${accountId}/${role}`, // Role name directly in path for remove operations
              value: null // No value needed for remove operations
            });
          });
        }
      }
      
      // Validation before sending operations
      const invalidOperations = jsonPatchOperations.filter(op => {
        if (!op.path || !['add', 'remove', 'replace'].includes(op.op)) {
          return true; // Invalid operation or path
        }
        
        // Status operations must have a value
        if (op.path === '/status' && !op.value) {
          return true;
        }
        
        // Add operations must have a value
        if (op.op === 'add' && !op.value) {
          return true;
        }
        
        // Remove operations don't need a value (role is in the path)
        return false;
      });
      if (invalidOperations.length > 0) {
        console.error('Invalid operations detected:', invalidOperations);
        throw new Error(`Invalid operations detected. Please refresh and try again.`);
      }
      
      console.log('Sending JsonPatch operations to V2 API:', jsonPatchOperations);
      
      // Use V2 API with JsonPatch to handle both status and account changes in a single request
      const response = await UserService.updateUserV2(selectedUser.id, jsonPatchOperations);
      
      if (response?.message && !response.message.toLowerCase().includes('success')) {
        throw new Error(`User approval failed: ${response.message}`);
      }
      
      console.log('User approved successfully with V2 API:', response);
      
      setSnackbar({
        open: true,
        message: `User ${selectedUser.userName} approved successfully`,
        severity: 'success'
      });
      setApprovalDialogOpen(false);
      loadPendingUsers(); // Refresh the list
    } catch (err) {
      console.error('User approval failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve user';
      setDialogError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      // Reject the user by changing status to DEACTIVATED (rejected users become deactivated)
      const statusChangeResponse = await UserService.changeUserStatus({
        ids: [selectedUser.id],
        approved: false // Setting approved to false will set status to DEACTIVATED
      });
      
      if (!statusChangeResponse || statusChangeResponse.message) {
        throw new Error('Failed to reject user');
      }
      
      setSnackbar({
        open: true,
        message: `User ${selectedUser.userName} rejected successfully`,
        severity: 'success'
      });
      setRejectDialogOpen(false);
      loadPendingUsers(); // Refresh the list
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to reject user',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubmit = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      // Reactivate the user by changing status to ACTIVE
      const statusChangeResponse = await UserService.changeUserStatus({
        ids: [selectedUser.id],
        approved: true // Setting approved to true will set status to ACTIVE
      });
      
      if (!statusChangeResponse || statusChangeResponse.message) {
        throw new Error('Failed to reactivate user');
      }
      
      setSnackbar({
        open: true,
        message: `User ${selectedUser.userName} reactivated successfully`,
        severity: 'success'
      });
      setReactivateDialogOpen(false);
      loadDeactivatedUsers(); // Refresh the list
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to reactivate user',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelectionChange = (accountId: string, selectedRoles: string[]) => {
    setApprovalData(prev => ({
      ...prev,
      accountRoleMappings: prev.accountRoleMappings.map(mapping => 
        mapping.accountId === accountId 
          ? { ...mapping, selectedRoles }
          : mapping
      )
    }));
  };

  const handleAccountToggle = (accountId: string, isSelected: boolean) => {
    setApprovalData(prev => {
      const updatedMappings = prev.accountRoleMappings.map(mapping => 
        mapping.accountId === accountId 
          ? { 
              ...mapping, 
              isAccountSelected: isSelected,
              // If unselecting, clear selected roles; if selecting, add default roles
              selectedRoles: isSelected 
                ? [...mapping.defaultRoles] // Start with default roles when selecting
                : [] // Clear roles when unselecting
            }
          : mapping
      );

      // Update the mappings without restrictive validation
      // Final validation will happen at submit time
      const selectedAccountsCount = updatedMappings.filter(m => m.isAccountSelected).length;
      
      // Log the change for debugging
      console.log(`Account ${accountId} ${isSelected ? 'selected' : 'unselected'}. Total selected accounts: ${selectedAccountsCount}`);

      return {
        ...prev,
        accountRoleMappings: updatedMappings
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'DEACTIVATED':
        return 'error';
      case 'ACTIVE':
        return 'success';
      case 'BLOCKED':
        return 'error';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Helper function to check if approval is possible
  const canApprove = () => {
    const selectedAccountsCount = approvalData.accountRoleMappings.filter(m => m.isAccountSelected).length;
    return selectedAccountsCount > 0;
  };

  // Helper function to get account toggle tooltip
  const getAccountToggleTooltip = (mapping: AccountRoleMapping) => {
    if (mapping.isAccountSelected) {
      return "Click to remove this account from user";
    }
    return "Click to grant user access to this account";
  };

  return (
    <ManagementLayout
        title="User Approval Management"
        subtitle="Manage pending user approvals and reactivate deactivated users"
        icon={<ApprovalIcon />}
        onRefresh={() => {
          if (currentTab === 0) {
            loadPendingUsers();
          } else if (currentTab === 1) {
            loadDeactivatedUsers();
          }
        }}
        error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      >

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={`Pending Approval (${pendingTotalCount})`}
            icon={<ApproveIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Deactivated Users (${deactivatedTotalCount})`}
            icon={<ActivateIcon />}
            iconPosition="start"
          />
        </Tabs>

        {/* Pending Users Tab */}
        <TabPanel value={currentTab} index={0}>        <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>User Details</StyledTableCell>
                <StyledTableCell>Email</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Registration</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && pendingUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No pending users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && pendingUsers.length > 0 && pendingUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{user.userName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Approve User">
                          <IconButton
                            color="success"
                            onClick={() => handleApprove(user)}
                            size="small"
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject User">
                          <IconButton
                            color="error"
                            onClick={() => handleReject(user)}
                            size="small"
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pendingTotalCount}
            rowsPerPage={pendingRowsPerPage}
            page={pendingPage}
            onPageChange={(_, newPage) => setPendingPage(newPage)}
            onRowsPerPageChange={(event) => {
              setPendingRowsPerPage(parseInt(event.target.value, 10));
              setPendingPage(0);
            }}
          />
        </TabPanel>

        {/* Deactivated Users Tab */}
        <TabPanel value={currentTab} index={1}>        <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>User Details</StyledTableCell>
                <StyledTableCell>Email</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Deactivated</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && deactivatedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No deactivated users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && deactivatedUsers.length > 0 && deactivatedUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{user.userName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Reactivate User">
                          <IconButton
                            color="primary"
                            onClick={() => handleReactivate(user)}
                            size="small"
                          >
                            <ActivateIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={deactivatedTotalCount}
            rowsPerPage={deactivatedRowsPerPage}
            page={deactivatedPage}
            onPageChange={(_, newPage) => setDeactivatedPage(newPage)}
            onRowsPerPageChange={(event) => {
              setDeactivatedRowsPerPage(parseInt(event.target.value, 10));
              setDeactivatedPage(0);
            }}
          />
        </TabPanel>
      </Paper>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Approve User: {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          
          {dialogLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading account information...</Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Configure account and role assignments for this user. You can deselect existing accounts and roles, but at least one account must remain selected.
              </Typography>
              
              {!canApprove() && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  At least one account must be selected to approve the user.
                </Alert>
              )}
              
              {approvalData.accountRoleMappings.map((mapping) => (
                <Paper 
                  key={mapping.accountId} 
                  sx={getAccountPaperStyles(mapping)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Tooltip title={getAccountToggleTooltip(mapping)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={mapping.isAccountSelected}
                            onChange={(e) => handleAccountToggle(mapping.accountId, e.target.checked)}
                            // Allow unchecking any account, but prevent if it would result in no accounts
                            disabled={mapping.isAccountSelected && approvalData.accountRoleMappings.filter(m => m.isAccountSelected).length === 1}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {mapping.accountName}
                            </Typography>
                            {!mapping.isNewAccount && (
                              <Chip 
                                label="User's Current Account" 
                                size="small" 
                                color="info" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                            {mapping.isNewAccount && (
                              <Chip label="Available Account" size="small" color="default" variant="outlined" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        }
                      />
                    </Tooltip>
                  </Box>
                  
                  <AccountRoleSelectorWithDefaults
                    accountId={mapping.accountId}
                    accountName={mapping.accountName}
                    isAccountSelected={mapping.isAccountSelected}
                    selectedRoles={mapping.selectedRoles}
                    defaultRoles={mapping.defaultRoles}
                    originalRoles={mapping.originalRoles}
                    availableRoles={availableRoles}
                    onRoleSelectionChange={handleRoleSelectionChange}
                  />
                </Paper>
              ))}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Approval Notes (Optional)"
                value={approvalData.reason}
                onChange={(e) => setApprovalData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Add any notes about this approval..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprovalSubmit}
            variant="contained"
            color="success"
            disabled={loading || !canApprove()}
            title={!canApprove() ? "At least one account must be selected" : ""}
          >
            {loading ? <CircularProgress size={20} /> : 'Approve User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reject User: {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This will change the user status to DEACTIVATED. Please provide a reason for rejection.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this user..."
              required
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={loading || !rejectReason.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Reject User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog
        open={reactivateDialogOpen}
        onClose={() => setReactivateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reactivate User: {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This will change the user status from DEACTIVATED to ACTIVE. The user will regain access to the system.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReactivateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReactivateSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Reactivate User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
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
      </ManagementLayout>
  );
};

export default UserApproval;
