import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  CSVFile, 
  ChartOptions, 
  ChartData, 
  LineStyle, 
  PointStyle,
  AxisConfig
} from '../types/visualization';
import { parseCSV } from '../utils/csvParser';

interface VisualizationContextType {
  files: CSVFile[];
  chartData: ChartData | null;
  chartOptions: ChartOptions;
  chartDisplayMode: 'single' | 'separate' | 'hybrid';
  setChartDisplayMode: (mode: 'single' | 'separate' | 'hybrid') => void;
  isSingleChartCompatible: boolean;
  getHybridChartGroups: () => { combined: CSVFile[]; separate: CSVFile[] };
  addFile: (file: File) => Promise<void>;
  removeFile: (id: string) => void;
  updateAxisSelection: (fileId: string, xAxis: string, yAxes: string[]) => void;
  updateLineStyle: (fileId: string, column: string, style: LineStyle) => void;
  updatePointStyle: (fileId: string, column: string, style: PointStyle) => void;
  updateColor: (fileId: string, column: string, color: string) => void;
  updateAxisConfig: (axis: 'x' | 'y', config: Partial<AxisConfig>) => void;
  renameAxis: (fileId: string, originalName: string, newName: string) => void;
  generateChart: () => void;
  resetChart: () => void;
  updateChartTitle: (title: string) => void;
  updateFileChartConfig: (fileId: string, config: Partial<ChartOptions>) => void;
  updateShowPoints: (fileId: string, column: string, showPoints: boolean) => void;
  updateShowLine: (fileId: string, column: string, showLine: boolean) => void;
  saveFilesToLocalStorage: (newFiles: CSVFile[]) => void;
  saveChartOptionsToLocalStorage: (newOptions: ChartOptions) => void;
  loadFilesFromLocalStorage: () => void;
}

const DEFAULT_CHART_OPTIONS: ChartOptions = {
  title: '',
  showLegend: true,
  showGrid: true,
  axisConfig: {
    x: {
      label: '',
      showLabel: true,
      showTicks: true,
      tickRotation: 0,
      autoScale: true,
    },
    y: {
      label: 'Y Axis',
      showLabel: true,
      showTicks: true,
      tickRotation: 0,
      autoScale: true,
    },
  },
  seriesStyles: {},
};

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

export const VisualizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartOptions, setChartOptions] = useState<ChartOptions>(DEFAULT_CHART_OPTIONS);
  const [chartDisplayMode, setChartDisplayMode] = useState<'single' | 'separate' | 'hybrid'>('separate');
  
  // Load data from localStorage on application startup
  useEffect(() => {
    loadFilesFromLocalStorage();
  }, []);
  
  // Always generate chart when files change and there are files
  useEffect(() => {
    if (files.length > 0) {
      generateChart();
    }
  }, [files]);
  
  // Always regenerate chart data when chartDisplayMode changes
  useEffect(() => {
    if (files.length > 0) {
      generateChart();
    }
  }, [chartDisplayMode]);
  
  const addFile = async (file: File) => {
    try {
      const parsedData = await parseCSV(file);
      const columns = Object.keys(parsedData.data[0] || {});
      
      const defaultXAxis = columns[0] || '';
      const defaultYAxes = columns.length > 1 ? [columns[1]] : [];
      
      const newFile: CSVFile = {
        id: uuidv4(),
        name: file.name,
        columns,
        data: parsedData.data,
        selected: {
          xAxis: defaultXAxis,
          yAxes: defaultYAxes,
        },
        columnStyles: {},
      };
      
      // Initialize column styles with default values
      columns.forEach(col => {
        newFile.columnStyles[col] = {
          color: getRandomColor(),
          lineStyle: 'solid',
          pointStyle: 'circle',
          showPoints: true,
          showLine: true,
        };
      });
      
      setFiles(prev => {
        const newFiles = [...prev, newFile];
        saveFilesToLocalStorage(newFiles);
        return newFiles;
      });
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  };
  
  const removeFile = (id: string) => {
    // Remove the file data from localStorage
    localStorage.removeItem(`csvData_${id}`);
    setFiles(prev => {
      const newFiles = prev.filter(file => file.id !== id);
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const updateAxisSelection = (fileId: string, xAxis: string, yAxes: string[]) => {
    setFiles(prev => {
      const newFiles = prev.map(file => 
        file.id === fileId 
          ? {
              ...file,
              selected: {
                xAxis,
                yAxes: file.selected.xAxis !== xAxis
                  ? file.columns.filter(col => col !== xAxis).slice(0, 1) // reset to first available y
                  : yAxes
              }
            }
          : file
      );
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const updateLineStyle = (fileId: string, column: string, style: LineStyle) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId && file.columnStyles[column]) {
          return {
            ...file,
            columnStyles: {
              ...file.columnStyles,
              [column]: {
                ...file.columnStyles[column],
                lineStyle: style,
              },
            },
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const updatePointStyle = (fileId: string, column: string, style: PointStyle) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId && file.columnStyles[column]) {
          return {
            ...file,
            columnStyles: {
              ...file.columnStyles,
              [column]: {
                ...file.columnStyles[column],
                pointStyle: style,
              },
            },
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const updateColor = (fileId: string, column: string, color: string) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId && file.columnStyles[column]) {
          return {
            ...file,
            columnStyles: {
              ...file.columnStyles,
              [column]: {
                ...file.columnStyles[column],
                color,
              },
            },
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const updateAxisConfig = (axis: 'x' | 'y', config: Partial<AxisConfig>) => {
    setChartOptions(prev => {
      const newOptions = {
        ...prev,
        axisConfig: {
          ...prev.axisConfig,
          [axis]: {
            ...prev.axisConfig[axis],
            ...config,
          },
        },
      };
      saveChartOptionsToLocalStorage(newOptions);
      return newOptions;
    });
  };
  
  const renameAxis = (fileId: string, originalName: string, newName: string) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId) {
          // Update column name in the columns array
          const updatedColumns = file.columns.map(col => 
            col === originalName ? newName : col
          );
          
          // Update selected axes if needed
          const updatedSelected = {
            xAxis: file.selected.xAxis === originalName ? newName : file.selected.xAxis,
            yAxes: file.selected.yAxes.map(y => y === originalName ? newName : y),
          };
          
          // Update column styles
          const updatedStyles = { ...file.columnStyles };
          if (updatedStyles[originalName]) {
            updatedStyles[newName] = updatedStyles[originalName];
            delete updatedStyles[originalName];
          }
          
          // Create updated data with renamed column
          const updatedData = file.data.map(row => {
            const newRow = { ...row };
            if (originalName in newRow) {
              newRow[newName] = newRow[originalName];
              delete newRow[originalName];
            }
            return newRow;
          });
          
          return {
            ...file,
            columns: updatedColumns,
            selected: updatedSelected,
            columnStyles: updatedStyles,
            data: updatedData,
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };

  //updateChartTitle
  const updateChartTitle = (newTitle: string) => {
    setChartOptions(prev => {
      const newOptions = {
        ...prev,
        title: newTitle,
      };
      saveChartOptionsToLocalStorage(newOptions);
      return newOptions;
    });
  };
  
  // Helper function to combine datasets with the same column names
  const combineDatasetsByColumnName = (datasets: ChartData['datasets']): ChartData['datasets'] => {
    // Debug: print all dataset axis names and types
    datasets.forEach(ds => {
      console.log('Dataset:', {
        xAxisName: ds.xAxisName,
        yAxisName: ds.yAxisName,
        fileName: ds.fileName,
        xType: typeof ds.data[0]?.x
      });
    });
    // Group datasets by trimmed/lowercased xAxisName and xAxis type
    const xAxisGroups = new Map<string, ChartData['datasets']>();
    datasets.forEach(ds => {
      const xName = (ds.xAxisName || '').toString().trim().toLowerCase();
      const xType = typeof ds.data[0]?.x;
      const key = `${xName}||${xType}`;
      if (!xAxisGroups.has(key)) xAxisGroups.set(key, []);
      xAxisGroups.get(key)!.push(ds);
    });
    const mergedDatasets: ChartData['datasets'] = [];
    xAxisGroups.forEach((group, groupKey) => {
      // Find all unique yAxisNames in this group (trimmed/lowercased)
      const yNames = Array.from(new Set(group.map(ds => (ds.yAxisName || '').toString().trim().toLowerCase())));
      yNames.forEach(yName => {
        // Merge all datasets in this group with this yAxisName
        const toMerge = group.filter(ds => (ds.yAxisName || '').toString().trim().toLowerCase() === yName);
        if (toMerge.length === 0) return;
        // Merge data points
        let mergedData: { x: number, y: number }[] = [];
        toMerge.forEach(ds => {
          mergedData = mergedData.concat(ds.data);
        });
        mergedData.sort((a, b) => a.x - b.x);
        // Use style from the first dataset with this yName
        const style = toMerge[0].style;
        // Use isDateXAxis/isDateYAxis from the first dataset
        const { isDateXAxis, isDateYAxis } = toMerge[0];
        // Merge fileIds and fileNames for debug/legend if needed
        const fileIds = toMerge.map(ds => ds.fileId);
        const fileNames = toMerge.map(ds => ds.fileName);
        // Sanitize id for CSS selector compatibility
        const safeId = `combined-${groupKey}-${yName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        console.log('Merging group key:', groupKey, 'Y:', yName, 'fileNames:', fileNames);
        mergedDatasets.push({
          id: safeId,
          fileId: fileIds.join(','),
          fileName: fileNames.join(', '),
          label: yName,
          xAxisName: toMerge[0].xAxisName,
          yAxisName: yName,
          data: mergedData,
          style,
          isDateXAxis,
          isDateYAxis,
        });
      });
    });
    return mergedDatasets;
  };
  
  const generateChart = () => {
    if (files.length === 0) {
      setChartData(null);
      return;
    }
    const datasets: ChartData['datasets'] = [];
    files.forEach(file => {
      const { selected, data, columnStyles } = file;
      if (!selected.xAxis || selected.yAxes.length === 0) return;
      let isDateXAxis = false;
      for (let row of data) {
        const value = row[selected.xAxis];
        if (value instanceof Date) {
          isDateXAxis = true;
          break;
        }
      }
      selected.yAxes.forEach(yAxis => {
        let isDateYAxis = false;
        for (let row of data) {
          const value = row[yAxis];
          if (value instanceof Date) {
            isDateYAxis = true;
            break;
          }
        }
        const points = data
          .filter(row => {
            const xVal = row[selected.xAxis];
            const yVal = row[yAxis];
            if (typeof xVal === 'string' && (xVal === '' || xVal === 'NaN')) return false;
            if (typeof yVal === 'string' && (yVal === '' || yVal === 'NaN')) return false;
            if (xVal === undefined || xVal === null || yVal === undefined || yVal === null) return false;
            return true;
          })
          .map(row => {
            const xValue = row[selected.xAxis];
            const yValue = row[yAxis];
            return {
              x: xValue instanceof Date ? xValue.getTime() : (xValue as number),
              y: yValue instanceof Date ? yValue.getTime() : (yValue as number),
            };
          })
          .filter(point => !isNaN(point.x) && !isNaN(point.y))
          .sort((a, b) => a.x - b.x);
        let warning = undefined;
        if (points.length > 1 && !isDateYAxis) {
          const yVals = points.map(p => p.y);
          const yMin = Math.min(...yVals);
          const yMax = Math.max(...yVals);
          if (yMin !== 0 && yMax / yMin > 10) {
            warning = 'Possible outlier detected in Y values.';
          }
        }
        if (points.length > 0) {
          const dataset = {
            id: `${file.id}-${yAxis}`,
            fileId: file.id,
            fileName: file.name,
            label: yAxis,
            xAxisName: selected.xAxis,
            yAxisName: yAxis,
            data: points,
            style: columnStyles[yAxis] || {
              color: '#8884d8',
              lineStyle: 'solid',
              pointStyle: 'circle',
              showPoints: true,
              showLine: true,
            },
            isDateXAxis,
            isDateYAxis,
            warning,
          };
          datasets.push(dataset);
        }
      });
    });
    if (datasets.length > 0) {
      let finalDatasets = datasets;
      if (chartDisplayMode === 'single') {
        finalDatasets = combineDatasetsByColumnName(datasets);
      } else if (chartDisplayMode === 'hybrid') {
        const { combined } = getHybridChartGroups();
        const combinedFileIds = combined.map(f => f.id);
        const combinedDatasets = datasets.filter(ds => combinedFileIds.includes(ds.fileId));
        const separateDatasets = datasets.filter(ds => !combinedFileIds.includes(ds.fileId));
        const mergedCombinedDatasets = combineDatasetsByColumnName(combinedDatasets);
        finalDatasets = [...mergedCombinedDatasets, ...separateDatasets];
      }
      setChartData({
        datasets: finalDatasets,
      });
    } else {
      setChartData(null);
    }
  };
  
  const resetChart = () => {
    setChartData(null);
  };
  
const getRandomColor = () => {
  const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return randomColor;
};
  
  const updateFileChartConfig = (fileId: string, config: Partial<ChartOptions>) => {
    setChartOptions(prev => {
      const currentFileConfig = prev.fileConfigs?.[fileId] || {
        title: prev.title,
        showLegend: prev.showLegend,
        showGrid: prev.showGrid,
        axisConfig: {
          x: { ...prev.axisConfig.x },
          y: { ...prev.axisConfig.y },
        },
      };

      const newOptions = {
        ...prev,
        fileConfigs: {
          ...prev.fileConfigs,
          [fileId]: {
            ...currentFileConfig,
            ...config,
            axisConfig: {
              x: {
                ...currentFileConfig.axisConfig.x,
                ...config.axisConfig?.x,
              },
              y: {
                ...currentFileConfig.axisConfig.y,
                ...config.axisConfig?.y,
              },
            },
          },
        },
      };
      saveChartOptionsToLocalStorage(newOptions);
      return newOptions;
    });
  };
  
  const updateShowPoints = (fileId: string, column: string, showPoints: boolean) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId && file.columnStyles[column]) {
          return {
            ...file,
            columnStyles: {
              ...file.columnStyles,
              [column]: {
                ...file.columnStyles[column],
                showPoints,
              },
            },
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };

  const updateShowLine = (fileId: string, column: string, showLine: boolean) => {
    setFiles(prev => {
      const newFiles = prev.map(file => {
        if (file.id === fileId && file.columnStyles[column]) {
          return {
            ...file,
            columnStyles: {
              ...file.columnStyles,
              [column]: {
                ...file.columnStyles[column],
                showLine,
              },
            },
          };
        }
        return file;
      });
      saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };
  
  const saveFilesToLocalStorage = (newFiles: CSVFile[]) => {
    try {
      // Save metadata
      const filesMetadata = newFiles.map(file => ({
        id: file.id,
        name: file.name,
        columns: file.columns,
        selected: file.selected,
        columnStyles: file.columnStyles,
      }));
      localStorage.setItem('csvFiles', JSON.stringify(filesMetadata));
      
      // Save each file's data separately
      newFiles.forEach(file => {
        if (file.data && file.data.length > 0) {
          localStorage.setItem(`csvData_${file.id}`, JSON.stringify(file.data));
        }
      });
    } catch (error) {
      console.error('Error saving files data:', error);
    }
  };
  
  const saveChartOptionsToLocalStorage = (newOptions: ChartOptions) => {
    try {
      localStorage.setItem('chartOptions', JSON.stringify(newOptions));
    } catch (error) {
      console.error('Error saving chart options:', error);
    }
  };
  
  const loadFilesFromLocalStorage = () => {
    const savedFiles = localStorage.getItem('csvFiles');
    const savedOptions = localStorage.getItem('chartOptions');
    
    if (savedFiles) {
      try {
        const filesMetadata = JSON.parse(savedFiles);
        // Load each file's data from localStorage
        const filesWithData = filesMetadata.map((file: any) => {
          const fileData = localStorage.getItem(`csvData_${file.id}`);
          let data = fileData ? JSON.parse(fileData) : [];
          // Convert numeric fields and parse dates for xAxis
          data = data.map((row: any) => {
            const newRow: any = { ...row };
            for (const key in newRow) {
              // If this is the xAxis and looks like a date, parse it
              if (key === file.selected?.xAxis && typeof newRow[key] === 'string' && !isNaN(Date.parse(newRow[key]))) {
                newRow[key] = new Date(newRow[key]);
              } else if (newRow[key] !== null && newRow[key] !== '' && !isNaN(newRow[key])) {
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
        setFiles(filesWithData);
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
    
    if (savedOptions) {
      try {
        setChartOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error('Error loading saved options:', error);
      }
    }
  };
  
  // Compatibility check for single chart
  const isSingleChartCompatible = React.useMemo(() => {
    if (files.length < 2) return true;
    const firstFile = files[0];
    const xAxisName = firstFile.selected?.xAxis;
    if (!xAxisName) return false;
    const xType = typeof (firstFile.data?.[0]?.[xAxisName]);
    for (let file of files) {
      if (file.selected?.xAxis !== xAxisName) return false;
      const thisType = typeof (file.data?.[0]?.[xAxisName]);
      if (thisType !== xType) return false;
    }
    return true;
  }, [files]);
  
  // Hybrid grouping: find largest compatible group, rest are separate
  const getHybridChartGroups = React.useCallback(() => {
    if (files.length < 2) return { combined: files, separate: [] };
    // Group by xAxis name/type and numeric Y axes
    const groups: { [key: string]: CSVFile[] } = {};
    files.forEach(file => {
      let xAxisName = file.selected?.xAxis;
      if (typeof xAxisName === 'string') xAxisName = xAxisName.trim();
      const xType = typeof (file.data?.[0]?.[xAxisName]);
      let compatible = true;
      for (let y of file.selected?.yAxes || []) {
        if (!file.data?.every((row: any) => typeof row[y] === 'number' || row[y] === null || row[y] === undefined)) {
          compatible = false;
        }
      }
      if (xAxisName && compatible) {
        const key = `${xAxisName}|${xType}`;
        console.log('Grouping key:', key, 'for file:', file.name);
        if (!groups[key]) groups[key] = [];
        groups[key].push(file);
      }
    });
    // Find the largest group
    let largestGroup: CSVFile[] = [];
    Object.values(groups).forEach(g => { if (g.length > largestGroup.length) largestGroup = g; });
    const combined = largestGroup;
    const separate = files.filter(f => !combined.includes(f));
    return { combined, separate };
  }, [files]);
  
  const value = {
    files,
    chartData,
    chartOptions,
    chartDisplayMode,
    setChartDisplayMode,
    isSingleChartCompatible,
    getHybridChartGroups,
    addFile,
    removeFile,
    updateAxisSelection,
    updateLineStyle,
    updatePointStyle,
    updateColor,
    updateAxisConfig,
    renameAxis,
    generateChart,
    resetChart,
    updateChartTitle,
    updateFileChartConfig,
    updateShowPoints,
    updateShowLine,
    saveFilesToLocalStorage,
    saveChartOptionsToLocalStorage,
    loadFilesFromLocalStorage,
  };
  
  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
};

export const useVisualization = () => {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
};