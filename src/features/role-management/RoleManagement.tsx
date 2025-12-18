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
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell, StyledTableRow } from '../../components/shared/StyledTableComponents';
import { Role, CreateRoleRequest, UpdateRoleRequest, Scope } from '@/types';
import { RoleService } from '@/services/role.service';
import { ScopeService } from '@/services/scope.service';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableScopes, setAvailableScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    scopeNames: [],
  });

  const roleService = new RoleService();
  const scopeService = new ScopeService();

  const fetchRoles = async () => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms to show loader
    
    try {
      setLoading(true);
      setError(null);
      
      const filter = searchTerm ? { name: searchTerm } : undefined;
      const response = await roleService.getRoles({
        page: 0,
        size: 100,
        filter,
      });
      
      setRoles(response.content);
      console.log('Fetched roles:', response.content);
    } catch (err: unknown) {
      console.error('Error fetching roles:', err);
      setError(`Failed to fetch roles: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const fetchAvailableScopes = async () => {
    try {
      const scopes = await scopeService.getAllScopes();
      setAvailableScopes(scopes);
      console.log('Fetched available scopes:', scopes);
    } catch (err: unknown) {
      console.error('Error fetching scopes:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAvailableScopes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchRoles();
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      scopeNames: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      scopeNames: role.scopes?.map(scope => scope.name) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      if (!formData.name.trim()) {
        setError('Role name is required');
        return;
      }

      if (!formData.description.trim()) {
        setError('Role description is required');
        return;
      }

      if (formData.scopeNames.length === 0) {
        setError('At least one scope must be selected');
        return;
      }

      if (selectedRole) {
        // Update existing role
        const updateData: UpdateRoleRequest = {
          description: formData.description,
          scopeNames: formData.scopeNames,
        };
        await roleService.updateRole(selectedRole.name, updateData);
        setSuccess('Role updated successfully');
      } else {
        // Create new role
        await roleService.createRole(formData);
        setSuccess('Role created successfully');
      }

      setDialogOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      console.error('Error saving role:', err);
      setError(`Failed to save role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) return;

    try {
      setError(null);
      await roleService.deleteRole(selectedRole.name);
      setSuccess('Role deleted successfully');
      setDeleteDialogOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      console.error('Error deleting role:', err);
      setError(`Failed to delete role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleScopeChange = (event: SelectChangeEvent<string[]>, _child: React.ReactNode) => {
    const value = event.target.value;
    // MUI Select with multiple returns string[] or string
    const scopeNames = typeof value === 'string' ? value.split(',') : value;
    setFormData(prev => ({
      ...prev,
      scopeNames,
    }));
  };

  const isPredefinedRole = (roleName: string) => {
    // Define system/predefined roles that cannot be modified
    const predefinedRoles = ['ADMIN', 'SYSTEM', 'ROOT'];
    return predefinedRoles.includes(roleName.toUpperCase());
  };

  return (
    <ManagementLayout
      title="Role Management"
      subtitle="Manage system roles and permissions"
      icon={<SecurityIcon />}
      onRefresh={() => {
        setSearchTerm('');
        fetchRoles();
      }}
      error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      success={success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
    >

      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <IconButton size="small" onClick={handleSearch} aria-label="search">
                  <SearchIcon />
                </IconButton>
                ),
              }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(45deg, #00a6e3, #0080c0)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0080c0, #006699)',
              }
            }}
          >
            Create Role
          </Button>
        </Box>

        {/* Roles Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            width: '100%',
            mt: 3
          }}
        >
          <Table sx={{ width: '100%', minWidth: 650 }}>
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Name</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
                <StyledTableCell>Scopes</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </StyledTableHead>
          <TableBody sx={{
            '& .MuiTableRow-root': {
              '&:hover': {
                backgroundColor: 'rgba(0, 166, 227, 0.04)',
              }
            },
            '& .MuiTableCell-body': {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'text.primary',
              py: 2,
              px: 2,
              borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
            }
          }}>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
            {!loading && roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'No roles found matching your search.' : 'No roles found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && roles.length > 0 && roles.map((role) => (
              <StyledTableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'primary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {role.name}
                      </Typography>
                      {isPredefinedRole(role.name) && (
                        <Chip
                          label="System"
                          size="small"
                          color="secondary"
                          variant="filled"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: 'text.primary',
                        lineHeight: 1.4,
                        maxWidth: 300,
                        wordBreak: 'break-word'
                      }}
                    >
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {role.scopes?.slice(0, 3).map((scope) => (
                        <Chip
                          key={scope.name}
                          label={scope.name}
                          size="small"
                          variant="filled"
                          color={scope.administrative ? "error" : "success"}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-label': {
                              px: 1.5
                            }
                          }}
                        />
                      )) || []}
                      {role.scopes && role.scopes.length > 3 && (
                        <Chip
                          label={`+${role.scopes.length - 3} more`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            backgroundColor: 'action.hover',
                            color: 'text.secondary'
                          }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title={isPredefinedRole(role.name) ? "Cannot edit system role" : "Edit role"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(role)}
                            disabled={isPredefinedRole(role.name)}
                            aria-label={isPredefinedRole(role.name) ? "Cannot edit system role" : "Edit role"}
                            sx={{
                              backgroundColor: isPredefinedRole(role.name) ? 'action.disabled' : 'primary.main',
                              color: isPredefinedRole(role.name) ? 'text.disabled' : 'white',
                              '&:hover': {
                                backgroundColor: isPredefinedRole(role.name) ? 'action.disabled' : 'primary.dark',
                              },
                              '&.Mui-disabled': {
                                backgroundColor: 'action.disabled',
                                color: 'text.disabled',
                              },
                              borderRadius: 1,
                              width: 32,
                              height: 32
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isPredefinedRole(role.name) ? "Cannot delete system role" : "Delete role"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(role)}
                            disabled={isPredefinedRole(role.name)}
                            aria-label={isPredefinedRole(role.name) ? "Cannot delete system role" : "Delete role"}
                            sx={{
                              backgroundColor: isPredefinedRole(role.name) ? 'action.disabled' : 'error.main',
                              color: isPredefinedRole(role.name) ? 'text.disabled' : 'white',
                              '&:hover': {
                                backgroundColor: isPredefinedRole(role.name) ? 'action.disabled' : 'error.dark',
                              },
                              '&.Mui-disabled': {
                                backgroundColor: 'action.disabled',
                                color: 'text.disabled',
                              },
                              borderRadius: 1,
                              width: 32,
                              height: 32
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!!selectedRole} // Cannot change name when editing
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth required>
              <InputLabel>Scopes</InputLabel>
              <Select
                multiple
                  value={formData.scopeNames}
                  onChange={handleScopeChange}
                  input={<OutlinedInput label="Scopes" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {availableScopes.map((scope) => (
                  <MenuItem key={scope.name} value={scope.name}>
                    <Checkbox checked={formData.scopeNames.indexOf(scope.name) > -1} />
                    <ListItemText 
                      primary={scope.name}
                      secondary={scope.description}
                    />
                    {scope.administrative && (
                      <Chip label="Admin" size="small" color="secondary" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role &quot;{selectedRole?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      </ManagementLayout>
  );
};

export default RoleManagement;
