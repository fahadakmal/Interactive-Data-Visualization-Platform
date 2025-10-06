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
    getSatisfactionResponses,
    finalPreference,
    clearTaskResponses,
    clearSatisfactionResponses,
    resetChart,
  } = useVisualization();

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleDownloadData = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const taskResponses = getTaskResponses();
      const satisfactionResponses = getSatisfactionResponses();

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
        satisfactionResponses,
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
    clearSatisfactionResponses();
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
  const satisfactionResponses = getSatisfactionResponses();

  // Calculate summary statistics
  const tasksCompleted = taskResponses.length;
  const correctTasks = taskResponses.filter((t) => t.isCorrect).length;
  const accuracyPercentage = tasksCompleted > 0
    ? Math.round((correctTasks / tasksCompleted) * 100)
    : 0;
  const blocksCompleted = satisfactionResponses.length;
  const hasPreference = finalPreference?.preference && finalPreference.preference !== 'no-preference';

  // Determine completion status
  const isFullyComplete = tasksCompleted === 12 && blocksCompleted === 2;

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
                          ? 'Overlay First'
                          : 'Small Multiples First'
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
                    label={`${tasksCompleted} / 12`}
                    color={tasksCompleted === 12 ? 'success' : 'warning'}
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
                  <Typography variant="body1">Blocks Completed</Typography>
                  <Chip
                    label={`${blocksCompleted} / 2`}
                    color={blocksCompleted === 2 ? 'success' : 'warning'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Satisfaction Ratings</Typography>
                  <Chip
                    label={blocksCompleted === 2 ? 'Recorded' : 'Incomplete'}
                    color={blocksCompleted === 2 ? 'success' : 'warning'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Final Preference</Typography>
                  <Chip
                    label={hasPreference ? 'Recorded' : 'No Preference'}
                    color={hasPreference ? 'success' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Warning */}
      {!isFullyComplete && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Incomplete Data
          </Typography>
          <Typography variant="body2">
            Not all experiment phases were completed. The export may be missing data.
          </Typography>
          {tasksCompleted < 12 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Expected: 12 tasks (6 per block), but only {tasksCompleted} completed.
            </Typography>
          )}
          {blocksCompleted > 2 && (
            <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
              ⚠️ Warning: Detected {blocksCompleted} satisfaction responses (expected 2).
              This may indicate cached data from a previous session.
              Click "Start New Session" to clear and begin fresh.
            </Typography>
          )}
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
            data including uploaded files, task responses, and satisfaction ratings.
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
