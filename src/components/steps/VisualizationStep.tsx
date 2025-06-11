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

  if (!chartData) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="h6" gutterBottom>
          No Data Available
        </Typography>
        <Typography variant="body1">
          Please upload files and configure chart settings to generate a visualization.
        </Typography>
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