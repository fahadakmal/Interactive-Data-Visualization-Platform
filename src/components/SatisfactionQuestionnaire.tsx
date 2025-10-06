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
  Button,
  Alert,
  Divider,
} from '@mui/material';

interface SatisfactionQuestionnaireProps {
  blockId: string;
  layout: 'overlay' | 'small-multiples';
  onSubmit: (responses: { ease: number; wouldUse: number }) => void;
  onSkip?: () => void;
}

const SatisfactionQuestionnaire: React.FC<SatisfactionQuestionnaireProps> = ({
  blockId,
  layout,
  onSubmit,
  onSkip,
}) => {
  const [easeRating, setEaseRating] = useState<number | null>(null);
  const [wouldUseRating, setWouldUseRating] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const layoutDisplayName = layout === 'overlay' ? 'Overlay (Combined)' : 'Small Multiples (Separate)';

  const handleSubmit = () => {
    if (easeRating === null || wouldUseRating === null) {
      setShowValidation(true);
      return;
    }

    onSubmit({
      ease: easeRating,
      wouldUse: wouldUseRating,
    });
  };

  const handleEaseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEaseRating(Number(event.target.value));
    setShowValidation(false);
  };

  const handleWouldUseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWouldUseRating(Number(event.target.value));
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
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Block {blockId} Satisfaction Questionnaire
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          You have just completed tasks using the <strong>{layoutDisplayName}</strong> layout.
          Please answer the following questions about your experience.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {showValidation && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please answer both questions before proceeding.
          </Alert>
        )}

        {/* Question 1: Ease of Use */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
            1. How easy was it to complete tasks with this layout?
          </FormLabel>
          <RadioGroup
            aria-label="ease-rating"
            name="ease-rating"
            value={easeRating !== null ? String(easeRating) : ''}
            onChange={handleEaseChange}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                value="1"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      1 - Very Difficult
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Extremely hard to complete tasks)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="2"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      2 - Difficult
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Somewhat hard to complete tasks)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="3"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      3 - Neutral
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Neither easy nor difficult)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="4"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      4 - Easy
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Somewhat easy to complete tasks)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="5"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      5 - Very Easy
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Extremely easy to complete tasks)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 4 }} />

        {/* Question 2: Would Use */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
            2. Would you use this layout in your work?
          </FormLabel>
          <RadioGroup
            aria-label="would-use-rating"
            name="would-use-rating"
            value={wouldUseRating !== null ? String(wouldUseRating) : ''}
            onChange={handleWouldUseChange}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                value="1"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      1 - Definitely Not
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Would never use this layout)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="2"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      2 - Probably Not
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Unlikely to use this layout)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="3"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      3 - Maybe
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Might consider using this layout)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="4"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      4 - Probably Yes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Likely to use this layout)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="5"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                      5 - Definitely Yes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (Would definitely use this layout)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
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
            Submit Responses
          </Button>
        </Box>

        {/* Response Summary */}
        {(easeRating !== null || wouldUseRating !== null) && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Current Selections:
            </Typography>
            <Typography variant="body2">
              Ease of Use: {easeRating !== null ? `${easeRating}/5` : 'Not answered'}
            </Typography>
            <Typography variant="body2">
              Would Use: {wouldUseRating !== null ? `${wouldUseRating}/5` : 'Not answered'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SatisfactionQuestionnaire;
