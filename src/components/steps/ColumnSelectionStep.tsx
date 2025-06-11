import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Paper,
  Grid,
  OutlinedInput,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { useVisualization } from '../../contexts/VisualizationContext';

interface ColumnSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

const ColumnSelectionStep: React.FC<ColumnSelectionStepProps> = ({ onNext, onBack }) => {
  const { files, updateAxisSelection } = useVisualization();

  const handleXAxisChange = (fileId: string, value: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateAxisSelection(fileId, value, file.selected.yAxes);
    }
  };

  const handleYAxisChange = (fileId: string, event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedYAxes = typeof value === 'string' ? [value] : value;
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateAxisSelection(fileId, file.selected.xAxis, selectedYAxes);
    }
  };

  const isReadyToProceed = () => {
    // Check if at least one file has both X and Y axes selected
    return files.every(file => 
      file.selected.xAxis && file.selected.yAxes.length > 0
    );
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Columns for Visualization
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        For each CSV file, select one column for the X-axis and one or more columns for the Y-axis.
      </Typography>

      {files.map((file) => (
        <Paper
          key={file.id}
          elevation={1}
          sx={{ 
            mb: 3, 
            p: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {file.name}
            </Typography>
          </Box>
          
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id={`x-axis-label-${file.id}`}>X-Axis</InputLabel>
                  <Select
                    labelId={`x-axis-label-${file.id}`}
                    value={file.selected.xAxis}
                    onChange={(e) => handleXAxisChange(file.id, e.target.value as string)}
                    label="X-Axis"
                  >
                    {file.columns.map((column) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a column for the X-axis</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={7}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id={`y-axis-label-${file.id}`}>Y-Axis</InputLabel>
                  <Select
                    labelId={`y-axis-label-${file.id}`}
                    multiple
                    value={file.selected.yAxes}
                    onChange={(e) => handleYAxisChange(file.id, e)}
                    input={<OutlinedInput label="Y-Axis" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {file.columns
                      .filter(column => column !== file.selected.xAxis)
                      .map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                  </Select>
                  <FormHelperText>Select one or more columns for the Y-axis</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>
      ))}

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowLeft size={18} />}
        >
          Back to Upload
        </Button>
        
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!isReadyToProceed()}
          endIcon={<Settings size={18} />}
        >
          Continue to Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default ColumnSelectionStep;