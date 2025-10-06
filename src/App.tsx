import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { VisualizationProvider } from './contexts/VisualizationContext';
import MainLayout from './components/layout/MainLayout';
import ExperimentDemo from './components/ExperimentDemo';
import theme from './theme';

function App() {
  // Switch between normal mode and experiment mode
  const EXPERIMENT_MODE = true; // Set to false for normal CSV viz mode

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VisualizationProvider>
        {EXPERIMENT_MODE ? <ExperimentDemo /> : <MainLayout />}
      </VisualizationProvider>
    </ThemeProvider>
  );
}

export default App;