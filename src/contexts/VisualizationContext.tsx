import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  CSVFile,
  ChartOptions,
  ChartData,
  LineStyle,
  PointStyle,
  AxisConfig,
  SatisfactionResponse,
  TaskResponse
} from '../types/visualization';
import { parseCSV } from '../utils/csvParser';
import { FinalPreferenceResponse } from '../components/FinalPreferenceQuestionnaire';
import { DemographicsData } from '../components/DemographicsForm';
import { getNextBalancedGroup } from '../services/firebaseService';

interface VisualizationContextType {
  // Existing visualization context
  files: CSVFile[];
  chartData: ChartData | null;
  chartOptions: ChartOptions;
  chartDisplayMode: 'single' | 'separate' | 'hybrid';
  setChartDisplayMode: (mode: 'single' | 'separate' | 'hybrid') => void;
  isSingleChartCompatible: boolean;
  getHybridChartGroups: () => { combined: CSVFile[]; separate: CSVFile[] };
  addFile: (file: File) => Promise<void>;
  addParsedFile: (name: string, data: any[], columns: string[]) => void;
  setXAxis: (fileName: string, column: string) => void;
  setYAxis: (fileName: string, column: string) => void;
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

  // Experiment-specific state
  participantId: string;
  assignedGroup: 'A' | 'B';
  demographics: DemographicsData | null;
  setDemographics: (data: DemographicsData) => void;
  satisfactionResponses: SatisfactionResponse[];
  addSatisfactionResponse: (response: Omit<SatisfactionResponse, 'timestamp'>) => void;
  getSatisfactionResponses: () => SatisfactionResponse[];
  clearSatisfactionResponses: () => void;
  taskResponses: TaskResponse[];
  addTaskResponse: (response: TaskResponse) => void;
  getTaskResponses: () => TaskResponse[];
  clearTaskResponses: () => void;
  finalPreference: FinalPreferenceResponse | null;
  setFinalPreference: (response: FinalPreferenceResponse) => void;
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
  const [satisfactionResponses, setSatisfactionResponses] = useState<SatisfactionResponse[]>([]);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);

  // Demographics data
  const [demographics, setDemographicsState] = useState<DemographicsData | null>(() => {
    const saved = localStorage.getItem('demographics');
    return saved ? JSON.parse(saved) : null;
  });

  // Participant ID - Generate UUID and persist to localStorage
  const [participantId] = useState<string>(() => {
    const saved = localStorage.getItem('participantId');
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem('participantId', newId);
    console.log('✅ Generated new participant ID:', newId);
    return newId;
  });

  // Assigned Group - Three-tier priority system:
  // 1. URL parameter ?group=A or ?group=B (highest priority - manual override)
  // 2. Firebase counterbalancing (automatic - opposite of last participant)
  // 3. UUID parity (fallback if Firebase unavailable or no previous participants)
  const [assignedGroup, setAssignedGroup] = useState<'A' | 'B'>(() => {
    // Check localStorage first for existing assignment
    const savedGroup = localStorage.getItem('assignedGroup');
    if (savedGroup === 'A' || savedGroup === 'B') {
      console.log('✅ Loaded existing group assignment:', savedGroup);
      return savedGroup as 'A' | 'B';
    }

    // Check URL parameters first (manual override)
    const urlParams = new URLSearchParams(window.location.search);
    const urlGroup = urlParams.get('group')?.toUpperCase();

    if (urlGroup === 'A' || urlGroup === 'B') {
      console.log('✅ Participant assigned to Group', urlGroup, '(from URL parameter)');
      localStorage.setItem('assignedGroup', urlGroup);
      return urlGroup as 'A' | 'B';
    }

    // Default to Group A while Firebase loads (will be updated by useEffect)
    const idHash = participantId.split('-')[0];
    const idNumber = parseInt(idHash, 16);
    const fallbackGroup = (idNumber % 2 === 0) ? 'A' : 'B';
    console.log('✅ Initial group assignment:', fallbackGroup, '(will attempt Firebase fetch)');
    return fallbackGroup;
  });

  // Fetch group from Firebase on mount (automatic counterbalancing)
  useEffect(() => {
    const fetchGroupFromFirebase = async () => {
      // Check if group was manually set via URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlGroup = urlParams.get('group')?.toUpperCase();

      if (urlGroup === 'A' || urlGroup === 'B') {
        // URL override - don't fetch from Firebase
        return;
      }

      // Check if we already have a saved group assignment
      const savedGroup = localStorage.getItem('assignedGroup');
      if (savedGroup === 'A' || savedGroup === 'B') {
        // Already assigned - don't reassign
        return;
      }

      try {
        console.log('📊 Fetching group assignment from Firebase...');
        const nextGroup = await getNextBalancedGroup();

        if (nextGroup !== null) {
          // Firebase returned a group for counterbalancing
          setAssignedGroup(nextGroup);
          localStorage.setItem('assignedGroup', nextGroup);
          console.log('✅ Group assigned via Firebase counterbalancing:', nextGroup);
        } else {
          // No previous participants in Firebase - use UUID fallback
          const idHash = participantId.split('-')[0];
          const idNumber = parseInt(idHash, 16);
          const fallbackGroup = (idNumber % 2 === 0) ? 'A' : 'B';
          setAssignedGroup(fallbackGroup);
          localStorage.setItem('assignedGroup', fallbackGroup);
          console.log('✅ No previous participants - using UUID parity:', fallbackGroup);
        }
      } catch (error) {
        console.error('❌ Error fetching group from Firebase, using UUID fallback');
        // Keep the UUID-based fallback group that was set initially
        localStorage.setItem('assignedGroup', assignedGroup);
      }
    };

    fetchGroupFromFirebase();
  }, [participantId]); // Only run once on mount

  // Final Preference - Stored after both blocks complete
  const [finalPreference, setFinalPreference] = useState<FinalPreferenceResponse | null>(() => {
    const saved = localStorage.getItem('finalPreference');
    return saved ? JSON.parse(saved) : null;
  });

  // Load data from localStorage on application startup
  // DISABLED for experiment - data is loaded fresh from CSV files in ExperimentDemo
  // This prevents stale cached data from interfering with the experiment
  useEffect(() => {
    // Only load localStorage data if we're NOT in the experiment flow
    // Check if we're on the experiment route (you can adjust this check)
    const isExperimentMode = window.location.pathname.includes('/experiment') ||
                             window.location.pathname === '/' ||
                             window.location.pathname === '/index.html';

    if (!isExperimentMode) {
      // Regular mode - load from localStorage for normal usage
      loadFilesFromLocalStorage();
    }

    // Always load responses (needed for experiment tracking)
    loadSatisfactionResponses();
    loadTaskResponses();
  }, []);
  
  // Note: Automatic chart generation disabled for experiment mode
  // Charts are generated manually after all files and axes are configured
  // This prevents race conditions where files exist but axes aren't set yet

  // Always regenerate chart data when chartDisplayMode changes
  useEffect(() => {
    if (files.length > 0) {
      console.log('🔄 Chart display mode changed, regenerating chart');
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

  // Add pre-parsed file (for experimental data loading)
  // Does NOT save to localStorage - data is loaded fresh from CSV files each time
  const addParsedFile = (name: string, data: any[], columns: string[]) => {
    const defaultXAxis = columns[0] || '';
    const defaultYAxes = columns.length > 1 ? [columns[1]] : [];

    console.log(`🔧 addParsedFile called for "${name}":`, {
      rows: data.length,
      columns,
      defaultXAxis,
      defaultYAxes,
      firstRow: data[0]
    });

    const newFile: CSVFile = {
      id: uuidv4(),
      name,
      columns,
      data,
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
      console.log(`✅ Files array updated. Total files: ${newFiles.length}`);
      // DO NOT save to localStorage for experiment data
      // This ensures fresh data is loaded from CSV files each time
      // saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };

  // Set X-axis for a file by name
  // Does NOT save to localStorage for experiment mode
  const setXAxis = (fileName: string, column: string) => {
    setFiles(prev => {
      const newFiles = prev.map(file =>
        file.name === fileName
          ? {
              ...file,
              selected: {
                ...file.selected,
                xAxis: column,
              }
            }
          : file
      );
      // Don't save to localStorage for experiment data
      // saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
  };

  // Set Y-axis for a file by name
  // Does NOT save to localStorage for experiment mode
  const setYAxis = (fileName: string, column: string) => {
    setFiles(prev => {
      const newFiles = prev.map(file =>
        file.name === fileName
          ? {
              ...file,
              selected: {
                ...file.selected,
                yAxes: [column],
              }
            }
          : file
      );
      // Don't save to localStorage for experiment data
      // saveFilesToLocalStorage(newFiles);
      return newFiles;
    });
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
    console.log('🎨 generateChart called', { filesCount: files.length });

    if (files.length === 0) {
      console.log('❌ No files, setting chartData to null');
      setChartData(null);
      return;
    }

    const datasets: ChartData['datasets'] = [];
    files.forEach(file => {
      console.log(`📊 Processing file "${file.name}":`, {
        selected: file.selected,
        dataRows: file.data?.length,
        columnStyles: Object.keys(file.columnStyles)
      });

      const { selected, data, columnStyles } = file;
      if (!selected.xAxis || selected.yAxes.length === 0) {
        console.log(`⚠️ Skipping "${file.name}" - missing axis selection`);
        return;
      }
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

        console.log(`  ➡️ Points generated for "${file.name}" - ${yAxis}:`, {
          pointsCount: points.length,
          isDateXAxis,
          isDateYAxis,
          firstPoint: points[0],
          lastPoint: points[points.length - 1],
          hasColumnStyles: !!columnStyles[yAxis]
        });

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
          console.log(`  ✅ Dataset added for "${file.name}" - ${yAxis}`);
          datasets.push(dataset);
        } else {
          console.log(`  ⚠️ No points for "${file.name}" - ${yAxis}, skipping dataset`);
        }
      });
    });

    console.log('📈 Total datasets generated:', datasets.length);

    if (datasets.length > 0) {
      let finalDatasets = datasets;
      console.log('🔄 Chart display mode:', chartDisplayMode);

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

      console.log('✅ Setting chartData with', finalDatasets.length, 'final datasets');
      setChartData({
        datasets: finalDatasets,
      });
    } else {
      console.log('❌ No datasets generated, setting chartData to null');
      setChartData(null);
    }
  };
  
  const resetChart = () => {
    // Remove main keys
    localStorage.removeItem('csvFiles');
    localStorage.removeItem('chartOptions');
    // Remove all csvData_* keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('csvData_')) {
        localStorage.removeItem(key);
      }
    });
    setFiles([]);
    setChartOptions({
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
          label: '',
          showLabel: true,
          showTicks: true,
          tickRotation: 0,
          autoScale: true,
        },
      },
      seriesStyles: {},
    });
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

          // Ensure selected field exists with defaults
          const columns = file.columns || [];
          const defaultXAxis = file.selected?.xAxis || columns[0] || '';
          const defaultYAxes = file.selected?.yAxes || (columns.length > 1 ? [columns[1]] : []);

          // Convert numeric fields and parse dates for xAxis
          data = data.map((row: any) => {
            const newRow: any = { ...row };
            for (const key in newRow) {
              // If this is the xAxis and looks like a date, parse it
              if (key === defaultXAxis && typeof newRow[key] === 'string' && !isNaN(Date.parse(newRow[key]))) {
                newRow[key] = new Date(newRow[key]);
              } else if (newRow[key] !== null && newRow[key] !== '' && !isNaN(newRow[key])) {
                newRow[key] = Number(newRow[key]);
              }
            }
            return newRow;
          });

          // Ensure columnStyles exists
          const columnStyles = file.columnStyles || {};
          columns.forEach((col: string) => {
            if (!columnStyles[col]) {
              columnStyles[col] = {
                color: getRandomColor(),
                lineStyle: 'solid',
                pointStyle: 'circle',
                showPoints: true,
                showLine: true,
              };
            }
          });

          return {
            ...file,
            data,
            selected: {
              xAxis: defaultXAxis,
              yAxes: defaultYAxes,
            },
            columnStyles,
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

  // Satisfaction response management
  const addSatisfactionResponse = (response: Omit<SatisfactionResponse, 'timestamp'>) => {
    const newResponse: SatisfactionResponse = {
      ...response,
      timestamp: Date.now(),
    };
    setSatisfactionResponses(prev => {
      const updated = [...prev, newResponse];
      saveSatisfactionResponsesToLocalStorage(updated);
      return updated;
    });
  };

  const getSatisfactionResponses = () => {
    return satisfactionResponses;
  };

  const clearSatisfactionResponses = () => {
    setSatisfactionResponses([]);
    localStorage.removeItem('satisfactionResponses');
  };

  const saveSatisfactionResponsesToLocalStorage = (responses: SatisfactionResponse[]) => {
    try {
      localStorage.setItem('satisfactionResponses', JSON.stringify(responses));
    } catch (error) {
      console.error('Error saving satisfaction responses:', error);
    }
  };

  const loadSatisfactionResponses = () => {
    try {
      const saved = localStorage.getItem('satisfactionResponses');
      if (saved) {
        setSatisfactionResponses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading satisfaction responses:', error);
    }
  };

  // Task response management
  const addTaskResponse = (response: TaskResponse) => {
    setTaskResponses(prev => {
      const updated = [...prev, response];
      saveTaskResponsesToLocalStorage(updated);
      return updated;
    });
  };

  const getTaskResponses = () => {
    return taskResponses;
  };

  const clearTaskResponses = () => {
    setTaskResponses([]);
    localStorage.removeItem('taskResponses');
  };

  const saveTaskResponsesToLocalStorage = (responses: TaskResponse[]) => {
    try {
      localStorage.setItem('taskResponses', JSON.stringify(responses));
    } catch (error) {
      console.error('Error saving task responses:', error);
    }
  };

  const loadTaskResponses = () => {
    try {
      const saved = localStorage.getItem('taskResponses');
      if (saved) {
        setTaskResponses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading task responses:', error);
    }
  };

  // Final preference management
  const handleSetFinalPreference = (response: FinalPreferenceResponse) => {
    setFinalPreference(response);
    try {
      localStorage.setItem('finalPreference', JSON.stringify(response));
      console.log('✅ Final preference saved:', response.preference);
    } catch (error) {
      console.error('Error saving final preference:', error);
    }
  };

  // Demographics management
  const handleSetDemographics = (data: DemographicsData) => {
    setDemographicsState(data);
    try {
      localStorage.setItem('demographics', JSON.stringify(data));
      console.log('✅ Demographics saved:', data);
    } catch (error) {
      console.error('Error saving demographics:', error);
    }
  };

  const value = {
    files,
    chartData,
    chartOptions,
    chartDisplayMode,
    setChartDisplayMode,
    isSingleChartCompatible,
    getHybridChartGroups,
    addFile,
    addParsedFile,
    setXAxis,
    setYAxis,
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
    // Experiment-specific state
    participantId,
    assignedGroup,
    demographics,
    setDemographics: handleSetDemographics,
    satisfactionResponses,
    addSatisfactionResponse,
    getSatisfactionResponses,
    clearSatisfactionResponses,
    taskResponses,
    addTaskResponse,
    getTaskResponses,
    clearTaskResponses,
    finalPreference,
    setFinalPreference: handleSetFinalPreference,
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