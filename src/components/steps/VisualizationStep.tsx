import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Button,
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
  const { files, chartData, chartOptions, generateChart, chartDisplayMode, setChartDisplayMode, isSingleChartCompatible, getHybridChartGroups } = useVisualization();
  const [loading, setLoading] = useState(false);
  const [showSingleWarning, setShowSingleWarning] = useState(false);
  const svgRefs = useRef<Map<string, SVGSVGElement>>(new Map());

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
    if (svgRefs.current.has(files[0].id)) {
      const svgElement = svgRefs.current.get(files[0].id);
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
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
    }
  };

  const handleExportPNG = () => {
    if (svgRefs.current.has(files[0].id)) {
      const svgElement = svgRefs.current.get(files[0].id);
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
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
    }
  };

  const handleExportAllSvg = () => {
    const combinedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let currentY = 0;
    let maxWidth = 0;
    svgRefs.current.forEach(svgElement => {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBBox();
      clonedSvg.setAttribute("x", "0");
      clonedSvg.setAttribute("y", `${currentY}`);
      combinedSvg.appendChild(clonedSvg);
      currentY += bbox.height + 20;
      maxWidth = Math.max(maxWidth, bbox.width);
    });
    combinedSvg.setAttribute("width", `${maxWidth}`);
    combinedSvg.setAttribute("height", `${currentY}`);
    const svgData = new XMLSerializer().serializeToString(combinedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all_charts.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAllPng = () => {
    const combinedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let currentY = 0;
    let maxWidth = 0;
    svgRefs.current.forEach(svgElement => {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      const bbox = svgElement.getBBox();
      clonedSvg.setAttribute("x", "0");
      clonedSvg.setAttribute("y", `${currentY}`);
      combinedSvg.appendChild(clonedSvg);
      currentY += bbox.height + 20;
      maxWidth = Math.max(maxWidth, bbox.width);
    });
    combinedSvg.setAttribute("width", `${maxWidth}`);
    combinedSvg.setAttribute("height", `${currentY}`);
    const svgData = new XMLSerializer().serializeToString(combinedSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'all_charts.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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

  // Chart display mode toggle
  const handleDisplayModeChange = (_: any, newMode: 'single' | 'separate' | 'hybrid') => {
    if (newMode === 'single' && !isSingleChartCompatible) {
      setShowSingleWarning(true);
      return;
    }
    setShowSingleWarning(false);
    setChartDisplayMode(newMode);
  };

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
          {files.map((file, idx) => {
            const xAxis = file.selected?.xAxis;
            const xVal = file.data?.[0]?.[xAxis];
            const xType = typeof xVal;
            return (
              <Box key={file.id || idx} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <b>{file.name}</b> — Rows: {file.data?.length || 0}, X: "{xAxis}" (type: {xType}), Y: {(file.selected?.yAxes || []).join(', ') || 'none'}<br/>
                  First row: {file.data && file.data.length > 0 ? JSON.stringify(file.data[0]) : 'No data'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  // Hybrid mode logic
  const { combined, separate } = chartDisplayMode === 'hybrid' ? getHybridChartGroups() : { combined: [], separate: [] };
  const hybridDatasets = chartData && combined.length > 0
    ? { datasets: (chartData.datasets || []).filter(ds =>
        ds.fileId && combined.some(f => ds.fileId.split(',').includes(f.id))
      ) }
    : { datasets: [] };

  // Debug logging
  console.log('Chart Display Mode:', chartDisplayMode);
  console.log('Combined files:', combined.map(f => f.name));
  console.log('Separate files:', separate.map(f => f.name));
  console.log('All datasets:', chartData?.datasets?.map(ds => ({ fileId: ds.fileId, label: ds.label })));

  return (
    <Box sx={{ py: 2 }}>
      {/* Chart display mode toggle */}
      {/**
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip
          title={isSingleChartCompatible ? '' : 'All files must have the same X axis name and type to combine into a single chart.'}
          arrow
        >
          <span>
            <ToggleButtonGroup
              value={chartDisplayMode}
              exclusive
              onChange={handleDisplayModeChange}
              size="small"
              color="primary"
            >
              <ToggleButton value="separate">Separate Chart per File</ToggleButton>
              <ToggleButton value="single" disabled={!isSingleChartCompatible}>
                Single Combined Chart
              </ToggleButton>
              <ToggleButton value="hybrid">Hybrid (Combine Compatible, Separate Others)</ToggleButton>
            </ToggleButtonGroup>
          </span>
        </Tooltip>
      </Box>
       */}

      {showSingleWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cannot combine files into a single chart. All files must have the same X axis name and type.
        </Alert>
      )}
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
        {/* Main header for all charts */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Multiple Charts View</Typography>
          {
            /* Chart action buttons
                    <Box>
            {onBack && (
              <Button
                variant="outlined"
                onClick={onBack}
                startIcon={<RefreshCw size={18} />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
            )}
            {onReset && (
              <Button
                variant="outlined"
                color="error"
                onClick={onReset}
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
            )}
            {
              (chartDisplayMode !== 'single' && chartDisplayMode !== 'hybrid') && (
                <>  <Button
                variant="outlined"
                onClick={handleExportAllSvg}
                startIcon={<Download size={18} />}
                sx={{ mr: 1 }}
              >
                Download All (SVG)
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportAllPng}
                startIcon={<Image size={18} />}
              >
                Download All (PNG)
              </Button></>
              )
            }
          
          </Box>
            */
          }
  
        </Box>
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
          chartDisplayMode === 'single' ? (
            <MultiChartView
              data={chartData}
              options={chartOptions}
              onBack={onBack}
              onReset={onReset}
              combineAll={true}
              svgRefs={svgRefs}
            />
          ) : chartDisplayMode === 'hybrid' ? (
            <>
              {combined.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>Combined Chart ({combined.length} compatible files)</Typography>
                  <MultiChartView
                    data={hybridDatasets}
                    options={chartOptions}
                    onBack={onBack}
                    onReset={onReset}
                    combineAll={true}
                    svgRefs={svgRefs}
                  />
                  {separate.length > 0 && <Divider sx={{ my: 4 }} />}
                </>
              )}
              {separate.length > 0 && separate.map((file, idx) => (
                <React.Fragment key={file.id}>
                  <MultiChartView
                    data={{ datasets: (chartData?.datasets || []).filter(ds => ds.fileId === file.id) }}
                    options={chartOptions}
                    onBack={onBack}
                    onReset={onReset}
                    combineAll={false}
                    svgRefs={svgRefs}
                  />
                  {idx < separate.length - 1 && <Divider sx={{ my: 4 }} />}
                </React.Fragment>
              ))}
            </>
          ) : (
            // Render one chart per file
            files.map((file, idx) => (
              <React.Fragment key={file.id}>
                <MultiChartView
                  data={{ datasets: (chartData?.datasets || []).filter(ds => ds.fileId === file.id) }}
                  options={chartOptions}
                  onBack={onBack}
                  onReset={onReset}
                  combineAll={false}
                  svgRefs={svgRefs}
                />
                {idx < files.length - 1 && <Divider sx={{ my: 4 }} />}
              </React.Fragment>
            ))
          )
        )}
      </Paper>
    </Box>
  );
};

export default VisualizationStep;