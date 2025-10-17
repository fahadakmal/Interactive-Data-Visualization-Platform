import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

interface AlreadyParticipatedScreenProps {
  participantId: string;
  onClearData?: () => void;
}

/**
 * AlreadyParticipatedScreen Component
 *
 * Displayed when a participant has already completed the experiment.
 * Prevents duplicate participation by checking both localStorage and Firestore.
 */
const AlreadyParticipatedScreen: React.FC<AlreadyParticipatedScreenProps> = ({
  participantId,
  onClearData
}) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          {/* Success Icon */}
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />

          {/* Main Heading */}
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Thank You!
          </Typography>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            You have already completed this experiment
          </Typography>

          {/* Information Alert */}
          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" gutterBottom>
              <strong>Our records show you've already participated:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
              Participant ID: {participantId.substring(0, 8)}...
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              To maintain data integrity and prevent duplicate entries, each participant can only
              complete the experiment once.
            </Typography>
          </Alert>

          {/* Thank You Message */}
          <Typography variant="body1" paragraph sx={{ mt: 3 }}>
            Your contribution to this research is greatly appreciated.
            Your data has been securely saved and will be used to evaluate
            visualization effectiveness in environmental dashboards.
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            If you believe this is an error or have questions about the study,
            please contact the researcher.
          </Typography>

          {/* Developer Option (Optional) */}
          {onClearData && import.meta.env.DEV && (
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Developer Mode: Clear local data and start fresh
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={onClearData}
                sx={{ mt: 1 }}
              >
                Clear Data & Restart
              </Button>
            </Box>
          )}
        </Paper>

        {/* Additional Information */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mt: 3,
            borderRadius: 2,
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="h6" gutterBottom>
            About This Study
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This experiment is part of a Master's thesis research at LUT University,
            evaluating the effectiveness of different visualization layouts for
            environmental time-series data.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your data is anonymized and will be used solely for academic research purposes.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AlreadyParticipatedScreen;
