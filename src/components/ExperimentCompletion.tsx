import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  RestartAlt as RestartAltIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useVisualization } from '../contexts/VisualizationContext';
import {
  generateExperimentDataExport,
  downloadExperimentData,
} from '../utils/experimentDataExport';
import { EXPERIMENT_TASKS } from '../data/experimentTasks';
import { saveParticipantData, isFirebaseConfigured } from '../services/firebaseService';
import { savePSPPData } from '../services/psppDataService';

interface ExperimentCompletionProps {
  onStartNewSession?: () => void;
}

/**
 * ExperimentCompletion Component
 *
 * Professional completion screen for the usability evaluation experiment.
 * Displays completion status, data summary, and provides export functionality.
 *
 * Features:
 * - Completion confirmation with summary statistics
 * - Data validation before export
 * - JSON download with all usability metrics
 * - Optional "Start New Session" functionality
 * - Debriefing text explaining study purpose
 * - Error handling for export failures
 *
 * Aligned with Chapter 4, Section 4.5.3 (Export Schema)
 */
const ExperimentCompletion: React.FC<ExperimentCompletionProps> = ({
  onStartNewSession,
}) => {
  const {
    participantId,
    assignedGroup,
    demographics,
    getTaskResponses,
    finalPreference,
    clearTaskResponses,
    resetChart,
  } = useVisualization();

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'pending' | 'success' | 'error' | 'disabled'>('pending');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Automatically sync data to Firebase on component mount
  useEffect(() => {
    const syncToFirebase = async () => {
      // Check if Firebase is configured
      if (!isFirebaseConfigured()) {
        console.log('⚠️ Firebase not configured - skipping automatic sync');
        setFirebaseSyncStatus('disabled');
        return;
      }

      try {
        const taskResponses = getTaskResponses();

        // Transform demographics to match export format
        const demographicsForExport = demographics ? {
          age: demographics.age,
          education: demographics.education,
          chartExperience: demographics.chartExperience,
          environmentalBackground: demographics.environmentalBackground,
        } : {
          age: '',
          education: '',
          chartExperience: '',
          environmentalBackground: ''
        };

        console.log('📤 Syncing participant data to Firebase...');

        // 1. Save raw data to 'participants' collection (for backup)
        await saveParticipantData({
          participantId,
          assignedGroup,
          demographics: demographicsForExport,
          taskResponses,
          satisfactionResponses: [], // No post-block satisfaction in between-subjects design
          umuxResponse: finalPreference,
          finalPreference,
        });

        // 2. Save PSPP-formatted data to 'psppData' collection (for direct export)
        await savePSPPData(
          participantId,
          assignedGroup,
          taskResponses,
          finalPreference,
          demographicsForExport
        );

        setFirebaseSyncStatus('success');

        // Set completion flag in localStorage to prevent duplicate participation
        localStorage.setItem('experimentCompleted', 'true');
        console.log('✅ Data successfully synced to Firebase (both raw + PSPP format)');
        console.log('✅ Experiment marked as completed in localStorage');
      } catch (error) {
        console.error('❌ Failed to sync data to Firebase:', error);
        setFirebaseSyncStatus('error');
        setFirebaseError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    syncToFirebase();
  }, []); // Run once on mount

  const handleDownloadData = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const taskResponses = getTaskResponses();

      // Transform demographics to match export format
      const demographicsForExport = demographics ? {
        age: demographics.age,
        education: demographics.education,
        chartExperience: demographics.chartExperience,
        environmentalBackground: demographics.environmentalBackground,
      } : {};

      const exportData = generateExperimentDataExport(
        participantId,
        assignedGroup,
        taskResponses,
        [], // No post-block satisfaction in between-subjects design
        finalPreference,
        demographicsForExport
      );

      downloadExperimentData(exportData, participantId);
      setExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(
        error instanceof Error ? error.message : 'Unknown export error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartNewSession = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    // Clear all experiment data
    clearTaskResponses();
    resetChart();

    // Clear demographics and final preference from localStorage
    localStorage.removeItem('demographics');
    localStorage.removeItem('finalPreference');
    localStorage.removeItem('participantId');

    setShowResetDialog(false);

    if (onStartNewSession) {
      onStartNewSession();
    }
  };

  const taskResponses = getTaskResponses();

  // Recalculate isCorrect for existing responses (in case they were saved with the bug)
  const recalculatedResponses = taskResponses.map(response => {
    const task = EXPERIMENT_TASKS.find(t => t.id === response.taskId);
    if (!task) {
      console.warn('⚠️ Task not found for ID:', response.taskId);
      return response;
    }

    // Handle null/undefined selectedAnswer
    if (!response.selectedAnswer) {
      console.warn(`⚠️ Task ${response.taskId} has no selected answer`);
      return { ...response, isCorrect: false };
    }

    // Extract the letter (A, B, C, D) from the selected answer
    // selectedAnswer format: "A) Temperature" -> extract "A"
    const answerLetter = String(response.selectedAnswer).trim().charAt(0).toUpperCase();
    const correctLetter = String(task.correctAnswer).trim().toUpperCase();
    const isCorrect = answerLetter === correctLetter;

    console.log(`✅ Task ${response.taskId}: Selected="${response.selectedAnswer}" → Letter="${answerLetter}" vs Correct="${correctLetter}" → ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);

    return {
      ...response,
      isCorrect
    };
  });

  // Debug: Log task responses to understand what's stored
  console.log('📊 Original Task Responses:', taskResponses);
  console.log('📊 Recalculated Task Responses:', recalculatedResponses);
  console.log('📊 Unique Task IDs:', [...new Set(taskResponses.map(t => t.taskId))]);
  console.log('📊 isCorrect values:', recalculatedResponses.map(t => ({ id: t.taskId, isCorrect: t.isCorrect, answer: t.selectedAnswer })));

  // Calculate summary statistics using recalculated responses
  // BETWEEN-SUBJECTS DESIGN: Each participant completes 6 tasks with ONE layout only
  const totalResponses = recalculatedResponses.length;
  const tasksCompleted = totalResponses;
  const correctTasks = recalculatedResponses.filter((t) => t.isCorrect).length;
  const accuracyPercentage = tasksCompleted > 0
    ? Math.round((correctTasks / tasksCompleted) * 100)
    : 0;
  const hasUmuxResponse = finalPreference && Object.keys(finalPreference).length > 0;

  // Determine completion status
  // Expected: 6 tasks + UMUX questionnaire (no post-block satisfaction)
  const uniqueTaskIds = [...new Set(recalculatedResponses.map(t => t.taskId))].length;
  const expectedTaskCount = 6; // Fixed: 6 tasks total in the experiment
  const isFullyComplete = tasksCompleted === 6 && hasUmuxResponse;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 64, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Experiment Complete
          </Typography>
        </Box>
        <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
          Thank you for participating in this usability evaluation study!
        </Typography>
      </Paper>

      {/* Data Summary Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Participant Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Participant Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Participant ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {participantId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Assigned Group
                  </Typography>
                  <Typography variant="body1">
                    Group {assignedGroup}{' '}
                    <Chip
                      label={
                        assignedGroup === 'A'
                          ? 'Overlay Layout'
                          : 'Small Multiples Layout'
                      }
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Completion Summary Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Completion Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Tasks Completed</Typography>
                  <Chip
                    label={`${tasksCompleted} / ${expectedTaskCount}`}
                    color={isFullyComplete ? 'success' : 'warning'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Correct Answers</Typography>
                  <Chip
                    label={`${correctTasks} (${accuracyPercentage}%)`}
                    color={accuracyPercentage >= 80 ? 'success' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">UMUX Questionnaire</Typography>
                  <Chip
                    label={hasUmuxResponse ? 'Completed' : 'Incomplete'}
                    color={hasUmuxResponse ? 'success' : 'warning'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Debug Panel */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">Debug Information</Typography>
          <Button
            size="small"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            variant="outlined"
          >
            {showDebugInfo ? 'Hide' : 'Show'} Debug Info
          </Button>
        </Box>

        {showDebugInfo && (
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total Responses:</strong> {recalculatedResponses.length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Unique Task IDs:</strong> {uniqueTaskIds}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Expected Count:</strong> {expectedTaskCount}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Correct Answers:</strong> {correctTasks} / {tasksCompleted} ({accuracyPercentage}%)
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Task Responses:</Typography>
            {recalculatedResponses.map((r, idx) => (
              <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
                <Typography variant="caption" display="block">
                  <strong>Task {r.taskId}:</strong> {r.question.substring(0, 50)}...
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Selected:</strong> {r.selectedAnswer}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Is Correct:</strong> {r.isCorrect ? '✅ YES' : '❌ NO'}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Layout: {r.layout} | Time: {Math.round(r.completionTime / 1000)}s
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Validation Warning */}
      {!isFullyComplete && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Incomplete Data
          </Typography>
          <Typography variant="body2">
            Not all experiment phases were completed. The export may be missing data.
          </Typography>
          {tasksCompleted < expectedTaskCount && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Expected: {expectedTaskCount} task responses, but only {tasksCompleted} completed.
            </Typography>
          )}
          {!hasUmuxResponse && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              UMUX questionnaire not completed. Please complete all experiment phases.
            </Typography>
          )}
        </Alert>
      )}

      {/* Firebase Sync Status */}
      {firebaseSyncStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          <Typography variant="subtitle2" fontWeight="bold">
            Data Successfully Synced to Firebase
          </Typography>
          <Typography variant="body2">
            Your responses have been securely saved. Thank you for participating!
          </Typography>
        </Alert>
      )}

      {firebaseSyncStatus === 'error' && firebaseError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Firebase Sync Failed
          </Typography>
          <Typography variant="body2">
            Could not sync to Firebase: {firebaseError}. Your data is still saved locally and can be downloaded below.
          </Typography>
        </Alert>
      )}

      {firebaseSyncStatus === 'disabled' && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <Typography variant="subtitle2" fontWeight="bold">
            Firebase Not Configured
          </Typography>
          <Typography variant="body2">
            Cloud sync is disabled. Please configure Firebase in src/config/firebase.ts to enable automatic data backup and counterbalancing.
          </Typography>
        </Alert>
      )}

      {/* Export Status Messages */}
      {exportError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setExportError(null)}>
          <Typography variant="subtitle2" fontWeight="bold">
            Export Failed
          </Typography>
          <Typography variant="body2">{exportError}</Typography>
        </Alert>
      )}

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setExportSuccess(false)}>
          <Typography variant="subtitle2" fontWeight="bold">
            Data Exported Successfully
          </Typography>
          <Typography variant="body2">
            Your experiment data has been downloaded as a JSON file.
          </Typography>
        </Alert>
      )}

      {/* Data Export Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          Download Your Data
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Click the button below to download your complete experiment data. The file will
          include all task responses, satisfaction ratings, timing metrics, and participant
          information in JSON format.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadData}
            disabled={isExporting}
            sx={{ px: 4, py: 1.5 }}
          >
            {isExporting ? 'Preparing Download...' : 'Download Data (JSON)'}
          </Button>

          {isFullyComplete && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Ready to Export"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Filename: participant-{participantId}-data.json
          </Typography>
        </Box>
      </Paper>

      {/* Debriefing Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          Study Debriefing
        </Typography>
        <Typography variant="body1" paragraph>
          Thank you for participating in this usability evaluation study. The purpose of this
          research was to compare the effectiveness, efficiency, and user satisfaction of two
          visualization layouts for environmental data analysis:
        </Typography>
        <ul>
          <li>
            <Typography variant="body1">
              <strong>Overlay Layout:</strong> Multiple data series displayed on a single combined
              chart, facilitating direct visual comparison.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Small Multiples Layout:</strong> Each data series displayed on separate
              individual charts, reducing visual clutter and cognitive load.
            </Typography>
          </li>
        </ul>
        <Typography variant="body1" paragraph>
          Your responses will help us understand which visualization approach is more effective
          for different types of analytical tasks (e.g., identifying trends, detecting anomalies,
          comparing patterns). This research contributes to the design of more usable
          environmental monitoring dashboards.
        </Typography>
        <Typography variant="body1">
          Your data will be handled confidentially and anonymously. If you have any questions
          about this study, please contact the researcher.
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {onStartNewSession && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<RestartAltIcon />}
            onClick={handleStartNewSession}
            sx={{ px: 4 }}
          >
            Start New Session
          </Button>
        )}
      </Box>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start a new session? This will clear all current experiment
            data including uploaded files, task responses, and UMUX questionnaire responses.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Make sure you have downloaded your data before proceeding!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmReset} color="error" variant="contained">
            Reset and Start New Session
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExperimentCompletion;
