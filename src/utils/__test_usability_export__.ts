/**
 * Test file for usability data export functionality
 *
 * This file demonstrates the complete data export structure and can be used
 * to test the export functions before integration with the full application.
 *
 * Usage:
 * 1. Import this file in your component
 * 2. Call generateSampleData() to get test data
 * 3. Call downloadUsabilityData(sampleData) to test export
 */

import { ParticipantExportData } from '../types/visualization';
import { downloadUsabilityData, validateUsabilityData } from './downloadUtils';

/**
 * Generates sample usability data for testing purposes
 *
 * This data structure represents a complete experimental session:
 * - Participant P001
 * - Group A (overlay first, then small-multiples)
 * - 2 blocks with 3 tasks each
 * - All usability metrics included
 */
export function generateSampleData(): ParticipantExportData {
  return {
    participantId: 'P001',
    timestamp: new Date().toISOString(),
    layoutOrder: ['overlay', 'small-multiples'],
    blocks: [
      {
        blockId: 1,
        layout: 'overlay',
        tasks: [
          {
            taskId: 1,
            isCorrect: true,
            completionTime: 45000,  // 45 seconds
            answerChanges: 2,
            timeToFirstInteraction: 3500,  // 3.5 seconds
            pauseCount: 1
          },
          {
            taskId: 2,
            isCorrect: false,
            completionTime: 62000,  // 62 seconds
            answerChanges: 4,
            timeToFirstInteraction: 5200,  // 5.2 seconds
            pauseCount: 3
          },
          {
            taskId: 3,
            isCorrect: true,
            completionTime: 38000,  // 38 seconds
            answerChanges: 1,
            timeToFirstInteraction: 2800,  // 2.8 seconds
            pauseCount: 0
          }
        ],
        satisfactionRatings: {
          ease: 4,  // "Somewhat easy"
          wouldUse: 3  // "Neutral"
        }
      },
      {
        blockId: 2,
        layout: 'small-multiples',
        tasks: [
          {
            taskId: 4,
            isCorrect: true,
            completionTime: 52000,  // 52 seconds
            answerChanges: 1,
            timeToFirstInteraction: 4100,  // 4.1 seconds
            pauseCount: 2
          },
          {
            taskId: 5,
            isCorrect: true,
            completionTime: 41000,  // 41 seconds
            answerChanges: 0,
            timeToFirstInteraction: 3200,  // 3.2 seconds
            pauseCount: 1
          },
          {
            taskId: 6,
            isCorrect: true,
            completionTime: 48000,  // 48 seconds
            answerChanges: 2,
            timeToFirstInteraction: 3900,  // 3.9 seconds
            pauseCount: 1
          }
        ],
        satisfactionRatings: {
          ease: 5,  // "Very easy"
          wouldUse: 5  // "Definitely would use"
        }
      }
    ],
    finalPreference: 'small-multiples'
  };
}

/**
 * Generates sample data for Group B (small-multiples first)
 */
export function generateSampleDataGroupB(): ParticipantExportData {
  return {
    participantId: 'P002',
    timestamp: new Date().toISOString(),
    layoutOrder: ['small-multiples', 'overlay'],
    blocks: [
      {
        blockId: 1,
        layout: 'small-multiples',
        tasks: [
          {
            taskId: 1,
            isCorrect: true,
            completionTime: 39000,  // 39 seconds
            answerChanges: 1,
            timeToFirstInteraction: 2900,  // 2.9 seconds
            pauseCount: 0
          },
          {
            taskId: 2,
            isCorrect: true,
            completionTime: 44000,  // 44 seconds
            answerChanges: 2,
            timeToFirstInteraction: 3600,  // 3.6 seconds
            pauseCount: 1
          },
          {
            taskId: 3,
            isCorrect: false,
            completionTime: 71000,  // 71 seconds
            answerChanges: 5,
            timeToFirstInteraction: 6200,  // 6.2 seconds
            pauseCount: 4
          }
        ],
        satisfactionRatings: {
          ease: 5,  // "Very easy"
          wouldUse: 4  // "Probably would use"
        }
      },
      {
        blockId: 2,
        layout: 'overlay',
        tasks: [
          {
            taskId: 4,
            isCorrect: true,
            completionTime: 47000,  // 47 seconds
            answerChanges: 1,
            timeToFirstInteraction: 3800,  // 3.8 seconds
            pauseCount: 1
          },
          {
            taskId: 5,
            isCorrect: true,
            completionTime: 53000,  // 53 seconds
            answerChanges: 3,
            timeToFirstInteraction: 4500,  // 4.5 seconds
            pauseCount: 2
          },
          {
            taskId: 6,
            isCorrect: false,
            completionTime: 68000,  // 68 seconds
            answerChanges: 4,
            timeToFirstInteraction: 5800,  // 5.8 seconds
            pauseCount: 3
          }
        ],
        satisfactionRatings: {
          ease: 3,  // "Neutral"
          wouldUse: 3  // "Neutral"
        }
      }
    ],
    finalPreference: 'small-multiples'
  };
}

/**
 * Test function to validate and export sample data
 *
 * Run this function to:
 * 1. Generate sample participant data
 * 2. Validate all required fields are present
 * 3. Export data to JSON file
 * 4. Log results to console
 */
export function testUsabilityExport(): void {
  console.log('=== Testing Usability Data Export ===\n');

  // Test Group A (overlay first)
  console.log('Testing Group A (overlay first)...');
  const sampleDataA = generateSampleData();
  const validationA = validateUsabilityData(sampleDataA);

  console.log('Validation Result:', validationA);

  if (validationA.isValid) {
    console.log('✓ Data validation passed');
    try {
      downloadUsabilityData(sampleDataA);
      console.log('✓ Export successful\n');
    } catch (error) {
      console.error('✗ Export failed:', error);
    }
  } else {
    console.error('✗ Data validation failed');
    console.error('Missing fields:', validationA.missingFields);
    console.error('Warnings:', validationA.warnings);
  }

  // Test Group B (small-multiples first)
  console.log('\nTesting Group B (small-multiples first)...');
  const sampleDataB = generateSampleDataGroupB();
  const validationB = validateUsabilityData(sampleDataB);

  console.log('Validation Result:', validationB);

  if (validationB.isValid) {
    console.log('✓ Data validation passed');
    try {
      downloadUsabilityData(sampleDataB);
      console.log('✓ Export successful\n');
    } catch (error) {
      console.error('✗ Export failed:', error);
    }
  } else {
    console.error('✗ Data validation failed');
    console.error('Missing fields:', validationB.missingFields);
    console.error('Warnings:', validationB.warnings);
  }

  console.log('=== Test Complete ===');
}

/**
 * Calculate summary statistics from participant data
 */
export function calculateSummaryStats(data: ParticipantExportData): {
  overallAccuracy: number;
  averageCompletionTime: number;
  totalAnswerChanges: number;
  averageTimeToFirstInteraction: number;
  totalPauses: number;
  averageSatisfactionEase: number;
  averageSatisfactionWouldUse: number;
} {
  let totalCorrect = 0;
  let totalTasks = 0;
  let totalTime = 0;
  let totalChanges = 0;
  let totalFirstInteraction = 0;
  let totalPauses = 0;
  let totalEase = 0;
  let totalWouldUse = 0;

  data.blocks.forEach(block => {
    block.tasks.forEach(task => {
      if (task.isCorrect) totalCorrect++;
      totalTasks++;
      totalTime += task.completionTime;
      totalChanges += task.answerChanges;
      totalFirstInteraction += task.timeToFirstInteraction;
      totalPauses += task.pauseCount;
    });

    totalEase += block.satisfactionRatings.ease;
    totalWouldUse += block.satisfactionRatings.wouldUse;
  });

  return {
    overallAccuracy: (totalCorrect / totalTasks) * 100,
    averageCompletionTime: totalTime / totalTasks,
    totalAnswerChanges: totalChanges,
    averageTimeToFirstInteraction: totalFirstInteraction / totalTasks,
    totalPauses: totalPauses,
    averageSatisfactionEase: totalEase / data.blocks.length,
    averageSatisfactionWouldUse: totalWouldUse / data.blocks.length
  };
}
