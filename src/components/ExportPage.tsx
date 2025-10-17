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
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import {
  getAllPSPPData,
  downloadPSPPDataAsCSV,
  PSPPData,
} from '../services/psppDataService';
import {
  getAllParticipants,
  exportAllDataAsJSON,
  getGroupCounts,
  isFirebaseConfigured,
} from '../services/firebaseService';

/**
 * ExportPage Component
 *
 * Admin page for exporting experiment data from Firestore.
 * Accessible at /export
 *
 * Features:
 * - Download PSPP-formatted CSV (ready for statistical analysis)
 * - Download raw JSON data (complete backup)
 * - View participant counts and group balance
 * - Preview data before export
 * - Firebase configuration status check
 */
const ExportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [psppData, setPsppData] = useState<PSPPData[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [groupCounts, setGroupCounts] = useState({ groupA: 0, groupB: 0 });
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);

  useEffect(() => {
    // Check Firebase configuration
    const configured = isFirebaseConfigured();
    setFirebaseConfigured(configured);

    if (configured) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch PSPP data
      const pspp = await getAllPSPPData();
      setPsppData(pspp);

      // Fetch participant counts
      const participants = await getAllParticipants();
      setParticipantCount(participants.length);

      // Get group distribution
      const counts = await getGroupCounts();
      setGroupCounts(counts);

      console.log('✅ Export page data loaded:', {
        psppRecords: pspp.length,
        totalParticipants: participants.length,
        groups: counts,
      });
    } catch (err) {
      console.error('❌ Error loading export data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPSPP = async () => {
    setExportSuccess(null);
    setError(null);

    try {
      await downloadPSPPDataAsCSV();
      setExportSuccess('PSPP CSV downloaded successfully!');
    } catch (err) {
      console.error('❌ Error downloading PSPP CSV:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDownloadJSON = async () => {
    setExportSuccess(null);
    setError(null);

    try {
      const json = await exportAllDataAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment_raw_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess('Raw JSON data downloaded successfully!');
    } catch (err) {
      console.error('❌ Error downloading JSON:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (!firebaseConfigured) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Firebase Not Configured
            </Typography>
            <Typography variant="body2">
              Firebase is not properly configured. Please check your Firebase settings in
              src/config/firebase.ts
            </Typography>
          </Alert>

          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            fullWidth
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <StorageIcon sx={{ fontSize: 48, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Data Export
          </Typography>
        </Box>
        <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
          Download experiment data for analysis in PSPP/SPSS
        </Typography>
      </Paper>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <Typography variant="subtitle2" fontWeight="bold">
            Error
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setExportSuccess(null)}>
          <Typography variant="subtitle2" fontWeight="bold">
            Success
          </Typography>
          <Typography variant="body2">{exportSuccess}</Typography>
        </Alert>
      )}

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Participants
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {loading ? <CircularProgress size={30} /> : participantCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Group A (Overlay)
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {loading ? <CircularProgress size={30} /> : groupCounts.groupA}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Group B (Small Multiples)
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {loading ? <CircularProgress size={30} /> : groupCounts.groupB}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Actions */}
      <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
          Export Data
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* PSPP CSV Export */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  PSPP-Ready CSV
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Download data in CSV format ready for statistical analysis in PSPP/SPSS.
                  Includes pre-calculated metrics: accuracy, mean time, UMUX score, and
                  demographics.
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Pre-calculated metrics"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Flattened structure"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="One row per participant"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPSPP}
                  disabled={loading || psppData.length === 0}
                >
                  Download PSPP CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Raw JSON Export */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Raw JSON Data
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Download complete raw data including all task responses, timestamps, answer
                  changes, and full participant records. Use for detailed analysis or backup.
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Complete raw data"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="All task responses"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Full backup"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Stack>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadJSON}
                  disabled={loading || psppData.length === 0}
                >
                  Download Raw JSON
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Preview */}
      {psppData.length > 0 && (
        <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="primary">
              Data Preview (First 5 Participants)
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Group</strong></TableCell>
                  <TableCell><strong>Accuracy %</strong></TableCell>
                  <TableCell><strong>Mean Time (s)</strong></TableCell>
                  <TableCell><strong>UMUX</strong></TableCell>
                  <TableCell><strong>Tasks</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {psppData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.ParticipantID.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Chip
                        label={`Group ${row.Group}`}
                        size="small"
                        color={row.Group === 'A' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{row.Accuracy_Percent.toFixed(1)}%</TableCell>
                    <TableCell>{row.MeanTime_Seconds.toFixed(2)}s</TableCell>
                    <TableCell>{row.UMUX_Score !== null ? row.UMUX_Score.toFixed(1) : 'N/A'}</TableCell>
                    <TableCell>{row.TasksCompleted}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {psppData.length > 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Showing 5 of {psppData.length} total participants. Download full data to see all records.
            </Typography>
          )}
        </Paper>
      )}

      {/* No Data Message */}
      {!loading && psppData.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            No Data Available
          </Typography>
          <Typography variant="body2">
            No participant data found in Firestore. Complete some test sessions first, then return
            here to export the data.
          </Typography>
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
          size="large"
        >
          Back to Experiment
        </Button>
      </Box>
    </Container>
  );
};

export default ExportPage;
