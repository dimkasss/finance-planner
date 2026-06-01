'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a1a1aa',
      light: '#d4d4d8',
      dark: '#71717a',
    },
    secondary: {
      main: '#737373',
      light: '#a3a3a3',
      dark: '#525252',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
    },
    background: {
      default: '#0f0f10',
      paper: '#18181b',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#a1a1aa',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(15, 15, 16, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#131316',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 10,
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          },
        },
      },
    },
  },
});

export default theme;
