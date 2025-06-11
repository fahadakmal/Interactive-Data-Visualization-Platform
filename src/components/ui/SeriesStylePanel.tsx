import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { Trash2, Plus } from 'lucide-react';
import { useVisualization } from '../../contexts/VisualizationContext';
import { SeriesStyle } from '../../types/visualization';

interface SeriesStylePanelProps {
  selectedFile?: string;
}

const SeriesStylePanel: React.FC<SeriesStylePanelProps> = ({ selectedFile }) => {
  const { files, chartOptions, updateFileChartConfig } = useVisualization();
  const [selectedColumn, setSelectedColumn] = React.useState<string>('');

  const handleAddStyle = () => {
    if (!selectedColumn) return;

    const newStyle: SeriesStyle = {
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      lineWidth: 2,
      lineStyle: 'solid',
    };

    if (selectedFile) {
      // Update file-specific styles
      const currentStyles = chartOptions.fileConfigs[selectedFile]?.seriesStyles || {};
      updateFileChartConfig(selectedFile, {
        seriesStyles: {
          ...currentStyles,
          [selectedColumn]: newStyle,
        },
      });
    } else {
      // Update global styles
      updateFileChartConfig('global', {
        seriesStyles: {
          ...chartOptions.seriesStyles,
          [selectedColumn]: newStyle,
        },
      });
    }

    setSelectedColumn('');
  };

  const handleStyleChange = (column: string, field: keyof SeriesStyle, value: string | number) => {
    if (selectedFile) {
      // Update file-specific style
      const currentStyles = chartOptions.fileConfigs[selectedFile]?.seriesStyles || {};
      const currentStyle = currentStyles[column] || chartOptions.seriesStyles[column];
      updateFileChartConfig(selectedFile, {
        seriesStyles: {
          ...currentStyles,
          [column]: {
            ...currentStyle,
            [field]: value,
          },
        },
      });
    } else {
      // Update global style
      updateFileChartConfig('global', {
        seriesStyles: {
          ...chartOptions.seriesStyles,
          [column]: {
            ...chartOptions.seriesStyles[column],
            [field]: value,
          },
        },
      });
    }
  };

  const handleRemoveStyle = (column: string) => {
    if (selectedFile) {
      // Remove file-specific style
      const currentStyles = { ...chartOptions.fileConfigs[selectedFile]?.seriesStyles };
      delete currentStyles[column];
      updateFileChartConfig(selectedFile, {
        seriesStyles: currentStyles,
      });
    } else {
      // Remove global style
      const currentStyles = { ...chartOptions.seriesStyles };
      delete currentStyles[column];
      updateFileChartConfig('global', {
        seriesStyles: currentStyles,
      });
    }
  };

  // Get available columns from the selected file or all files
  const availableColumns = React.useMemo(() => {
    if (selectedFile) {
      const file = files.find(f => f.id === selectedFile);
      return file?.columns || [];
    }
    // For global settings, show columns from all files
    return Array.from(new Set(files.flatMap(f => f.columns)));
  }, [files, selectedFile]);

  // Get current styles based on selected file or global
  const currentStyles = React.useMemo(() => {
    if (selectedFile) {
      return chartOptions.fileConfigs[selectedFile]?.seriesStyles || {};
    }
    return chartOptions.seriesStyles;
  }, [chartOptions, selectedFile]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Series Styling
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={8}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Column</InputLabel>
            <Select
              value={selectedColumn}
              label="Select Column"
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              {availableColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title="Add Style">
            <IconButton
              onClick={handleAddStyle}
              disabled={!selectedColumn}
              color="primary"
            >
              <Plus size={20} />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      {Object.entries(currentStyles).map(([column, style]) => (
        <Box key={column} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {column}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Color"
                type="color"
                value={style.color}
                onChange={(e) => handleStyleChange(column, 'color', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Line Width"
                type="number"
                value={style.lineWidth}
                onChange={(e) => handleStyleChange(column, 'lineWidth', Number(e.target.value))}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 5, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Line Style</InputLabel>
                <Select
                  value={style.lineStyle}
                  label="Line Style"
                  onChange={(e) => handleStyleChange(column, 'lineStyle', e.target.value)}
                >
                  <MenuItem value="solid">Solid</MenuItem>
                  <MenuItem value="dashed">Dashed</MenuItem>
                  <MenuItem value="dotted">Dotted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="Remove Style">
                <IconButton
                  onClick={() => handleRemoveStyle(column)}
                  color="error"
                  size="small"
                >
                  <Trash2 size={18} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default SeriesStylePanel;