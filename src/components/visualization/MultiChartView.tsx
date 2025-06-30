import React, { useRef } from 'react';
import { Box, Grid, Typography, IconButton, Tooltip, Button, Divider } from '@mui/material';
import { Download, Image, RefreshCw } from 'lucide-react';
import D3LineChart from './D3LineChart';
import { ChartData, ChartOptions } from '../../types/visualization';

interface MultiChartViewProps {
  data: ChartData;
  options: ChartOptions;
  onBack?: () => void;
  onReset?: () => void;
  combineAll?: boolean;
  showHeader?: boolean;
  svgRefs: React.MutableRefObject<Map<string, SVGSVGElement>>;
}

const MultiChartView: React.FC<MultiChartViewProps> = ({ data, options, onBack, onReset, combineAll = false, showHeader = true, svgRefs }) => {
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

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {combineAll ? (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
  
                <Typography variant="h6">
                  {options.title || 'Combined Chart'}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: 550 }}>
                <D3LineChart
                  data={data}
                  options={options}
                  svgRef={setSvgRef('combined')}
                />
              </Box>
            </Box>
          ) : (
            Object.values(datasetsByFile).map(({ fileId, fileName, datasets }, idx, arr) => {
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
                  {idx < arr.length - 1 && <Divider sx={{ my: 4 }} />}
                </Box>
              );
            })
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MultiChartView; 