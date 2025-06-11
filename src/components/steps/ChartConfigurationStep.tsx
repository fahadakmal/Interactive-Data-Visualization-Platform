import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
  TextField,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { CSVFile, LineStyle, PointStyle } from '../../types/visualization';
import { useVisualization } from '../../contexts/VisualizationContext';
import AxisSettingsPanel from '../ui/AxisSettingsPanel';

interface ChartConfigurationStepProps {
  onNext: () => void;
  onBack: () => void;
}

const ChartConfigurationStep: React.FC<ChartConfigurationStepProps> = ({ onNext, onBack }) => {
  const { files, chartOptions, updateLineStyle, updatePointStyle, updateColor, renameAxis, updateFileChartConfig, updateShowPoints, updateShowLine } = useVisualization();
  const [selectedColumn, setSelectedColumn] = useState<string>(
    files[0]?.selected.yAxes.length > 0 ? files[0].selected.yAxes[0] : ''
  );
  const [newName, setNewName] = useState<string>('');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
    setNewName(''); // Reset new name input when column changes
  };

  const handleLineStyleChange = (value: LineStyle) => {
    if (selectedColumn) {
      updateLineStyle(files[selectedFileIndex].id, selectedColumn, value);
    }
  };

  const handlePointStyleChange = (value: PointStyle) => {
    if (selectedColumn) {
      updatePointStyle(files[selectedFileIndex].id, selectedColumn, value);
    }
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedColumn) {
      updateColor(files[selectedFileIndex].id, selectedColumn, event.target.value);
    }
  };

  const handleShowPointsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedColumn) {
      updateShowPoints(files[selectedFileIndex].id, selectedColumn, event.target.checked);
    }
  };

  const handleShowLineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedColumn) {
      updateShowLine(files[selectedFileIndex].id, selectedColumn, event.target.checked);
    }
  };

  const handleRenameColumn = () => {
    if (selectedColumn && newName.trim()) {
      renameAxis(files[selectedFileIndex].id, selectedColumn, newName.trim());
      setSelectedColumn(newName.trim());
      setNewName('');
    }
  };

  const handleFileConfigChange = (fileId: string, config: any) => {
    updateFileChartConfig(fileId, config);
  };

  // Get style for the selected column
  const columnStyle = selectedColumn ? files[selectedFileIndex].columnStyles[selectedColumn] : null;

  if (!files[selectedFileIndex].selected.yAxes.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No Y-axis columns selected for this file.
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs
        value={selectedFileIndex}
        onChange={(_, newValue) => setSelectedFileIndex(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ 
          mb: 3,
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': { opacity: 0.3 }
          }
        }}
      >
        {files.map((file, index) => (
          <Tab key={file.id} label={file.name} />
        ))}
      </Tabs>

      <Typography variant="subtitle2" gutterBottom>
        Select Column to Style:
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {files[selectedFileIndex].selected.yAxes.map((column) => (
          <Chip
            key={column}
            label={column}
            onClick={() => handleColumnSelect(column)}
            variant={selectedColumn === column ? "filled" : "outlined"}
            color={selectedColumn === column ? "primary" : "default"}
            sx={{ px: 1 }}
          />
        ))}
      </Box>
      
      {selectedColumn && columnStyle && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Line Properties
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id={`line-style-${files[selectedFileIndex].id}-${selectedColumn}`}>
                  Line Style
                </InputLabel>
                <Select
                  labelId={`line-style-${files[selectedFileIndex].id}-${selectedColumn}`}
                  value={columnStyle.lineStyle}
                  onChange={(e) => handleLineStyleChange(e.target.value as LineStyle)}
                  label="Line Style"
                >
                  <MenuItem value="solid">Solid</MenuItem>
                  <MenuItem value="dashed">Dashed</MenuItem>
                  <MenuItem value="dotted">Dotted</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={columnStyle.showLine} 
                    onChange={handleShowLineChange}
                    color="primary"
                  />
                }
                label="Show Line"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Point Properties
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id={`point-style-${files[selectedFileIndex].id}-${selectedColumn}`}>
                  Point Style
                </InputLabel>
                <Select
                  labelId={`point-style-${files[selectedFileIndex].id}-${selectedColumn}`}
                  value={columnStyle.pointStyle}
                  onChange={(e) => handlePointStyleChange(e.target.value as PointStyle)}
                  label="Point Style"
                >
                  <MenuItem value="circle">Circle</MenuItem>
                  <MenuItem value="square">Square</MenuItem>
                  <MenuItem value="triangle">Triangle</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={columnStyle.showPoints} 
                    onChange={handleShowPointsChange}
                    color="primary"
                  />
                }
                label="Show Points"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Color & Labeling
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Series Color"
                    type="color"
                    value={columnStyle.color}
                    onChange={handleColorChange}
                    fullWidth
                    sx={{
                      '& input': {
                        height: 40,
                        padding: 1,
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="New Column Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleRenameColumn}
                      disabled={!newName.trim()}
                    >
                      Rename
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        File-Specific Chart Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            X-Axis Settings
          </Typography>
          <AxisSettingsPanel
            axis="x"
            config={chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.axisConfig.x || chartOptions.axisConfig.x}
            onChange={(config) => handleFileConfigChange(files[selectedFileIndex].id, {
              axisConfig: {
                x: config,
                y: chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.axisConfig.y || chartOptions.axisConfig.y,
              },
            })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Y-Axis Settings
          </Typography>
          <AxisSettingsPanel
            axis="y"
            config={chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.axisConfig.y || chartOptions.axisConfig.y}
            onChange={(config) => handleFileConfigChange(files[selectedFileIndex].id, {
              axisConfig: {
                x: chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.axisConfig.x || chartOptions.axisConfig.x,
                y: config,
              },
            })}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        Chart Dimensions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Chart Width"
            type="number"
            value={chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.chartWidth || chartOptions.chartWidth || ''}
            onChange={(e) => handleFileConfigChange(files[selectedFileIndex].id, { chartWidth: Number(e.target.value) })}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Chart Height"
            type="number"
            value={chartOptions.fileConfigs?.[files[selectedFileIndex].id]?.chartHeight || chartOptions.chartHeight || ''}
            onChange={(e) => handleFileConfigChange(files[selectedFileIndex].id, { chartHeight: Number(e.target.value) })}
            inputProps={{ min: 0 }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button onClick={onNext} variant="contained" color="primary">
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default ChartConfigurationStep;