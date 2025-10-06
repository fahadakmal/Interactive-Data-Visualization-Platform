/**
 * Experiment Data Export Utilities
 *
 * Generates comprehensive JSON export with ISO 9241-11 usability metrics structure
 * per Chapter 4, Section 4.6 (Data Management and Export)
 */

import { TaskResponse, SatisfactionResponse } from '../types/visualization';
import { FinalPreferenceResponse } from '../components/FinalPreferenceQuestionnaire';

export interface ParticipantMetadata {
  participantId: string;
  assignedGroup: 'A' | 'B';
  timestamp: string;
  browser: string;
  screenResolution: string;
}

export interface Demographics {
  age?: string;
  education?: string;
  chartExperience?: string;
  environmentalBackground?: string;
}

export interface UsabilityMetrics {
  effectiveness: {
    overlayAccuracy: number;
    smallMultiplesAccuracy: number;
    perTaskAccuracy: Record<string, { overlay: boolean; smallMultiples: boolean }>;
  };
  efficiency: {
    overlayMeanTime: number;
    smallMultiplesMeanTime: number;
    perTaskTime: Record<string, { overlay: number; smallMultiples: number }>;
    answerChanges: {
      overlay: number;
      smallMultiples: number;
    };
  };
  satisfaction: {
    overlay: {
      easeRating: number | null;
      wouldUseRating: number | null;
      timestamp: string;
    };
    smallMultiples: {
      easeRating: number | null;
      wouldUseRating: number | null;
      timestamp: string;
    };
    finalPreference: string;
    comments: string;
  };
}

export interface ExperimentDataExport {
  metadata: ParticipantMetadata;
  demographics: Demographics;
  responses: TaskResponse[];
  usabilityMetrics: UsabilityMetrics;
}

/**
 * Calculate usability metrics from raw responses
 * Following Benyon Table 10.3 operationalization (Chapter 3)
 */
export function calculateUsabilityMetrics(
  taskResponses: TaskResponse[],
  satisfactionResponses: SatisfactionResponse[],
  finalPreference: FinalPreferenceResponse | null
): UsabilityMetrics {
  // Separate responses by layout
  const overlayResponses = taskResponses.filter(r => r.layout === 'overlay');
  const smallMultiplesResponses = taskResponses.filter(r => r.layout === 'small-multiples');

  // --- EFFECTIVENESS (Accuracy) ---
  const overlayCorrect = overlayResponses.filter(r => r.isCorrect).length;
  const overlayTotal = overlayResponses.length || 1; // Avoid division by zero
  const overlayAccuracy = overlayCorrect / overlayTotal;

  const smCorrect = smallMultiplesResponses.filter(r => r.isCorrect).length;
  const smTotal = smallMultiplesResponses.length || 1;
  const smallMultiplesAccuracy = smCorrect / smTotal;

  // Per-task accuracy
  const perTaskAccuracy: Record<string, { overlay: boolean; smallMultiples: boolean }> = {};
  const allTaskIds = new Set(taskResponses.map(r => r.taskId));
  allTaskIds.forEach(taskId => {
    const overlayTask = overlayResponses.find(r => r.taskId === taskId);
    const smTask = smallMultiplesResponses.find(r => r.taskId === taskId);
    perTaskAccuracy[taskId] = {
      overlay: overlayTask?.isCorrect || false,
      smallMultiples: smTask?.isCorrect || false,
    };
  });

  // --- EFFICIENCY (Time and Answer Changes) ---
  const overlayTimes = overlayResponses.map(r => r.completionTime);
  const overlayMeanTime = overlayTimes.length > 0
    ? overlayTimes.reduce((sum, t) => sum + t, 0) / overlayTimes.length
    : 0;

  const smTimes = smallMultiplesResponses.map(r => r.completionTime);
  const smallMultiplesMeanTime = smTimes.length > 0
    ? smTimes.reduce((sum, t) => sum + t, 0) / smTimes.length
    : 0;

  // Per-task time
  const perTaskTime: Record<string, { overlay: number; smallMultiples: number }> = {};
  allTaskIds.forEach(taskId => {
    const overlayTask = overlayResponses.find(r => r.taskId === taskId);
    const smTask = smallMultiplesResponses.find(r => r.taskId === taskId);
    perTaskTime[taskId] = {
      overlay: overlayTask?.completionTime || 0,
      smallMultiples: smTask?.completionTime || 0,
    };
  });

  // Total answer changes
  const overlayChanges = overlayResponses.reduce((sum, r) => sum + (r.metrics?.answerChanges || 0), 0);
  const smChanges = smallMultiplesResponses.reduce((sum, r) => sum + (r.metrics?.answerChanges || 0), 0);

  // --- SATISFACTION ---
  const overlaySat = satisfactionResponses.find(r => r.layout === 'overlay');
  const smSat = satisfactionResponses.find(r => r.layout === 'small-multiples');

  return {
    effectiveness: {
      overlayAccuracy,
      smallMultiplesAccuracy,
      perTaskAccuracy,
    },
    efficiency: {
      overlayMeanTime,
      smallMultiplesMeanTime,
      perTaskTime,
      answerChanges: {
        overlay: overlayChanges,
        smallMultiples: smChanges,
      },
    },
    satisfaction: {
      overlay: {
        easeRating: overlaySat?.ease ?? null,
        wouldUseRating: overlaySat?.wouldUse ?? null,
        timestamp: overlaySat?.timestamp || '',
      },
      smallMultiples: {
        easeRating: smSat?.ease ?? null,
        wouldUseRating: smSat?.wouldUse ?? null,
        timestamp: smSat?.timestamp || '',
      },
      finalPreference: finalPreference?.preference || 'not-answered',
      comments: finalPreference?.comments || '',
    },
  };
}

/**
 * Generate complete experiment data export
 */
export function generateExperimentDataExport(
  participantId: string,
  assignedGroup: 'A' | 'B',
  taskResponses: TaskResponse[],
  satisfactionResponses: SatisfactionResponse[],
  finalPreference: FinalPreferenceResponse | null,
  demographics: Demographics = {}
): ExperimentDataExport {
  const metadata: ParticipantMetadata = {
    participantId,
    assignedGroup,
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };

  const usabilityMetrics = calculateUsabilityMetrics(
    taskResponses,
    satisfactionResponses,
    finalPreference
  );

  return {
    metadata,
    demographics,
    responses: taskResponses,
    usabilityMetrics,
  };
}

/**
 * Download experiment data as JSON file
 */
export function downloadExperimentData(
  data: ExperimentDataExport,
  participantId: string
): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `participant-${participantId}-data.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  console.log('✅ Experiment data downloaded:', {
    participantId,
    taskCount: data.responses.length,
    overlayAccuracy: data.usabilityMetrics.effectiveness.overlayAccuracy,
    smallMultiplesAccuracy: data.usabilityMetrics.effectiveness.smallMultiplesAccuracy,
  });
}
