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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  FiberManualRecord as ActiveIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { SessionService } from '@services/sessionService';
import { ActiveSession } from '@/types';
import { format } from 'date-fns';

interface AdminSessionsModalProps {
  open: boolean;
  username: string | null;
  onClose: () => void;
}

const AdminSessionsModal: React.FC<AdminSessionsModalProps> = ({ open, username, onClose }) => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const response = await SessionService.getAdminActiveSessions(username);
      setSessions(response.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (open && username) {
      fetchSessions();
    } else {
      setSessions([]);
      setError(null);
      setSuccess(null);
    }
  }, [open, username, fetchSessions]);

  const handleTerminate = async (sessionId: string) => {
    if (!username) return;
    try {
      await SessionService.terminateAdminSessions(username, [sessionId]);
      setSuccess('Session terminated successfully');
      fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to terminate session';
      setError(msg);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <PhoneIcon />;
    } else if (lower.includes('tablet') || lower.includes('ipad')) {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DevicesIcon color="primary" />
            <Typography variant="h6" component="span" fontWeight="bold">
              Active Sessions — {username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchSessions} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No active sessions found for <strong>{username}</strong>
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {sessions.map((session) => (
              <Grid item xs={12} sm={6} key={session.sessionId}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    border: session.isCurrent ? '2px solid' : undefined,
                    borderColor: session.isCurrent ? 'primary.main' : undefined,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(session.deviceInfo)}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {session.deviceInfo}
                      </Typography>
                    </Box>
                    {session.isCurrent ? (
                      <Chip icon={<ActiveIcon />} label="Current" color="primary" size="small" />
                    ) : (
                      <Tooltip title="Terminate this session">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleTerminate(session.sessionId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {session.browser && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Browser:</strong> {session.browser}
                      </Typography>
                    )}
                    {session.os && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>OS:</strong> {session.os}
                      </Typography>
                    )}
                    {(session.ipAddress || session.location) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {session.ipAddress}
                          {session.location ? ` — ${session.location}` : ''}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Login:</strong> {formatDateTime(session.loginTime)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last Activity:</strong> {formatDateTime(session.lastActivity)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminSessionsModal;
