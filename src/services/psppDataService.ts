import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TaskResponse } from '../types/visualization';
import { DemographicsData } from '../components/DemographicsForm';

/**
 * PSPP Data Service
 *
 * Stores participant data in PSPP-ready format directly in Firestore.
 * NO conversion needed! Export directly from Firebase → PSPP.
 *
 * Collection: 'psppData'
 * Each document = one row in PSPP CSV
 */

const PSPP_COLLECTION = 'psppData';

/**
 * PSPP-formatted participant data
 * This structure matches EXACTLY the columns needed for PSPP analysis
 */
export interface PSPPData {
  // Identifiers
  ParticipantID: string;
  Group: 'A' | 'B';

  // Primary usability metrics (ISO 9241-11)
  Accuracy_Percent: number;          // 0-100
  MeanTime_Seconds: number;          // Mean completion time in seconds
  UMUX_Score: number | null;         // 0-100, null if not completed

  // Secondary efficiency metrics
  MeanAnswerChanges: number;         // Mean number of answer changes per task
  MeanPauseCount: number;            // Mean pauses >5 seconds per task
  MeanTimeToFirstInteraction_ms: number; // Mean milliseconds to first interaction

  // Data quality
  TasksCompleted: number;            // Should be 6

  // Demographics (categorical variables for PSPP)
  Age: string;                       // "18-25", "26-35", etc.
  Education: string;                 // "bachelor", "master", etc.
  ChartExperience: string;           // "never", "rarely", "sometimes", "often", "daily"
  EnvironmentalBackground: string;   // "yes", "some", "no"

  // Metadata
  timestamp: Timestamp;              // When data was saved
  layoutUsed: string;                // "overlay" or "small-multiples"
}

/**
 * Calculate PSPP metrics from raw task responses
 *
 * @param taskResponses - Array of task responses from experiment
 * @returns Calculated metrics ready for PSPP
 */
function calculatePSPPMetrics(taskResponses: TaskResponse[]) {
  const tasksCompleted = taskResponses.length;

  if (tasksCompleted === 0) {
    return {
      Accuracy_Percent: 0,
      MeanTime_Seconds: 0,
      MeanAnswerChanges: 0,
      MeanPauseCount: 0,
      MeanTimeToFirstInteraction_ms: 0,
      TasksCompleted: 0,
    };
  }

  // 1. EFFECTIVENESS: Accuracy percentage
  const correctTasks = taskResponses.filter(t => t.isCorrect).length;
  const Accuracy_Percent = (correctTasks / tasksCompleted) * 100;

  // 2. EFFICIENCY: Mean completion time (convert ms → seconds)
  const times = taskResponses.map(t => t.completionTime / 1000); // Convert to seconds
  const MeanTime_Seconds = times.reduce((sum, t) => sum + t, 0) / times.length;

  // 3. EFFICIENCY: Mean answer changes
  const answerChanges = taskResponses.map(t => t.metrics?.answerChanges || 0);
  const MeanAnswerChanges = answerChanges.reduce((sum, c) => sum + c, 0) / answerChanges.length;

  // 4. EFFICIENCY: Mean pause count
  const pauseCounts = taskResponses.map(t => t.metrics?.pauseCount || 0);
  const MeanPauseCount = pauseCounts.reduce((sum, c) => sum + c, 0) / pauseCounts.length;

  // 5. EFFICIENCY: Mean time to first interaction
  const timeToFirstInteractions = taskResponses.map(t => t.metrics?.timeToFirstInteraction || 0);
  const MeanTimeToFirstInteraction_ms = timeToFirstInteractions.reduce((sum, t) => sum + t, 0) / timeToFirstInteractions.length;

  return {
    Accuracy_Percent: Math.round(Accuracy_Percent * 100) / 100,
    MeanTime_Seconds: Math.round(MeanTime_Seconds * 100) / 100,
    MeanAnswerChanges: Math.round(MeanAnswerChanges * 100) / 100,
    MeanPauseCount: Math.round(MeanPauseCount * 100) / 100,
    MeanTimeToFirstInteraction_ms: Math.round(MeanTimeToFirstInteraction_ms * 100) / 100,
    TasksCompleted: tasksCompleted,
  };
}

/**
 * Extract UMUX score from response object
 *
 * @param umuxResponse - UMUX questionnaire response
 * @returns UMUX score (0-100) or null if not available
 */
function extractUMUXScore(umuxResponse: any): number | null {
  if (!umuxResponse) return null;

  if (typeof umuxResponse === 'object' && 'umux_score' in umuxResponse) {
    return Math.round(umuxResponse.umux_score * 100) / 100;
  }

  return null;
}

/**
 * Save participant data in PSPP-ready format to Firestore
 *
 * This function:
 * 1. Calculates all PSPP metrics automatically
 * 2. Stores data in flat structure (one document = one CSV row)
 * 3. Ready for direct export from Firebase Console
 *
 * @param participantId - Unique participant identifier
 * @param assignedGroup - Group A (Overlay) or B (Small Multiples)
 * @param taskResponses - Raw task responses
 * @param umuxResponse - UMUX questionnaire response
 * @param demographics - Participant demographics
 * @returns Promise<string> - Document ID
 */
export async function savePSPPData(
  participantId: string,
  assignedGroup: 'A' | 'B',
  taskResponses: TaskResponse[],
  umuxResponse: any,
  demographics: DemographicsData
): Promise<string> {
  try {
    // Calculate metrics
    const metrics = calculatePSPPMetrics(taskResponses);
    const umuxScore = extractUMUXScore(umuxResponse);

    // Determine layout used (all tasks should have same layout in between-subjects design)
    const layoutUsed = taskResponses.length > 0
      ? taskResponses[0].layout
      : (assignedGroup === 'A' ? 'overlay' : 'small-multiples');

    // Create PSPP-formatted document
    const psppData: PSPPData = {
      // Identifiers
      ParticipantID: participantId,
      Group: assignedGroup,

      // Usability metrics
      Accuracy_Percent: metrics.Accuracy_Percent,
      MeanTime_Seconds: metrics.MeanTime_Seconds,
      UMUX_Score: umuxScore,

      // Efficiency metrics
      MeanAnswerChanges: metrics.MeanAnswerChanges,
      MeanPauseCount: metrics.MeanPauseCount,
      MeanTimeToFirstInteraction_ms: metrics.MeanTimeToFirstInteraction_ms,

      // Data quality
      TasksCompleted: metrics.TasksCompleted,

      // Demographics
      Age: demographics.age || '',
      Education: demographics.education || '',
      ChartExperience: demographics.chartExperience || '',
      EnvironmentalBackground: demographics.environmentalBackground || '',

      // Metadata
      timestamp: Timestamp.now(),
      layoutUsed,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, PSPP_COLLECTION), psppData);

    console.log('[PSPP Data] Saved participant data in PSPP format:', docRef.id);
    console.log('[PSPP Data] Metrics:', {
      Accuracy: `${metrics.Accuracy_Percent}%`,
      MeanTime: `${metrics.MeanTime_Seconds}s`,
      UMUX: umuxScore,
      Group: assignedGroup,
    });

    return docRef.id;
  } catch (error) {
    console.error('[PSPP Data] Error saving PSPP data:', error);
    throw error;
  }
}

/**
 * Get all PSPP data from Firestore (for verification)
 *
 * @returns Promise<PSPPData[]> - Array of all PSPP-formatted participant data
 */
export async function getAllPSPPData(): Promise<PSPPData[]> {
  try {
    const q = query(
      collection(db, PSPP_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const data: PSPPData[] = [];

    querySnapshot.forEach((doc) => {
      data.push(doc.data() as PSPPData);
    });

    console.log(`[PSPP Data] Retrieved ${data.length} PSPP records`);
    return data;
  } catch (error) {
    console.error('[PSPP Data] Error fetching PSPP data:', error);
    throw error;
  }
}

/**
 * Export PSPP data as CSV string (for direct download)
 *
 * @returns Promise<string> - CSV string ready for PSPP import
 */
export async function exportPSPPDataAsCSV(): Promise<string> {
  try {
    const data = await getAllPSPPData();

    // CSV header
    const header = [
      'ParticipantID',
      'Group',
      'Accuracy_Percent',
      'MeanTime_Seconds',
      'UMUX_Score',
      'MeanAnswerChanges',
      'MeanPauseCount',
      'MeanTimeToFirstInteraction_ms',
      'TasksCompleted',
      'Age',
      'Education',
      'ChartExperience',
      'EnvironmentalBackground',
    ].join(',');

    // CSV rows
    const rows = data.map(d => [
      d.ParticipantID,
      d.Group,
      d.Accuracy_Percent,
      d.MeanTime_Seconds,
      d.UMUX_Score !== null ? d.UMUX_Score : '',
      d.MeanAnswerChanges,
      d.MeanPauseCount,
      d.MeanTimeToFirstInteraction_ms,
      d.TasksCompleted,
      d.Age,
      d.Education,
      d.ChartExperience,
      d.EnvironmentalBackground,
    ].join(','));

    const csv = [header, ...rows].join('\n');

    console.log(`[PSPP Data] Exported ${data.length} participants to CSV`);
    return csv;
  } catch (error) {
    console.error('[PSPP Data] Error exporting CSV:', error);
    throw error;
  }
}

/**
 * Download PSPP data as CSV file
 *
 * @param filename - Optional custom filename (default: pspp_data_YYYY-MM-DD.csv)
 */
export async function downloadPSPPDataAsCSV(filename?: string): Promise<void> {
  try {
    const csv = await exportPSPPDataAsCSV();
    const defaultFilename = `pspp_data_${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[PSPP Data] Downloaded CSV as ${filename || defaultFilename}`);
  } catch (error) {
    console.error('[PSPP Data] Error downloading CSV:', error);
    throw error;
  }
}
