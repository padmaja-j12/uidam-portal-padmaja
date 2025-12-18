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
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Approval as ApprovalIcon,
  Apps as AppsIcon,
  AccountCircle,
  Settings,
  Logout,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { toggleSidebar } from '@store/slices/uiSlice';
import { logout } from '@store/slices/authSlice';
import { useTheme } from '@hooks/useTheme';
import { FEATURE_FLAGS } from '@config/app.config';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    feature: true, // Always available
  },
  {
    text: 'User Management',
    icon: <PeopleIcon />,
    path: '/users',
    feature: FEATURE_FLAGS.USER_MANAGEMENT,
  },
  {
    text: 'Account Management',
    icon: <BusinessIcon />,
    path: '/accounts',
    feature: FEATURE_FLAGS.ACCOUNT_MANAGEMENT,
  },
  {
    text: 'Role Management',
    icon: <SecurityIcon />,
    path: '/roles',
    feature: FEATURE_FLAGS.ROLE_MANAGEMENT,
  },
  {
    text: 'Scope Management',
    icon: <AdminPanelSettingsIcon />,
    path: '/scopes',
    feature: FEATURE_FLAGS.SCOPE_MANAGEMENT,
  },
  {
    text: 'Approval Workflow',
    icon: <ApprovalIcon />,
    path: '/approvals',
    feature: FEATURE_FLAGS.APPROVAL_WORKFLOW,
  },
  {
    text: 'Client Management',
    icon: <AppsIcon />,
    path: '/clients',
    feature: FEATURE_FLAGS.CLIENT_MANAGEMENT,
  },
  {
    text: 'Assistant',
    icon: <AdminPanelSettingsIcon />,
    path: '/assistant',
    feature: true,
  },
].filter(item => item.feature);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { themeMode, toggleThemeMode } = useTheme();
  
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            fontWeight: 700,
            color: 'white',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '1.1rem'
          }}
        >
          UIDAM Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 700,
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  fontSize: '0.95rem',
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '& .MuiListItemText-primary': {
                    fontWeight: 700,
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0, 166, 227, 0.1)',
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}> {/* Slightly taller header */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* UIDAM Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img 
              src="/images/logo.svg" 
              alt="UIDAM" 
              style={{ 
                height: '56px', // Increased from 40px
                width: 'auto',
                marginRight: '16px' // Slightly more space
              }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                fontSize: '1.2rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              UIDAM Admin Portal
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Current Page Title */}
          <Typography 
            variant="body1" 
            sx={{ 
              mr: 2, 
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '1rem',
              display: { xs: 'none', md: 'block' },
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {navigationItems.find(item => location.pathname.startsWith(item.path))?.text ?? 'Dashboard'}
          </Typography>
          
          <IconButton color="inherit" onClick={toggleThemeMode}>
            {themeMode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="account-menu"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.[0] ?? user?.userName?.[0] ?? 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleMenuClose}>
              <Avatar /> {user?.firstName} {user?.lastName}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <Box
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                borderRight: 'none',
                position: 'relative',
                height: '100vh',
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      )}
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: 0, // Fix for horizontal overflow
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flex: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 64px)',
          width: '100%', // Ensure content fits within container
        }}>
          {children}
        </Box>
      </Box>
      {/* Floating assistant widget removed - using sidebar menu instead */}
    </Box>
  );
};

export default Layout;
