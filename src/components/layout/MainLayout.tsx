import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel,
  Zoom,
  Fade,
} from '@mui/material';
import FileUploadStep from '../steps/FileUploadStep';
import ColumnSelectionStep from '../steps/ColumnSelectionStep';
import ChartConfigurationStep from '../steps/ChartConfigurationStep';
import VisualizationStep from '../steps/VisualizationStep';
import { useVisualization } from '../../contexts/VisualizationContext';
import AppHeader from './AppHeader';

const steps = [
  'Upload CSV Files',
  'Select Columns',
  'Configure Chart',
  'Visualization',
];

const MainLayout: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { files, chartData, resetChart } = useVisualization();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    if (activeStep === 3) {
      resetChart();
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    resetChart();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <FileUploadStep onNext={() => files.length > 0 && handleNext()} />;
      case 1:
        return <ColumnSelectionStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <ChartConfigurationStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <VisualizationStep onReset={handleReset} onBack={handleBack} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />
      
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            borderRadius: 2,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
            CSV Visualization Platform
          </Typography>
          
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Fade in={true} timeout={500}>
            <Box>
              {getStepContent(activeStep)}
            </Box>
          </Fade>
        </Paper>
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[100],
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            CSV Visualization Platform © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;