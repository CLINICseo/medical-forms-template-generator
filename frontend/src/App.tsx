import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { UploadPage } from './pages/upload/UploadPage';
import { ValidationPage } from './pages/validation/ValidationPage';
import { ValidationListPage } from './pages/validation/ValidationListPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ErrorNotification } from './components/error/ErrorNotification';

// Create themed app component
const ThemedApp: React.FC = () => {
  const { settings } = useSettings();

  // Detect system theme preference
  const systemTheme = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Determine actual theme mode
  const themeMode = useMemo(() => {
    if (settings.theme === 'auto') {
      return systemTheme;
    }
    return settings.theme;
  }, [settings.theme, systemTheme]);

  // Create Material-UI theme based on settings
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: themeMode === 'dark' ? '#121212' : '#f5f5f5',
        paper: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 300,
      },
      h2: {
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 8,
    },
    transitions: {
      duration: {
        shortest: settings.animationsEnabled ? 150 : 0,
        shorter: settings.animationsEnabled ? 200 : 0,
        short: settings.animationsEnabled ? 250 : 0,
        standard: settings.animationsEnabled ? 300 : 0,
        complex: settings.animationsEnabled ? 375 : 0,
        enteringScreen: settings.animationsEnabled ? 225 : 0,
        leavingScreen: settings.animationsEnabled ? 195 : 0,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: themeMode === 'dark' ? '#1e1e1e' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: themeMode === 'dark' ? '#555' : '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: themeMode === 'dark' ? '#777' : '#555',
            },
          },
        },
      },
    },
  }), [themeMode, settings.animationsEnabled]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/validation" element={<ValidationListPage />} />
              <Route path="/validation/:documentId" element={<ValidationPage />} />
              <Route path="/validate/:documentId" element={<ValidationPage />} />
              <Route path="/analyze/:documentId" element={<ValidationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </Layout>
          <ErrorNotification />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <SettingsProvider>
        <ThemedApp />
      </SettingsProvider>
    </Provider>
  );
}

export default App;
