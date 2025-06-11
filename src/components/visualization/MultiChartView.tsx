import React, { useRef } from 'react';
import { Box, Grid, Typography, IconButton, Tooltip, Paper, Divider, Button } from '@mui/material';
import { Download, Image, RefreshCw } from 'lucide-react';
import D3LineChart from './D3LineChart';
import { ChartData, ChartOptions } from '../../types/visualization';

interface MultiChartViewProps {
  data: ChartData;
  options: ChartOptions;
  onBack?: () => void;
  onReset?: () => void;
}

const MultiChartView: React.FC<MultiChartViewProps> = ({ data, options, onBack, onReset }) => {
  const svgRefs = useRef<Map<string, SVGSVGElement>>(new Map());

  const setSvgRef = (fileId: string) => (element: SVGSVGElement | null) => {
    if (element) {
      svgRefs.current.set(fileId, element);
    } else {
      svgRefs.current.delete(fileId);
    }
  };

  // Group datasets by file
  const datasetsByFile = data.datasets.reduce((acc, dataset) => {
    if (!acc[dataset.fileId]) {
      acc[dataset.fileId] = {
        fileId: dataset.fileId,
        fileName: dataset.fileName,
        datasets: []
      };
    }
    acc[dataset.fileId].datasets.push(dataset);
    return acc;
  }, {} as Record<string, { fileId: string; fileName: string; datasets: typeof data.datasets }>);

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
      currentY += bbox.height + 20; // Add some padding between charts
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
      currentY += bbox.height + 20; // Add some padding between charts
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

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Multiple Charts View</Typography>
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
          <Button
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
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            {Object.values(datasetsByFile).map(({ fileId, fileName, datasets }) => {
              const handleExportSVG = () => {
                const svgElement = svgRefs.current.get(fileId);
                if (svgElement) {
                  const svgData = new XMLSerializer().serializeToString(svgElement);
                  const blob = new Blob([svgData], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${fileName.replace('.csv', '')}.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              };

              const handleExportPNG = () => {
                const svgElement = svgRefs.current.get(fileId);
                if (svgElement) {
                  const svgData = new XMLSerializer().serializeToString(svgElement);
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
                    link.download = `${fileName.replace('.csv', '')}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                }
              };

              return (
                <Box key={fileId} sx={{ mb: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6">
                      {options.fileConfigs?.[fileId]?.title || `${fileName}`}
                    </Typography>
                    <Box>
                      <Tooltip title="Download SVG">
                        <IconButton onClick={handleExportSVG} size="small">
                          <Download size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download PNG">
                        <IconButton onClick={handleExportPNG} size="small">
                          <Image size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ width: '100%', height: 550 }}>
                    <D3LineChart
                      data={{ datasets }}
                      options={{
                        ...options,
                        ...options.fileConfigs?.[fileId],
                        title: options.fileConfigs?.[fileId]?.title || `${fileName}`,
                        axisConfig: {
                          x: {
                            ...options.axisConfig.x,
                            ...options.fileConfigs?.[fileId]?.axisConfig.x,
                            label: options.fileConfigs?.[fileId]?.axisConfig.x?.label || options.axisConfig.x.label || datasets[0]?.xAxisName || 'X Axis',
                          },
                          y: {
                            ...options.axisConfig.y,
                            ...options.fileConfigs?.[fileId]?.axisConfig.y,
                            label: options.fileConfigs?.[fileId]?.axisConfig.y?.label || options.axisConfig.y.label,
                          },
                        },
                      }}
                      svgRef={setSvgRef(fileId)}
                    />
                  </Box>
                  <Divider sx={{ mt: 4 }} />
                </Box>
              );
            })}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MultiChartView; 