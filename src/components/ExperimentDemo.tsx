import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import WelcomeScreen from './WelcomeScreen';
import DemographicsForm, { DemographicsData } from './DemographicsForm';
import InstructionsScreen from './InstructionsScreen';
import BreakScreen from './BreakScreen';
import TestBlock from './steps/TestBlock';
import FinalPreferenceQuestionnaire from './FinalPreferenceQuestionnaire';
import ExperimentCompletion from './ExperimentCompletion';
import { useVisualization } from '../contexts/VisualizationContext';
import PapaParse from 'papaparse';

/**
 * ExperimentDemo Component
 *
 * Complete experiment workflow with:
 * - Welcome screen with study information
 * - Demographics collection
 * - Task instructions
 * - Automatic UUID-based participant ID generation
 * - Deterministic counterbalancing (Group A/B based on UUID parity)
 * - Two test blocks with satisfaction questionnaires
 * - Break between blocks
 * - Final preference questionnaire
 * - Comprehensive data export (ISO 9241-11 structure)
 *
 * Flow: Welcome → Demographics → Instructions → Block 1 → Satisfaction 1 → Break → Block 2 → Satisfaction 2 → Final Preference → Completion
 */
const ExperimentDemo: React.FC = () => {
  type Phase = 'welcome' | 'demographics' | 'instructions' | 'block1' | 'break' | 'block2' | 'finalPreference' | 'completion';
  const [currentPhase, setCurrentPhase] = useState<Phase>('welcome');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    participantId,
    assignedGroup,
    setDemographics,
    setFinalPreference,
    addParsedFile,
    setXAxis,
    setYAxis,
    generateChart,
  } = useVisualization();

  // Group A: Overlay first, then Small Multiples
  // Group B: Small Multiples first, then Overlay
  const block1Layout = assignedGroup === 'A' ? 'overlay' : 'small-multiples';
  const block2Layout = assignedGroup === 'A' ? 'small-multiples' : 'overlay';

  const handleWelcomeStart = () => {
    setCurrentPhase('demographics');
  };

  const handleDemographicsSubmit = (data: DemographicsData) => {
    setDemographics(data);
    console.log('Demographics collected:', data);
    setCurrentPhase('instructions');
  };

  const handleInstructionsContinue = async () => {
    // Auto-load experimental CSV files before starting Block 1
    await loadExperimentalData();
    setCurrentPhase('block1');
  };

  // Function to load the 4 experimental CSV files
  const loadExperimentalData = async () => {
    setLoading(true);
    const testDataFiles = [
      { name: 'Temperature', path: '/test-data/temperature.csv', xCol: 'Date', yCol: 'Temperature (°C)' },
      { name: 'Air Quality', path: '/test-data/air_quality.csv', xCol: 'Date', yCol: 'Air Quality Index' },
      { name: 'CO2', path: '/test-data/co2.csv', xCol: 'Date', yCol: 'CO2 (ppm)' },
      { name: 'Precipitation', path: '/test-data/precipitation.csv', xCol: 'Date', yCol: 'Precipitation (mm)' }
    ];

    try {
      for (const fileInfo of testDataFiles) {
        const response = await fetch(fileInfo.path);
        const csvText = await response.text();

        // Parse CSV
        const parsed = PapaParse.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        if (parsed.data && parsed.data.length > 0) {
          const columns = Object.keys(parsed.data[0]);

          // Add file to context using addParsedFile
          addParsedFile(fileInfo.name, parsed.data, columns);

          // Set default axes
          setXAxis(fileInfo.name, fileInfo.xCol);
          setYAxis(fileInfo.name, fileInfo.yCol);
        }
      }

      console.log('✅ All 4 experimental CSV files loaded successfully');

      // Generate chart after all files are loaded
      setTimeout(() => {
        generateChart();
        console.log('✅ Chart generated after file loading');
      }, 100);

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading experimental data:', error);
      alert('Error loading data files. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock1Complete = () => {
    setCurrentPhase('break');
  };

  const handleBreakComplete = () => {
    setCurrentPhase('block2');
  };

  const handleBlock2Complete = () => {
    setCurrentPhase('finalPreference');
  };

  const handleFinalPreferenceSubmit = (response: any) => {
    setFinalPreference(response);
    setCurrentPhase('completion');
  };

  const handleReset = () => {
    setCurrentPhase('welcome');
    setDataLoaded(false);
    localStorage.clear();
    window.location.reload();
  };

  // Welcome Screen
  if (currentPhase === 'welcome') {
    return (
      <WelcomeScreen
        participantId={participantId}
        assignedGroup={assignedGroup}
        onStart={handleWelcomeStart}
      />
    );
  }

  // Demographics Form
  if (currentPhase === 'demographics') {
    return <DemographicsForm onSubmit={handleDemographicsSubmit} />;
  }

  // Instructions Screen
  if (currentPhase === 'instructions') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Loading experimental data...</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will only take a moment
            </Typography>
          </Paper>
        ) : (
          <InstructionsScreen onContinue={handleInstructionsContinue} />
        )}
      </Container>
    );
  }

  // Block 1
  if (currentPhase === 'block1') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Block 1 - {block1Layout === 'overlay' ? 'Overlay Layout' : 'Small Multiples Layout'}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Group {assignedGroup} | Participant ID: {participantId}
          </Typography>

          <Stepper activeStep={0} alternativeLabel sx={{ mt: 3 }}>
            <Step completed={false}>
              <StepLabel>Block 1 ({block1Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step>
              <StepLabel>Block 2 ({block2Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step>
              <StepLabel>Final Preference</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Paper>

        <TestBlock
          blockId="1"
          layout={block1Layout}
          onComplete={handleBlock1Complete}
        />
      </Container>
    );
  }

  // Break Screen
  if (currentPhase === 'break') {
    return <BreakScreen onContinue={handleBreakComplete} breakDuration={60} />;
  }

  // Block 2
  if (currentPhase === 'block2') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Block 2 - {block2Layout === 'overlay' ? 'Overlay Layout' : 'Small Multiples Layout'}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Group {assignedGroup} | Participant ID: {participantId}
          </Typography>

          <Stepper activeStep={1} alternativeLabel sx={{ mt: 3 }}>
            <Step completed={true}>
              <StepLabel>Block 1 ({block1Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step completed={false}>
              <StepLabel>Block 2 ({block2Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step>
              <StepLabel>Final Preference</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Paper>

        <TestBlock
          blockId="2"
          layout={block2Layout}
          onComplete={handleBlock2Complete}
        />
      </Container>
    );
  }

  // Final Preference Questionnaire
  if (currentPhase === 'finalPreference') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Final Questionnaire
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Group {assignedGroup} | Participant ID: {participantId}
          </Typography>

          <Stepper activeStep={2} alternativeLabel sx={{ mt: 3 }}>
            <Step completed={true}>
              <StepLabel>Block 1 ({block1Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step completed={true}>
              <StepLabel>Block 2 ({block2Layout === 'overlay' ? 'Overlay' : 'Small Multiples'})</StepLabel>
            </Step>
            <Step completed={false}>
              <StepLabel>Final Preference</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Paper>

        <FinalPreferenceQuestionnaire
          onSubmit={handleFinalPreferenceSubmit}
        />
      </Container>
    );
  }

  // Completion Screen
  if (currentPhase === 'completion') {
    return <ExperimentCompletion onStartNewSession={handleReset} />;
  }

  return null;
};

export default ExperimentDemo;
