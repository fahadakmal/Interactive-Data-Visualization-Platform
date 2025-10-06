import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Coffee,
  Visibility,
  LocalDrink,
  SelfImprovement,
  ArrowForward,
} from '@mui/icons-material';

interface BreakScreenProps {
  onContinue: () => void;
  breakDuration?: number; // in seconds, default 60
}

const BreakScreen: React.FC<BreakScreenProps> = ({
  onContinue,
  breakDuration = 60,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(breakDuration);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Allow skipping after 5 seconds
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 5000);

    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-continue after countdown finishes
          setTimeout(onContinue, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(interval);
    };
  }, [onContinue]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((breakDuration - timeRemaining) / breakDuration) * 100;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Coffee sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            ☕ Break Time
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Great job! You're halfway done.
          </Typography>
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography variant="h4" align="center" sx={{ mb: 2 }}>
            {formatTime(timeRemaining)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
            Countdown to next section
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Take a moment to:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <SelfImprovement color="primary" />
            </ListItemIcon>
            <ListItemText primary="Stretch your arms and back" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Visibility color="primary" />
            </ListItemIcon>
            <ListItemText primary="Rest your eyes - look away from the screen" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LocalDrink color="primary" />
            </ListItemIcon>
            <ListItemText primary="Get some water or tea" />
          </ListItem>
        </List>

        <Box
          sx={{
            bgcolor: 'info.light',
            p: 2,
            borderRadius: 1,
            mt: 3,
            mb: 4,
          }}
        >
          <Typography variant="body1" align="center">
            <strong>Next Section:</strong> 3 more tasks with a <strong>DIFFERENT</strong> chart layout
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={onContinue}
            disabled={!canSkip}
            endIcon={<ArrowForward />}
            sx={{ px: 4 }}
          >
            {canSkip ? 'Skip Break' : `Wait ${Math.max(0, 5 - (breakDuration - timeRemaining))}s to skip`}
          </Button>
        </Box>

        {canSkip && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Or wait for automatic continue at 0:00
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default BreakScreen;
