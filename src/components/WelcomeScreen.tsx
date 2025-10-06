import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Timer,
  Computer,
  CheckCircle,
  Lock,
  Assessment,
} from '@mui/icons-material';

interface WelcomeScreenProps {
  participantId: string;
  assignedGroup: string;
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  participantId,
  assignedGroup,
  onStart,
}) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Assessment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            Welcome to the Dashboard Visualization Study
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            LUT University Master's Thesis Research
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          📊 What You'll Do:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Compare two chart layouts"
              secondary="View environmental data in different visual formats"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Complete 12 visual tasks"
              secondary="Answer multiple-choice questions about the charts"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Share your opinions"
              secondary="Quick surveys after each section (2-3 questions)"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ my: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            ⏱️ Total Time: Approximately 30 minutes
          </Typography>
        </Alert>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          💻 Before You Start:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Computer color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Use a desktop or laptop computer"
              secondary="Mobile devices are not supported"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Timer color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Set aside 30 uninterrupted minutes"
              secondary="You cannot pause and resume later"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Use Chrome, Firefox, or Edge browser"
              secondary="For best compatibility and performance"
            />
          </ListItem>
        </List>

        <Alert severity="success" sx={{ my: 3 }}>
          <Typography variant="body2">
            <Lock sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
            <strong>Privacy:</strong> Your participation is completely anonymous.
            No personal information is collected. You may withdraw at any time.
          </Typography>
        </Alert>

        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Your Participant ID:</strong> {participantId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Assigned Group:</strong> {assignedGroup} (random assignment for counterbalancing)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onStart}
            startIcon={<PlayArrow />}
            sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
          >
            I'm Ready - Start Study
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          Questions? Contact: fahad.akmal@lut.fi
        </Typography>
      </Paper>
    </Container>
  );
};

export default WelcomeScreen;
