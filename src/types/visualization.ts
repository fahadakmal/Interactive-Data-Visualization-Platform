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

export interface SatisfactionResponse {
  blockId: string;
  layout: 'overlay' | 'small-multiples';
  ease: number;
  wouldUse: number;
  timestamp: number;
}

// Task tracking metrics for usability evaluation
export interface TaskMetrics {
  answerChanges: number;              // Count of radio button changes
  timeToFirstInteraction: number;      // Milliseconds from display to first interaction
  pauseCount: number;                  // Count of pauses >5 seconds
}

export interface TaskResponse {
  taskId: string;
  question: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  completionTime: number;              // Total time in milliseconds
  metrics: TaskMetrics;
  layout: 'overlay' | 'small-multiples';
  timestamp: number;
}

export interface ExperimentTask {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// Complete data export structure for usability evaluation
// Aligned with Chapter 4, Section 4.5.3 (Export Schema Specification)

/**
 * Metadata object containing session information
 */
export interface ExportMetadata {
  participantId: string;
  assignedGroup: 'A' | 'B';  // A: overlay first, B: small-multiples first
  sessionStartTimestamp: string;  // ISO 8601
  sessionEndTimestamp: string;    // ISO 8601
  sessionDurationMinutes: number;
  browser: string;
  screenResolution: string;
  operatingSystem: string;
  exportVersion: string;  // e.g., "1.0"
}

/**
 * Demographics object containing participant background
 */
export interface ExportDemographics {
  age?: number;
  gender?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  dataVisualizationExperience?: string;  // e.g., "novice", "intermediate", "expert"
}

/**
 * Individual task response with all efficiency and effectiveness metrics
 */
export interface ExportTaskResponse {
  taskId: string;  // e.g., "T1", "T2", etc.
  taskNumber: number;  // 1-6
  blockNumber: number;  // 1 or 2
  layout: 'overlay' | 'small-multiples';
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;

  // Efficiency metrics
  completionTime: number;  // milliseconds
  answerChanges: number;   // count of radio button changes
  timeToFirstInteraction: number;  // milliseconds from display to first interaction
  pauseCount: number;  // count of pauses >5 seconds

  // Timing metadata
  startTimestamp: string;  // ISO 8601
  endTimestamp: string;    // ISO 8601
}

/**
 * Post-block satisfaction ratings (Likert 1-5 scales)
 */
export interface ExportSatisfactionBlock {
  blockNumber: number;  // 1 or 2
  layout: 'overlay' | 'small-multiples';
  easeRating: number;  // 1-5: "How easy was it to complete tasks with this layout?"
  intentionRating: number;  // 1-5: "Would you use this layout in your work?"
  timestamp: string;  // ISO 8601
}

/**
 * Overall satisfaction and preference data
 */
export interface ExportSatisfaction {
  blockRatings: ExportSatisfactionBlock[];  // 2 blocks
  finalPreference: 'overlay' | 'small-multiples' | 'no-preference';
  comments?: string;  // optional open-ended feedback
}

/**
 * NASA-TLX cognitive load assessment (optional, for secondary analysis)
 */
export interface ExportNASATLX {
  mentalDemand: number;     // 0-100
  physicalDemand: number;   // 0-100
  temporalDemand: number;   // 0-100
  performance: number;      // 0-100 (higher = better perceived performance)
  effort: number;           // 0-100
  frustration: number;      // 0-100
  compositeScore: number;   // mean of 6 subscales
}

/**
 * Pre-computed usability metrics for quick validation
 */
export interface ExportUsabilityMetrics {
  // Per-layout effectiveness
  overlayAccuracyPercentage: number;      // 0-100
  smallMultiplesAccuracyPercentage: number;  // 0-100

  // Per-layout efficiency
  overlayMeanCompletionTime: number;      // milliseconds
  smallMultiplesMeanCompletionTime: number;  // milliseconds

  // Per-layout answer changes (indicator of hesitation)
  overlayMeanAnswerChanges: number;
  smallMultiplesMeanAnswerChanges: number;

  // Per-layout time to first interaction
  overlayMeanTimeToFirstInteraction: number;  // milliseconds
  smallMultiplesMeanTimeToFirstInteraction: number;  // milliseconds

  // Per-layout pause count
  overlayMeanPauseCount: number;
  smallMultiplesMeanPauseCount: number;

  // Overall metrics
  totalTasksCompleted: number;  // should be 6
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracyPercentage: number;
}

/**
 * Complete participant export data structure
 * Matches Chapter 4, Section 4.5.3 schema specification
 */
export interface ParticipantExportData {
  metadata: ExportMetadata;
  demographics: ExportDemographics;
  responses: ExportTaskResponse[];  // 6 task responses total (3 per block)
  satisfaction: ExportSatisfaction;
  cognitiveLoad?: ExportNASATLX;  // optional
  usabilityMetrics: ExportUsabilityMetrics;
}

// Legacy interfaces for backward compatibility with existing code
export interface ExportTaskMetrics {
  taskId: number;
  isCorrect: boolean;
  completionTime: number;  // in milliseconds
  answerChanges: number;
  timeToFirstInteraction: number;  // in milliseconds
  pauseCount: number;  // pauses >5 seconds
}

export interface ExportSatisfactionRatings {
  ease: number;  // 1-5: "How easy was it to complete tasks with this layout?"
  wouldUse: number;  // 1-5: "Would you use this layout in your work?"
}

export interface ExportBlockData {
  blockId: number;  // 1 or 2
  layout: string;  // 'overlay' | 'small-multiples'
  tasks: ExportTaskMetrics[];  // 3 tasks per block
  satisfactionRatings: ExportSatisfactionRatings;
}