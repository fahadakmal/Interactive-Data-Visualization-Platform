import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';

interface FinalPreferenceQuestionnaireProps {
  onSubmit: (response: FinalPreferenceResponse) => void;
  onSkip?: () => void;
}

export interface FinalPreferenceResponse {
  preference: 'overlay' | 'small-multiples' | 'no-preference';
  comments: string;
}

/**
 * Final Preference Questionnaire Component
 *
 * Administered after both test blocks to capture overall layout preference
 * and optional open-ended feedback.
 *
 * Reference: Chapter 3, Section 3.5.2 (Methodology)
 * Chapter 4, Section 4.6 (Data Export - satisfaction metrics)
 * ISO 9241-11 Satisfaction dimension
 */
const FinalPreferenceQuestionnaire: React.FC<FinalPreferenceQuestionnaireProps> = ({
  onSubmit,
  onSkip,
}) => {
  const [preference, setPreference] = useState<string | null>(null);
  const [comments, setComments] = useState<string>('');
  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = () => {
    if (preference === null) {
      setShowValidation(true);
      return;
    }

    onSubmit({
      preference: preference as 'overlay' | 'small-multiples' | 'no-preference',
      comments: comments.trim(),
    });
  };

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreference(event.target.value);
    setShowValidation(false);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 800,
          mx: 'auto',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 2 }}>
          Final Questionnaire
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          You have now completed tasks using <strong>both</strong> visualization layouts.
          Please answer the following questions about your overall experience.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {showValidation && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please select your layout preference before proceeding.
          </Alert>
        )}

        {/* Main Question: Layout Preference */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
            Which layout would you prefer for environmental data analysis?
          </FormLabel>
          <RadioGroup
            aria-label="layout-preference"
            name="layout-preference"
            value={preference || ''}
            onChange={handlePreferenceChange}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                value="overlay"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      Overlay (Combined) Layout
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ ml: 1 }}>
                      All variables shown on a single chart with shared axis
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="small-multiples"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      Small Multiples (Separate) Layout
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ ml: 1 }}>
                      Each variable shown in its own panel in a grid
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="no-preference"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      No Preference
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ ml: 1 }}>
                      Both layouts seem equally good
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 4 }} />

        {/* Optional Comments */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
            Comments (Optional)
          </FormLabel>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please explain your preference or provide any additional feedback about the layouts:
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="For example: 'I preferred the overlay layout because...' or 'The small multiples made it easier to...'"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${comments.length}/500 characters`}
          />
        </FormControl>

        <Divider sx={{ mb: 4 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {onSkip && (
            <Button variant="outlined" onClick={onSkip}>
              Skip
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            size="large"
            sx={{ minWidth: 200 }}
          >
            Complete Experiment
          </Button>
        </Box>

        {/* Response Summary */}
        {preference && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Selection:
            </Typography>
            <Typography variant="body2">
              Preferred Layout:{' '}
              {preference === 'overlay'
                ? 'Overlay (Combined)'
                : preference === 'small-multiples'
                ? 'Small Multiples (Separate)'
                : 'No Preference'}
            </Typography>
            {comments && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Comments: "{comments.substring(0, 100)}{comments.length > 100 ? '...' : ''}"
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FinalPreferenceQuestionnaire;
