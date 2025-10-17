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
import TestBlock from './steps/TestBlock';
import UMUXQuestionnaire from './UMUXQuestionnaire';
import ExperimentCompletion from './ExperimentCompletion';
import AlreadyParticipatedScreen from './AlreadyParticipatedScreen';
import { useVisualization } from '../contexts/VisualizationContext';
import { checkParticipantExists } from '../services/firebaseService';
import PapaParse from 'papaparse';

/**
 * ExperimentDemo Component - BETWEEN-SUBJECTS DESIGN
 *
 * Complete experiment workflow with:
 * - Welcome screen with study information
 * - Demographics collection
 * - Task instructions
 * - Automatic UUID-based participant ID generation
 * - Random assignment (Group A/B based on UUID parity)
 * - Single test block with assigned layout (NO SWITCHING)
 * - UMUX satisfaction questionnaire
 * - Comprehensive data export (PSPP-compatible format)
 *
 * BETWEEN-SUBJECTS DESIGN:
 * - Group A (even UUID): Overlay layout ONLY (baseline)
 * - Group B (odd UUID): Small multiples layout ONLY (treatment)
 * - Each participant experiences ONE layout throughout entire experiment
 * - No counterbalancing, no layout switching, no break between blocks
 *
 * Flow: Welcome → Demographics → Instructions → Test Block → UMUX Questionnaire → Completion
 */
const ExperimentDemo: React.FC = () => {
  type Phase = 'welcome' | 'demographics' | 'instructions' | 'testBlock' | 'umux' | 'completion';
  const [currentPhase, setCurrentPhase] = useState<Phase>('welcome');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Duplicate participation prevention
  const [checkingParticipation, setCheckingParticipation] = useState(true);
  const [alreadyParticipated, setAlreadyParticipated] = useState(false);

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

  // BETWEEN-SUBJECTS: Single layout per participant
  // Group A (even UUID): Overlay layout ONLY (baseline/status quo)
  // Group B (odd UUID): Small multiples layout ONLY (treatment/experimental)
  const assignedLayout = assignedGroup === 'A' ? 'overlay' : 'small-multiples';
  const layoutName = assignedLayout === 'overlay' ? 'Overlay' : 'Small Multiples';
  const layoutRole = assignedGroup === 'A' ? 'Baseline' : 'Treatment';

  // Check if participant has already completed the experiment
  useEffect(() => {
    const checkExistingParticipation = async () => {
      try {
        console.log('🔍 Checking if participant already exists:', participantId);

        // Check both localStorage completion flag and Firestore
        const localStorageCompleted = localStorage.getItem('experimentCompleted') === 'true';
        const existsInFirestore = await checkParticipantExists(participantId);

        if (localStorageCompleted || existsInFirestore) {
          console.log('⚠️ Participant has already completed the experiment');
          setAlreadyParticipated(true);
        } else {
          console.log('✅ Participant can proceed with experiment');
          setAlreadyParticipated(false);
        }
      } catch (error) {
        console.error('❌ Error checking participation status:', error);
        // Allow experiment to proceed if check fails
        setAlreadyParticipated(false);
      } finally {
        setCheckingParticipation(false);
      }
    };

    checkExistingParticipation();
  }, [participantId]);

  const handleWelcomeStart = () => {
    setCurrentPhase('demographics');
  };

  const handleDemographicsSubmit = (data: DemographicsData) => {
    setDemographics(data);
    console.log('Demographics collected:', data);
    setCurrentPhase('instructions');
  };

  const handleInstructionsContinue = async () => {
    // Auto-load experimental CSV files before starting test block
    await loadExperimentalData();
    setCurrentPhase('testBlock');
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

        // Parse CSV with date transformation
        const parsed = PapaParse.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transform: (value, column) => {
            // Parse 'Date' column as Date object
            if (column === 'Date' && typeof value === 'string' && value.trim() !== '') {
              const parsedDate = new Date(value);
              if (!isNaN(parsedDate.getTime())) {
                return parsedDate;
              }
            }
            return value;
          }
        });

        if (parsed.data && parsed.data.length > 0) {
          const columns = Object.keys(parsed.data[0]);

          console.log(`📊 Loading ${fileInfo.name}:`, {
            rows: parsed.data.length,
            columns,
            firstRow: parsed.data[0],
            xCol: fileInfo.xCol,
            yCol: fileInfo.yCol
          });

          // Add file to context using addParsedFile
          addParsedFile(fileInfo.name, parsed.data, columns);
        } else {
          console.error(`❌ No data parsed for ${fileInfo.name}`);
        }
      }

      console.log('✅ All 4 experimental CSV files loaded successfully');

      // Set axes for all files AFTER they're all loaded
      testDataFiles.forEach(fileInfo => {
        setXAxis(fileInfo.name, fileInfo.xCol);
        setYAxis(fileInfo.name, fileInfo.yCol);
      });

      console.log('✅ Axes configured for all files');

      // Note: Chart will be generated automatically when TestBlock component
      // sets the display mode (via useEffect in Test Block that calls setChartDisplayMode)

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading experimental data:', error);
      alert('Error loading data files. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBlockComplete = () => {
    // After completing all 6 tasks, go directly to UMUX questionnaire
    setCurrentPhase('umux');
  };

  const handleUMUXSubmit = (response: any) => {
    setFinalPreference(response);
    console.log('✅ UMUX responses collected:', response);
    setCurrentPhase('completion');
  };

  const handleReset = () => {
    setCurrentPhase('welcome');
    setDataLoaded(false);
    localStorage.clear(); // This clears everything including experimentCompleted flag
    window.location.reload();
  };

  const handleClearDataAndRestart = () => {
    console.log('🔄 Clearing all data and restarting...');
    localStorage.clear();
    setAlreadyParticipated(false);
    setCurrentPhase('welcome');
    window.location.reload();
  };

  // Show loading screen while checking participation status
  if (checkingParticipation) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Verifying participation status...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait a moment
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Show "already participated" screen if participant exists
  if (alreadyParticipated) {
    return (
      <AlreadyParticipatedScreen
        participantId={participantId}
        onClearData={handleClearDataAndRestart}
      />
    );
  }

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

  // Test Block (Single layout - between-subjects design)
  if (currentPhase === 'testBlock') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Experimental Tasks - {layoutName} Layout
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Group {assignedGroup} ({layoutRole}) | Participant ID: {participantId}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            You will complete all 6 tasks using the <strong>{layoutName}</strong> layout only.
            Please answer each question based on what you observe in the visualization.
          </Alert>

          <Stepper activeStep={0} alternativeLabel sx={{ mt: 3 }}>
            <Step completed={false}>
              <StepLabel>Test Block (6 Tasks)</StepLabel>
            </Step>
            <Step>
              <StepLabel>UMUX Questionnaire</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Paper>

        <TestBlock
          blockId="all"
          layout={assignedLayout}
          onComplete={handleTestBlockComplete}
        />
      </Container>
    );
  }

  // UMUX Questionnaire
  if (currentPhase === 'umux') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Satisfaction Questionnaire (UMUX)
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Group {assignedGroup} | Participant ID: {participantId}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Please rate your experience with the <strong>{layoutName}</strong> layout you just used.
          </Alert>

          <Stepper activeStep={1} alternativeLabel sx={{ mt: 3 }}>
            <Step completed={true}>
              <StepLabel>Test Block (6 Tasks)</StepLabel>
            </Step>
            <Step completed={false}>
              <StepLabel>UMUX Questionnaire</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Paper>

        <UMUXQuestionnaire
          layoutName={layoutName}
          onSubmit={handleUMUXSubmit}
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
