import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  FormHelperText,
  Divider,
} from '@mui/material';
import { AxisConfig } from '../../types/visualization';
import { useVisualization } from '../../contexts/VisualizationContext';

interface AxisSettingsPanelProps {
  axis: 'x' | 'y';
  config: AxisConfig;
  onChange: (config: Partial<AxisConfig>) => void;
}

const AxisSettingsPanel: React.FC<AxisSettingsPanelProps> = ({ axis, config, onChange }) => {
  const { generateChart } = useVisualization();

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ label: event.target.value });
    generateChart();
  };

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? undefined : Number(event.target.value);
    onChange({ min: value });
    generateChart();
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? undefined : Number(event.target.value);
    onChange({ max: value });
    generateChart();
  };

  const handleAutoScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const autoScale = event.target.checked;
    onChange({ 
      autoScale,
      // If autoScale is enabled, clear min/max values
      ...(autoScale ? { min: undefined, max: undefined } : {})
    });
    generateChart();
  };

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        {axis.toUpperCase()}-Axis Settings
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Axis Label"
          variant="outlined"
          value={config.label}
          onChange={handleLabelChange}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={config.autoScale} 
              onChange={handleAutoScaleChange}
              color="primary"
            />
          }
          label="Auto Scale"
        />
        <FormHelperText>
          Automatically determine the axis scale based on data values
        </FormHelperText>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" gutterBottom>
          Manual Scale Range
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <TextField
            label="Min"
            type="number"
            variant="outlined"
            disabled={config.autoScale}
            value={config.min === undefined ? '' : config.min}
            onChange={handleMinChange}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Max"
            type="number"
            variant="outlined"
            disabled={config.autoScale}
            value={config.max === undefined ? '' : config.max}
            onChange={handleMaxChange}
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AxisSettingsPanel;