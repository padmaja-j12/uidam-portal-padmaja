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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Policy as PolicyIcon,
} from '@mui/icons-material';
import ManagementLayout from '../../components/shared/ManagementLayout';
import { StyledTableHead, StyledTableCell, StyledTableRow } from '../../components/shared/StyledTableComponents';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { scopeService } from '@services/index';
import { Scope, CreateScopeRequest, UpdateScopeRequest, ScopeFilterRequest } from '@/types';

interface ScopeFormData {
  name: string;
  description: string;
  administrative: boolean;
}

const scopeSchema = yup.object().shape({
  name: yup
    .string()
    .required('Scope name is required')
    .matches(/^[a-zA-Z0-9_.-]+$/, 'Scope name can only contain letters, numbers, dots, hyphens, and underscores'),
  description: yup.string().required('Description is required'),
  administrative: yup.boolean().required(),
});

const ScopeManagement: React.FC = () => {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scopeToDelete, setScopeToDelete] = useState<Scope | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScopeFormData>({
    resolver: yupResolver(scopeSchema),
    defaultValues: {
      name: '',
      description: '',
      administrative: false,
    },
  });

  const loadScopes = async () => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum 500ms to show loader
    
    try {
      setLoading(true);
      setError(null);

      // Create filter request
      const filterRequest: ScopeFilterRequest = {};
      if (searchTerm.trim()) {
        filterRequest.name = searchTerm.trim();
        console.log('Applying search filter:', { searchTerm: searchTerm.trim() });
      } else {
        console.log('No search filter applied - loading all scopes');
      }

      console.log('Loading scopes with filter:', filterRequest);

      const response = await scopeService.getScopes({
        page,
        size: rowsPerPage,
        sortBy: 'name',
        sortOrder: 'asc',
        filter: filterRequest,
      });

      setScopes(response.content);
      setTotalCount(response.totalElements || response.content.length);
      console.log(`Loaded ${response.content.length} scopes`);
    } catch (err) {
      console.error('Failed to load scopes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scopes');
    } finally {
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  useEffect(() => {
    loadScopes();
  }, [page, rowsPerPage, searchTerm]);

  const handleSearch = () => {
    setPage(0);
    loadScopes();
  };

  const handleRefresh = () => {
    setPage(0);
    setSearchTerm('');
    loadScopes();
  };

  const handleAddScope = () => {
    setEditingScope(null);
    reset({ name: '', description: '', administrative: false });
    setOpenDialog(true);
  };

  const handleEditScope = (scope: Scope) => {
    if (scope.predefined) {
      console.warn('Cannot edit predefined scope:', scope.name);
      return;
    }
    
    setEditingScope(scope);
    reset({
      name: scope.name,
      description: scope.description,
      administrative: scope.administrative || false, // Use actual value from API or default to false
    });
    setOpenDialog(true);
  };

  const handleDeleteScope = (scope: Scope) => {
    if (scope.predefined) {
      console.warn('Cannot delete predefined scope:', scope.name);
      return;
    }
    
    setScopeToDelete(scope);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteScope = async () => {
    if (!scopeToDelete) return;
    
    if (scopeToDelete.predefined) {
      console.warn('Cannot delete predefined scope:', scopeToDelete.name);
      setError('Cannot delete predefined scopes');
      setDeleteConfirmOpen(false);
      setScopeToDelete(null);
      return;
    }

    try {
      await scopeService.deleteScope(scopeToDelete.name);
      setDeleteConfirmOpen(false);
      setScopeToDelete(null);
      loadScopes();
    } catch (err) {
      console.error('Failed to delete scope:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete scope');
    }
  };

  const onSubmit = async (data: ScopeFormData) => {
    try {
      console.log('=== FORM SUBMIT DEBUG START ===');
      console.log('Form submit data:', data);
      console.log('Is editing?', !!editingScope);
      console.log('Editing scope:', editingScope);
      
      if (editingScope) {
        // Update existing scope
        const updateRequest: UpdateScopeRequest = {
          description: data.description,
          administrative: data.administrative.toString(), // Convert boolean to string as API expects
        };
        console.log('Update request being sent:', updateRequest);
        console.log('Updating scope with name:', editingScope.name);
        
        await scopeService.updateScope(editingScope.name, updateRequest);
        console.log('Update scope completed successfully');
      } else {
        // Create new scope
        const createRequest: CreateScopeRequest = {
          name: data.name,
          description: data.description,
          administrative: data.administrative.toString(), // Convert boolean to string as API expects
        };
        console.log('Create request being sent:', createRequest);
        await scopeService.createScope(createRequest);
        console.log('Create scope completed successfully');
      }

      setOpenDialog(false);
      reset({ name: '', description: '', administrative: false });
      loadScopes();
      console.log('=== FORM SUBMIT DEBUG END ===');
    } catch (err) {
      console.error('Failed to save scope:', err);
      setError(err instanceof Error ? err.message : 'Failed to save scope');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <ManagementLayout
        title="Scope Management"
        subtitle="Manage OAuth2 scopes and permissions"
        icon={<PolicyIcon />}
        onRefresh={handleRefresh}
        error={error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      >
        {/* Header Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="Search by scope name..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ 
                minWidth: 320,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              disabled={loading}
              sx={{ 
                minWidth: 100,
                borderRadius: 2,              textTransform: 'none',
            }}
          >
            Search
          </Button>
        </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddScope}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(45deg, #00a6e3, #0080c0)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0080c0, #006699)',
              }
            }}
          >
            Add Scope
          </Button>
        </Box>

        {/* Scopes Table */}
        <Paper sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          width: '100%',
          mt: 3
        }}>
          <TableContainer sx={{ width: '100%', maxWidth: 'none' }}>
            <Table sx={{ width: '100%', minWidth: 650 }}>
              <StyledTableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell>Type</StyledTableCell>
                  <StyledTableCell>Created At</StyledTableCell>
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
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={32} thickness={4} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Loading scopes...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!loading && scopes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ fontSize: '1rem' }}
                    >
                      {searchTerm ? 'No scopes found matching your search.' : 'No scopes available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && scopes.length > 0 && scopes.map((scope) => (
                  <StyledTableRow key={scope.name} hover>
                    <TableCell>
                      <Chip 
                        label={scope.name} 
                        variant="outlined" 
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(0, 166, 227, 0.08)',
                          '& .MuiChip-label': {
                            px: 2,
                            py: 0.5
                          }
                        }}
                      />
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
                        {scope.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={scope.administrative ? 'Administrative' : 'Regular'} 
                          color={scope.administrative ? 'error' : 'success'}
                          variant="filled"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-label': {
                              px: 1.5
                            }
                          }}
                        />
                        {scope.predefined && (
                          <Chip 
                            label="System" 
                            color="secondary"
                            variant="filled"
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              '& .MuiChip-label': {
                                px: 1.5
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
                          color: 'text.secondary',
                          fontFamily: 'monospace'
                        }}
                      >
                        {scope.createdAt ? new Date(scope.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title={scope.predefined ? "Cannot edit system scopes" : "Edit scope"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleEditScope(scope)}
                              disabled={loading || scope.predefined}
                              sx={{
                                backgroundColor: scope.predefined ? 'action.disabled' : 'primary.main',
                                color: scope.predefined ? 'text.disabled' : 'white',
                                '&:hover': {
                                  backgroundColor: scope.predefined ? 'action.disabled' : 'primary.dark',
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
                        <Tooltip title={scope.predefined ? "Cannot delete system scopes" : "Delete scope"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteScope(scope)}
                              disabled={loading || scope.predefined}
                              sx={{
                                backgroundColor: scope.predefined ? 'action.disabled' : 'error.main',
                                color: scope.predefined ? 'text.disabled' : 'white',
                                '&:hover': {
                                  backgroundColor: scope.predefined ? 'action.disabled' : 'error.dark',
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

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#fafafa'
            }}
          />
        </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingScope ? 'Edit Scope' : 'Add New Scope'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Scope Name"
                    disabled={!!editingScope} // Cannot edit scope name
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />

              <Controller
                name="administrative"
                control={control}
                render={({ field }: any) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          Administrative Scope
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Administrative scopes have elevated privileges and system-level access
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting && <CircularProgress size={20} />}
              {!isSubmitting && editingScope && 'Update'}
              {!isSubmitting && !editingScope && 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the scope &quot;{scopeToDelete?.name}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteScope} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      </ManagementLayout>
  );
};

export default ScopeManagement;
