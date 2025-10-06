import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowForward, Lightbulb, Info } from '@mui/icons-material';

interface InstructionsScreenProps {
  onContinue: () => void;
}

const InstructionsScreen: React.FC<InstructionsScreenProps> = ({ onContinue }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Info sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            How to Complete the Tasks
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          📊 What You'll See:
        </Typography>
        <Typography variant="body1" paragraph>
          You'll see charts displaying environmental data for four variables:
        </Typography>
        <List sx={{ pl: 2 }}>
          <ListItem>
            <ListItemText primary="🌡️ Temperature (°C)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="🌫️ Air Quality Index (AQI)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="🏭 CO2 Levels (ppm)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="🌧️ Precipitation (mm)" />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ my: 3 }}>
          <Typography variant="body2">
            <strong>Data Period:</strong> All charts show data from January through April 2023
            (approximately 4 months of daily measurements)
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          📝 For Each Task:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>1.</strong> Read the question carefully at the top of the screen
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>2.</strong> Study the chart(s) - hover over lines to see exact values
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>3.</strong> Select one of the four answer options (A, B, C, or D)
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.</strong> Click the "Submit Answer" button to move to the next task
          </Typography>
        </Box>

        <Alert severity="success" icon={<Lightbulb />} sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            💡 Helpful Tips:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Hover your mouse over the charts to see exact values and dates" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Take your time - there's no time limit for individual tasks" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• You can change your answer before clicking Submit" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Trust your judgment - these are visual interpretation tasks" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Pay attention to the chart layout - it will change halfway through" />
            </ListItem>
          </List>
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          🎯 What Happens Next:
        </Typography>
        <Typography variant="body1" paragraph>
          You'll complete <strong>6 tasks total</strong>:
        </Typography>
        <List sx={{ pl: 2 }}>
          <ListItem>
            <ListItemText
              primary="Block 1: First 3 tasks (8-10 minutes)"
              secondary="You'll see the charts in one layout style"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Quick survey about the first layout (1 minute)"
              secondary="Just 2 quick questions"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Brief break (1 minute)"
              secondary="Time to rest your eyes"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Block 2: Next 3 tasks (8-10 minutes)"
              secondary="You'll see the charts in a DIFFERENT layout style"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Quick survey about the second layout (1 minute)"
              secondary="Same 2 questions"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Final preference question (1 minute)"
              secondary="Which layout did you prefer overall?"
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ my: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Once you start, you cannot pause or go back to previous tasks.
            Make sure you have about 30 minutes available without interruptions.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onContinue}
            endIcon={<ArrowForward />}
            sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
          >
            I Understand - Start Tasks
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InstructionsScreen;
