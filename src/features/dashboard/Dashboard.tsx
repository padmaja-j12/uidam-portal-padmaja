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
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  People,
  Security,
  TrendingUp,
  Refresh,
  AccountBox,
  Business,
  PersonAdd,
  GroupAdd,
  Link,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Helper function to create activity items with consistent structure
const createActivity = (
  id: string,
  type: string,
  description: string,
  user: string,
  timestamp: string,
  category: 'user' | 'account' | 'mapping' | 'federated'
) => ({
  id,
  type,
  description,
  user,
  timestamp,
  category,
});

// Mock data for demonstration
const mockStats = {
  totalUsers: 1247,
  activeUsers: 1089,
  pendingUsers: 23,
  blockedUsers: 12,
  totalRoles: 15,
  totalScopes: 45,
  totalAccounts: 8,
  activeAccounts: 7,
  pendingAccounts: 1,
  userAccountMappings: 1342,
  externalUsers: 45,
  federatedUsers: 23,
  recentActivity: [
    createActivity('1', 'User Created', 'New user john.doe@example.com created with account mapping', 'Admin', '2 minutes ago', 'user'),
    createActivity('2', 'Account Created', 'New account "ProjectAlpha" created with 3 roles', 'Manager', '5 minutes ago', 'account'),
    createActivity('3', 'User-Account Mapping', 'User jane.smith mapped to DevAccount with DEVELOPER role', 'Admin', '8 minutes ago', 'mapping'),
    createActivity('4', 'User Approved', 'User registration approved for bob.wilson', 'Admin', '10 minutes ago', 'user'),
    createActivity('5', 'Federated User', 'Federated user alice.cooper@google.com logged in', 'System', '12 minutes ago', 'federated'),
  ],
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, icon, color, trend }) => (
  <Card 
    sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0, 166, 227, 0.15)',
        borderColor: 'primary.light',
      }
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, color, mb: 1 }}>
            {value.toLocaleString()}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center">
              <TrendingUp fontSize="small" sx={{ color: '#2e7d32', mr: 0.5 }} />
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                +{trend}% from last month
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
            color,
            fontSize: '1.5rem',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockStats;
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}> {/* Center dashboard with max width */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            Dashboard  <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}> (Static Data Summary)</Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to UIDAM Admin Portal - Monitor your identity and access management system
          </Typography>
        </Box>
        <IconButton 
          onClick={handleRefresh} 
          color="primary"
          sx={{ 
            backgroundColor: 'primary.light',
            color: 'white',
            '&:hover': { backgroundColor: 'primary.main' }
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<People />}
            color="#00a6e3"  // UIDAM blue
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Active Users"
            value={stats?.activeUsers ?? 0}
            icon={<People />}
            color="#2e7d32"  // Green for active
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Users"
            value={stats?.pendingUsers ?? 0}
            icon={<PersonAdd />}
            color="#ff9800"  // Orange for pending
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Accounts"
            value={stats?.totalAccounts ?? 0}
            icon={<Business />}
            color="#0085b8"  // UIDAM blue dark
          />
        </Grid>
      </Grid>

      {/* Secondary Stats Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="User-Account Mappings"
            value={stats?.userAccountMappings ?? 0}
            icon={<Link />}
            color="#7b1fa2"  // Purple for mappings
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="External Users"
            value={stats?.externalUsers ?? 0}
            icon={<AccountBox />}
            color="#d32f2f"  // Red for external
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Federated Users"
            value={stats?.federatedUsers ?? 0}
            icon={<GroupAdd />}
            color="#1976d2"  // Blue for federated
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Roles"
            value={stats?.totalRoles ?? 0}
            icon={<Security />}
            color="#388e3c"  // Green for roles
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Enhanced System Overview */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              User Management Overview
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Box 
                  textAlign="center" 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(46, 125, 50, 0.05)',
                    border: '1px solid rgba(46, 125, 50, 0.1)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                    {stats?.activeAccounts ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Active Accounts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box 
                  textAlign="center"
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(255, 152, 0, 0.05)',
                    border: '1px solid rgba(255, 152, 0, 0.1)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                    {stats?.pendingAccounts ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Pending Accounts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box 
                  textAlign="center"
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(0, 166, 227, 0.05)',
                    border: '1px solid rgba(0, 166, 227, 0.1)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#00a6e3', fontWeight: 700 }}>
                    {stats?.totalScopes ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Scopes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box 
                  textAlign="center"
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(211, 47, 47, 0.05)',
                    border: '1px solid rgba(211, 47, 47, 0.1)'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                    {stats?.blockedUsers ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Blocked Users
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                User Activity Rate
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box flex={1} mr={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={87} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2">87%</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Active users in the last 30 days
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* User Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              User Status Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#2e7d32', 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="body2">Active</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {(((stats?.activeUsers ?? 0) / (stats?.totalUsers ?? 1)) * 100).toFixed(1)}%
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#ff9800', 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="body2">Pending</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {(((stats?.pendingUsers ?? 0) / (stats?.totalUsers ?? 1)) * 100).toFixed(1)}%
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#d32f2f', 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="body2">Blocked</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {(((stats?.blockedUsers ?? 0) / (stats?.totalUsers ?? 1)) * 100).toFixed(1)}%
                </Typography>
              </Box>

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Special User Types
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Chip 
                      label={`External: ${stats?.externalUsers ?? 0}`} 
                      size="small" 
                      color="error" 
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip 
                      label={`Federated: ${stats?.federatedUsers ?? 0}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Enhanced Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Chip 
                label="Live" 
                size="small"
                sx={{ 
                  backgroundColor: '#2e7d32', 
                  color: 'white',
                  fontWeight: 500,
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    marginRight: 0.5,
                    animation: 'pulse 2s infinite'
                  }
                }}
              />
            </Box>
            <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
              {stats?.recentActivity.map((activity, index) => {
                const getActivityColor = (category: string) => {
                  switch (category) {
                    case 'user': return '#00a6e3';
                    case 'account': return '#ff9800';
                    case 'mapping': return '#7b1fa2';
                    case 'federated': return '#1976d2';
                    default: return '#00a6e3';
                  }
                };

                return (
                  <ListItem 
                    key={activity.id} 
                    divider={index < stats.recentActivity.length - 1}
                    sx={{ 
                      px: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 166, 227, 0.04)',
                        borderRadius: 1,
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: getActivityColor(activity.category), 
                          width: 36, 
                          height: 36,
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      >
                        {activity.type.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                          {activity.description}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" display="block">
                            By {activity.user}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.timestamp}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
