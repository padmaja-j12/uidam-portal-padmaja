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
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  FiberManualRecord as ActiveIcon,
} from '@mui/icons-material';
import { SessionService } from '@services/sessionService';
import { ActiveSession } from '@/types';
import { format } from 'date-fns';

const ActiveSessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    sessionId: string | null;
    isTerminateAll: boolean;
  }>({ open: false, sessionId: null, isTerminateAll: false });

  // Auto-refresh interval (30 seconds)
  const AUTO_REFRESH_INTERVAL = 30000;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SessionService.getActiveSessions();
      setSessions(response.sessions || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active sessions';
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();

    // Set up auto-refresh
    const intervalId = setInterval(fetchSessions, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchSessions]);

  const handleTerminateSession = async (sessionId: string) => {
    try {
      // Use terminateSessions with array of token IDs
      await SessionService.terminateSessions([sessionId]);
      setSuccess('Session terminated successfully');
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate session';
      setError(errorMessage);
    } finally {
      setConfirmDialog({ open: false, sessionId: null, isTerminateAll: false });
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      // Get all session IDs except the current one
      const tokenIds = sessions
        .filter(session => !session.isCurrent)
        .map(session => session.sessionId);
      
      if (tokenIds.length === 0) {
        setError('No other sessions to terminate');
        return;
      }
      
      await SessionService.terminateSessions(tokenIds);
      setSuccess('All other sessions terminated successfully');
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate all sessions';
      setError(errorMessage);
    } finally {
      setConfirmDialog({ open: false, sessionId: null, isTerminateAll: false });
    }
  };

  const openConfirmDialog = (sessionId: string | null, isTerminateAll: boolean = false) => {
    setConfirmDialog({ open: true, sessionId, isTerminateAll });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, sessionId: null, isTerminateAll: false });
  };

  const handleConfirm = () => {
    if (confirmDialog.isTerminateAll) {
      handleTerminateAllOtherSessions();
    } else if (confirmDialog.sessionId) {
      handleTerminateSession(confirmDialog.sessionId);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const lowerDevice = deviceInfo.toLowerCase();
    if (lowerDevice.includes('mobile') || lowerDevice.includes('android') || lowerDevice.includes('iphone')) {
      return <PhoneIcon />;
    } else if (lowerDevice.includes('tablet') || lowerDevice.includes('ipad')) {
      return <TabletIcon />;
    }
    return <ComputerIcon />;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return dateString;
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Active Sessions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            disabled={loading || otherSessionsCount === 0}
            onClick={() => openConfirmDialog(null, true)}
          >
            Terminate All Other Sessions
          </Button>
          <Tooltip title="Refresh sessions">
            <IconButton onClick={fetchSessions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading && sessions.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sessions.map((session) => (
            <Grid item xs={12} md={6} key={session.sessionId}>
              <Card
                sx={{
                  position: 'relative',
                  border: session.isCurrent ? '2px solid' : '1px solid',
                  borderColor: session.isCurrent ? 'primary.main' : 'divider',
                  boxShadow: session.isCurrent ? 3 : 1,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(session.deviceInfo)}
                      <Typography variant="h6" component="div">
                        {session.deviceInfo}
                      </Typography>
                    </Box>
                    {session.isCurrent ? (
                      <Chip
                        icon={<ActiveIcon />}
                        label="Current Session"
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Tooltip title="Terminate this session">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => openConfirmDialog(session.sessionId, false)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Grid container spacing={2}>
                      {session.browser && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Browser:</strong> {session.browser}
                          </Typography>
                        </Grid>
                      )}
                      {session.os && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>OS:</strong> {session.os}
                          </Typography>
                        </Grid>
                      )}
                      {session.ipAddress && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              <strong>IP Address:</strong> {session.ipAddress}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {session.location && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Location:</strong> {session.location}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Login Time:</strong> {formatDateTime(session.loginTime)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Last Activity:</strong> {formatDateTime(session.lastActivity)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {sessions.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No active sessions found
          </Typography>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>
          {confirmDialog.isTerminateAll ? 'Terminate All Other Sessions?' : 'Terminate Session?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.isTerminateAll
              ? `Are you sure you want to terminate all other sessions (${otherSessionsCount})? You will remain logged in only on this device.`
              : 'Are you sure you want to terminate this session? The user will be logged out from that device.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Terminate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveSessionsManagement;
