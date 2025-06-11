export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type PointStyle = 'circle' | 'square' | 'triangle' | 'none';

export interface ColumnStyle {
  color: string;
  lineStyle: LineStyle;
  pointStyle: PointStyle;
  showPoints: boolean;
  showLine: boolean;
}

export interface CSVFile {
  id: string;
  name: string;
  columns: string[];
  data: Record<string, string | number | Date>[];
  selected: {
    xAxis: string;
    yAxes: string[];
  };
  columnStyles: Record<string, ColumnStyle>;
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface Dataset {
  id: string;
  fileId: string;
  fileName: string;
  label: string;
  xAxisName: string;
  yAxisName: string;
  data: DataPoint[];
  style: ColumnStyle;
  isDateXAxis?: boolean;
  isDateYAxis?: boolean;
  warning?: string;
}

export interface ChartData {
  datasets: Dataset[];
}

export interface AxisConfig {
  label: string;
  showLabel: boolean;
  showTicks: boolean;
  tickRotation: number;
  autoScale: boolean;
  min?: number;
  max?: number;
}

export interface SeriesStyle {
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface ChartOptions {
  title: string;
  showLegend: boolean;
  showGrid: boolean;
  normalize?: boolean;
  chartWidth?: number;
  chartHeight?: number;
  axisConfig: {
    x: AxisConfig;
    y: AxisConfig;
  };
  seriesStyles: {
    [column: string]: SeriesStyle;
  };
  fileConfigs?: Record<string, {
    title: string;
    showLegend: boolean;
    showGrid: boolean;
    chartWidth?: number;
    chartHeight?: number;
    axisConfig: {
      x: AxisConfig;
      y: AxisConfig;
    };
  }>;
}