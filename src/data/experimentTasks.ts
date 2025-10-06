/**
 * Experimental Tasks for Usability Evaluation
 *
 * Based on the thesis experimental design (experiment-tasks-design.md)
 * These tasks test pattern comparison, correlation, anomaly detection, and trends
 * in environmental time-series data (Jan-Apr 2023)
 */

export interface ExperimentTask {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: string; // "A", "B", "C", or "D"
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export const EXPERIMENT_TASKS: ExperimentTask[] = [
  // T1: Pattern Identification (Easy)
  {
    id: 'T1',
    question: 'Which variable shows the highest day-to-day variability in February 2023?',
    choices: [
      'A) Temperature',
      'B) Air Quality Index (AQI)',
      'C) CO2',
      'D) Precipitation'
    ],
    correctAnswer: 'B',
    difficulty: 'easy',
    category: 'variability'
  },

  // T2: Correlation Assessment (Medium)
  {
    id: 'T2',
    question: 'Which variable shows the strongest inverse relationship with Temperature in January 2023?',
    choices: [
      'A) Air Quality Index (AQI)',
      'B) CO2',
      'C) Precipitation',
      'D) None show inverse relationship'
    ],
    correctAnswer: 'A',
    difficulty: 'medium',
    category: 'correlation'
  },

  // T3: Anomaly Detection (Easy)
  {
    id: 'T3',
    question: 'When did Air Quality Index (AQI) first reach its highest value between January and April 2023?',
    choices: [
      'A) January 10-15',
      'B) January 20-25',
      'C) February 10-15',
      'D) March 20-25'
    ],
    correctAnswer: 'B',
    difficulty: 'easy',
    category: 'anomaly'
  },

  // T4: Trend Comparison (Medium)
  {
    id: 'T4',
    question: 'Which variable shows the clearest increasing pattern from January to March 2023?',
    choices: [
      'A) Temperature',
      'B) Air Quality Index (AQI)',
      'C) CO2',
      'D) Precipitation'
    ],
    correctAnswer: 'A',
    difficulty: 'medium',
    category: 'trend'
  },

  // T5: Temporal Analysis (Hard)
  {
    id: 'T5',
    question: 'How many days in February 2023 had both high precipitation (>5mm) AND poor air quality (AQI >100)?',
    choices: [
      'A) 0 days',
      'B) 1-2 days',
      'C) 3-4 days',
      'D) 5+ days'
    ],
    correctAnswer: 'B',
    difficulty: 'hard',
    category: 'temporal-analysis'
  },

  // T6: Seasonal Trend (Medium)
  {
    id: 'T6',
    question: 'Which variable shows a clear increasing trend from January through March 2023?',
    choices: [
      'A) Temperature only',
      'B) Temperature and CO2',
      'C) All variables',
      'D) None show clear trend'
    ],
    correctAnswer: 'A',
    difficulty: 'medium',
    category: 'trend'
  }
];

/**
 * Get tasks for a specific block based on counterbalancing group
 * Block 1: Tasks 1-3
 * Block 2: Tasks 4-6
 */
export function getTasksForBlock(blockId: string): ExperimentTask[] {
  if (blockId === '1') {
    return [EXPERIMENT_TASKS[0], EXPERIMENT_TASKS[1], EXPERIMENT_TASKS[2]]; // T1, T2, T3
  } else {
    return [EXPERIMENT_TASKS[3], EXPERIMENT_TASKS[4], EXPERIMENT_TASKS[5]]; // T4, T5, T6
  }
}
