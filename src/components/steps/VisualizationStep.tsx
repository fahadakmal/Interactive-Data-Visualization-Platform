import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { Download, Image, RefreshCw } from 'lucide-react';
import { useVisualization } from '../../contexts/VisualizationContext';
import D3LineChart from '../visualization/D3LineChart';
import MultiChartView from '../visualization/MultiChartView';

interface VisualizationStepProps {
  onBack?: () => void;
  onReset?: () => void;
}

const VisualizationStep: React.FC<VisualizationStepProps> = ({ onBack, onReset }) => {
  const { files, chartData, chartOptions, generateChart } = useVisualization();
  const [loading, setLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  console.log(chartData)

  useEffect(() => {
    if (files.length > 0) {
      setLoading(true);
      generateChart();
      setLoading(false);
    }
  }, [files]);

  const handleRefreshChart = () => {
    setLoading(true);
    generateChart();
    setLoading(false);
  };

  const handleExportSVG = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPNG = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const filesWithData = files.map((file: any) => {
    const fileData = localStorage.getItem(`csvData_${file.id}`);
    let data = fileData ? JSON.parse(fileData) : [];
    // Convert numeric fields if needed
    data = data.map(row => {
      // Example: convert all values except xAxis to numbers
      const newRow = { ...row };
      for (const key in newRow) {
        if (!isNaN(newRow[key])) {
          newRow[key] = Number(newRow[key]);
        }
      }
      return newRow;
    });
    return {
      ...file,
      data,
    };
  });

  if (!chartData) {
    // Debug panel for loaded files
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="h6" gutterBottom>
          No Data Available
        </Typography>
        <Typography variant="body1">
          Please upload files and configure chart settings to generate a visualization.
        </Typography>
        {/* Debug information */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Debug Information:
          </Typography>
          <Typography variant="body2">
            Number of files loaded: {files.length}
          </Typography>
          {files.map((file, idx) => (
            <Box key={file.id || idx} sx={{ mb: 1 }}>
              <Typography variant="body2">
                <b>{file.name}</b> — Rows: {file.data?.length || 0}, X: {file.selected?.xAxis || 'none'}, Y: {(file.selected?.yAxes || []).join(', ') || 'none'}<br/>
                First row: {file.data && file.data.length > 0 ? JSON.stringify(file.data[0]) : 'No data'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        elevation={3}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            minHeight: 400,
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <MultiChartView
            data={chartData}
            options={chartOptions}
            onBack={onBack}
            onReset={onReset}
          />
        )}
      </Paper>
    </Box>
  );
};

export default VisualizationStep;