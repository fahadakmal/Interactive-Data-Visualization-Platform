import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { VisualizationProvider } from './contexts/VisualizationContext';
import MainLayout from './components/layout/MainLayout';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VisualizationProvider>
        <MainLayout />
      </VisualizationProvider>
    </ThemeProvider>
  );
}

export default App;