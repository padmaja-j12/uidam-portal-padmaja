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
import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    customColors: {
      backgroundGradient: string;
      cardBackground: string;
      sidebarBackground: string;
      headerBackground: string;
      uidamBlue: string;
      uidamBlueLight: string;
      uidamBlueDark: string;
    };
  }

  interface ThemeOptions {
    customColors?: {
      backgroundGradient?: string;
      cardBackground?: string;
      sidebarBackground?: string;
      headerBackground?: string;
      uidamBlue?: string;
      uidamBlueLight?: string;
      uidamBlueDark?: string;
    };
  }
}

// UIDAM Brand Colors (from authorization server)
const UIDAM_COLORS = {
  primary: '#00a6e3',      // Main UIDAM blue
  primaryLight: '#33b8e8', // Lighter blue
  primaryDark: '#0085b8',  // Darker blue
  secondary: '#f2f2f2',    // Light gray from auth server
  background: '#fafafa',   // Clean background
  surface: '#ffffff',      // White surface
  text: '#333333',         // Dark text
};

const commonTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Match auth server
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: UIDAM_COLORS.primary, // UIDAM blue for headers
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: UIDAM_COLORS.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: UIDAM_COLORS.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: UIDAM_COLORS.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'light',
    primary: {
      main: UIDAM_COLORS.primary,        // #00a6e3 - UIDAM blue
      light: UIDAM_COLORS.primaryLight,  // #33b8e8
      dark: UIDAM_COLORS.primaryDark,    // #0085b8
      contrastText: '#ffffff',
    },
    secondary: {
      main: UIDAM_COLORS.secondary,      // #f2f2f2 - Light gray
      light: '#f8f8f8',
      dark: '#e0e0e0',
      contrastText: UIDAM_COLORS.text,
    },
    background: {
      default: UIDAM_COLORS.background,  // #fafafa - Clean background
      paper: UIDAM_COLORS.surface,       // #ffffff - White surfaces
    },
    text: {
      primary: UIDAM_COLORS.text,        // #333333 - Dark text
      secondary: '#666666',
    },
    divider: '#e0e0e0',
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  customColors: {
    backgroundGradient: `linear-gradient(135deg, ${UIDAM_COLORS.primary} 0%, ${UIDAM_COLORS.primaryDark} 100%)`,
    cardBackground: UIDAM_COLORS.surface,
    sidebarBackground: UIDAM_COLORS.surface,
    headerBackground: UIDAM_COLORS.surface,
    uidamBlue: UIDAM_COLORS.primary,
    uidamBlueLight: UIDAM_COLORS.primaryLight,
    uidamBlueDark: UIDAM_COLORS.primaryDark,
  },
});

export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: UIDAM_COLORS.primaryLight,    // Lighter blue for dark mode
      light: '#66c4ea',
      dark: UIDAM_COLORS.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#404040',
      light: '#606060',
      dark: '#303030',
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    divider: '#333333',
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  customColors: {
    backgroundGradient: `linear-gradient(135deg, ${UIDAM_COLORS.primaryDark} 0%, #1a1a1a 100%)`,
    cardBackground: '#1e1e1e',
    sidebarBackground: '#1e1e1e',
    headerBackground: '#1e1e1e',
    uidamBlue: UIDAM_COLORS.primaryLight,
    uidamBlueLight: '#66c4ea',
    uidamBlueDark: UIDAM_COLORS.primary,
  },
});

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? lightTheme : darkTheme;
};
