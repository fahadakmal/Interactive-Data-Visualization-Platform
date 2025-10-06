import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface DemographicsData {
  age: string;
  education: string;
  chartExperience: string;
  environmentalBackground: string;
}

interface DemographicsFormProps {
  onSubmit: (data: DemographicsData) => void;
}

const DemographicsForm: React.FC<DemographicsFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<DemographicsData>({
    age: '',
    education: '',
    chartExperience: '',
    environmentalBackground: '',
  });

  const isFormComplete = () => {
    return (
      formData.age !== '' &&
      formData.education !== '' &&
      formData.chartExperience !== '' &&
      formData.environmentalBackground !== ''
    );
  };

  const handleSubmit = () => {
    if (isFormComplete()) {
      onSubmit(formData);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Tell Us About Yourself
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This information helps us understand our participants. All responses are anonymous.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Takes about 1 minute
        </Alert>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Age */}
          <FormControl fullWidth>
            <InputLabel>Age Group</InputLabel>
            <Select
              value={formData.age}
              label="Age Group"
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            >
              <MenuItem value="18-25">18-25</MenuItem>
              <MenuItem value="26-35">26-35</MenuItem>
              <MenuItem value="36-45">36-45</MenuItem>
              <MenuItem value="46-55">46-55</MenuItem>
              <MenuItem value="56+">56+</MenuItem>
            </Select>
          </FormControl>

          {/* Education */}
          <FormControl fullWidth>
            <InputLabel>Highest Education Level</InputLabel>
            <Select
              value={formData.education}
              label="Highest Education Level"
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            >
              <MenuItem value="high-school">High School</MenuItem>
              <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
              <MenuItem value="master">Master's Degree</MenuItem>
              <MenuItem value="phd">PhD / Doctorate</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Chart Experience */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              How often do you work with charts, graphs, or data visualizations?
            </FormLabel>
            <RadioGroup
              value={formData.chartExperience}
              onChange={(e) => setFormData({ ...formData, chartExperience: e.target.value })}
            >
              <FormControlLabel value="never" control={<Radio />} label="Never" />
              <FormControlLabel value="rarely" control={<Radio />} label="Rarely (few times a year)" />
              <FormControlLabel value="sometimes" control={<Radio />} label="Sometimes (monthly)" />
              <FormControlLabel value="often" control={<Radio />} label="Often (weekly)" />
              <FormControlLabel value="daily" control={<Radio />} label="Daily" />
            </RadioGroup>
          </FormControl>

          {/* Environmental Background */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              Do you have background in environmental science, meteorology, or climate studies?
            </FormLabel>
            <RadioGroup
              value={formData.environmentalBackground}
              onChange={(e) => setFormData({ ...formData, environmentalBackground: e.target.value })}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes - I have formal training" />
              <FormControlLabel value="some" control={<Radio />} label="Some - I'm familiar but not trained" />
              <FormControlLabel value="no" control={<Radio />} label="No - I'm not familiar" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!isFormComplete()}
            endIcon={<ArrowForward />}
            sx={{ px: 6, py: 1.5 }}
          >
            Continue
          </Button>
        </Box>

        {!isFormComplete() && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Please answer all questions to continue
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default DemographicsForm;
export type { DemographicsData };
