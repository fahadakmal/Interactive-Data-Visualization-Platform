import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Button,
  Alert,
  Divider,
} from '@mui/material';

/**
 * UMUX (Usability Metric for User Experience) Questionnaire Component
 *
 * Based on Borsci et al. (2015) - 4-item validated usability questionnaire
 *
 * Scoring Formula:
 * UMUX = [(q1-1) + (8-q2-1) + (q3-1) + (8-q4-1)] × (100/24)
 *
 * Items 2 and 4 are reverse-scored
 * Score range: 0-100 (higher = better usability)
 *
 * Reference: Borsci, S., Federici, S., Bianchi, M., Malizia, A., & De Filippis, M. L. (2015).
 * UMUX-LITE-When usability meets user experience: The UMUX-LITE as a tool for usability evaluation.
 * Interacting with Computers, 27(1), 45-57.
 */

interface UMUXQuestionnaireProps {
  layoutName: string; // "Overlay" or "Small Multiples"
  onSubmit: (responses: UMUXResponse) => void;
}

export interface UMUXResponse {
  q1_requirements: number; // 1-7 scale
  q2_frustrating: number; // 1-7 scale (reverse scored)
  q3_easy_to_use: number; // 1-7 scale
  q4_time_correcting: number; // 1-7 scale (reverse scored)
  umux_score: number; // 0-100 calculated score
  timestamp: string;
  layoutEvaluated: string;
}

const UMUXQuestionnaire: React.FC<UMUXQuestionnaireProps> = ({ layoutName, onSubmit }) => {
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Calculate UMUX score: [(q1-1) + (8-q2-1) + (q3-1) + (8-q4-1)] × (100/24)
  const calculateUMUXScore = (q1: number, q2: number, q3: number, q4: number): number => {
    const score = ((q1 - 1) + (8 - q2 - 1) + (q3 - 1) + (8 - q4 - 1)) * (100 / 24);
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  };

  const handleSubmit = () => {
    // Validate all questions answered
    if (q1 === null || q2 === null || q3 === null || q4 === null) {
      setError('Please answer all 4 questions before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const umuxScore = calculateUMUXScore(q1, q2, q3, q4);

    const response: UMUXResponse = {
      q1_requirements: q1,
      q2_frustrating: q2,
      q3_easy_to_use: q3,
      q4_time_correcting: q4,
      umux_score: umuxScore,
      timestamp: new Date().toISOString(),
      layoutEvaluated: layoutName,
    };

    console.log('✅ UMUX Score calculated:', umuxScore);
    console.log('✅ UMUX Responses:', response);

    onSubmit(response);
  };

  const scaleLabels = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Slightly Disagree' },
    { value: 4, label: 'Neutral' },
    { value: 5, label: 'Slightly Agree' },
    { value: 6, label: 'Agree' },
    { value: 7, label: 'Strongly Agree' },
  ];

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto', my: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        Usability Questionnaire (UMUX)
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Please rate your experience with the <strong>{layoutName}</strong> layout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Please indicate your level of agreement with each statement using the 7-point scale
          (1 = Strongly Disagree, 7 = Strongly Agree).
        </Typography>
      </Alert>

      <Divider sx={{ my: 3 }} />

      {/* Question 1: Requirements fit */}
      <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
          1. This layout's capabilities meet my requirements
        </FormLabel>
        <RadioGroup
          value={q1 ?? ''}
          onChange={(e) => setQ1(Number(e.target.value))}
          sx={{ pl: 2 }}
        >
          {scaleLabels.map((item) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={`${item.value} - ${item.label}`}
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Question 2: Frustrating experience (reverse scored) */}
      <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
          2. Using this layout is a frustrating experience
        </FormLabel>
        <RadioGroup
          value={q2 ?? ''}
          onChange={(e) => setQ2(Number(e.target.value))}
          sx={{ pl: 2 }}
        >
          {scaleLabels.map((item) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={`${item.value} - ${item.label}`}
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Question 3: Easy to use */}
      <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
          3. This layout is easy to use
        </FormLabel>
        <RadioGroup
          value={q3 ?? ''}
          onChange={(e) => setQ3(Number(e.target.value))}
          sx={{ pl: 2 }}
        >
          {scaleLabels.map((item) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={`${item.value} - ${item.label}`}
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Question 4: Time correcting (reverse scored) */}
      <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
          4. I have to spend too much time correcting things with this layout
        </FormLabel>
        <RadioGroup
          value={q4 ?? ''}
          onChange={(e) => setQ4(Number(e.target.value))}
          sx={{ pl: 2 }}
        >
          {scaleLabels.map((item) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={`${item.value} - ${item.label}`}
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          sx={{ minWidth: 200 }}
        >
          Submit Questionnaire
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
        UMUX scoring: Items 2 and 4 are reverse-scored. Final score (0-100): [(q1-1) + (8-q2-1) + (q3-1) + (8-q4-1)] × (100/24)
      </Typography>
    </Paper>
  );
};

export default UMUXQuestionnaire;
