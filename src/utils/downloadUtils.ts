import {
  ParticipantExportData,
  ExportMetadata,
  ExportUsabilityMetrics,
  TaskResponse,
  SatisfactionResponse
} from '../types/visualization';

// Utility to download SVG as SVG file
export function downloadSvg(svgElement: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);
  // Add XML declaration
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility to download SVG as PNG file
export function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string, width?: number, height?: number) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);
  // Add XML declaration
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const svg64 = btoa(unescape(encodeURIComponent(source)));
  const image64 = 'data:image/svg+xml;base64,' + svg64;
  const img = new window.Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = width || svgElement.width.baseVal.value || 800;
    canvas.height = height || svgElement.height.baseVal.value || 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };
  img.src = image64;
}

/**
 * Downloads usability evaluation data as a JSON file
 *
 * This function exports all usability metrics collected during the experiment:
 * - Effectiveness: Task accuracy (isCorrect)
 * - Efficiency: Completion time, answer changes, time-to-first-interaction, pause count
 * - Satisfaction: Likert ratings per block, final layout preference
 *
 * Filename format: participant_{id}_{timestamp}.json
 *
 * @param data - Complete participant data including all tasks, blocks, and metrics
 * @param participantId - Unique participant identifier (e.g., "P001", "P002")
 */
export function downloadUsabilityData(data: ParticipantExportData, participantId?: string): void {
  try {
    // Use provided participantId or extract from data
    const pid = participantId || data.participantId;

    // Generate timestamp for filename (format: YYYYMMDD_HHMMSS)
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];

    // Create filename: participant_{id}_{timestamp}.json
    const filename = `participant_${pid}_${timestamp}.json`;

    // Convert data to formatted JSON string (2 spaces for readability)
    const jsonString = JSON.stringify(data, null, 2);

    // Create blob with JSON data
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Usability data exported successfully: ${filename}`);
  } catch (error) {
    console.error('Error exporting usability data:', error);
    throw new Error(`Failed to export usability data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that all required usability metrics are present in the export data
 * Aligned with Chapter 4, Section 4.5.3 export schema specification
 *
 * @param data - Participant data to validate
 * @returns Object with isValid boolean, array of missing fields, and warnings
 */
export function validateUsabilityData(data: ParticipantExportData): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Validate metadata object
  if (!data.metadata) {
    missingFields.push('metadata');
  } else {
    if (!data.metadata.participantId) missingFields.push('metadata.participantId');
    if (!data.metadata.assignedGroup) missingFields.push('metadata.assignedGroup');
    if (!data.metadata.sessionStartTimestamp) missingFields.push('metadata.sessionStartTimestamp');
    if (!data.metadata.sessionEndTimestamp) missingFields.push('metadata.sessionEndTimestamp');
    if (data.metadata.sessionDurationMinutes === undefined) missingFields.push('metadata.sessionDurationMinutes');
    if (!data.metadata.browser) missingFields.push('metadata.browser');
    if (!data.metadata.screenResolution) missingFields.push('metadata.screenResolution');
    if (!data.metadata.operatingSystem) missingFields.push('metadata.operatingSystem');
    if (!data.metadata.exportVersion) missingFields.push('metadata.exportVersion');
  }

  // Validate demographics object (optional fields, just check existence)
  if (!data.demographics) {
    warnings.push('demographics object is missing');
  }

  // Validate responses array
  if (!data.responses || data.responses.length === 0) {
    missingFields.push('responses');
  } else {
    if (data.responses.length !== 6) {
      warnings.push(`Expected 6 task responses, found ${data.responses.length}`);
    }

    data.responses.forEach((response, index) => {
      const prefix = `responses[${index}]`;

      if (!response.taskId) missingFields.push(`${prefix}.taskId`);
      if (response.taskNumber === undefined) missingFields.push(`${prefix}.taskNumber`);
      if (response.blockNumber === undefined) missingFields.push(`${prefix}.blockNumber`);
      if (!response.layout) missingFields.push(`${prefix}.layout`);
      if (!response.question) missingFields.push(`${prefix}.question`);
      if (!response.selectedAnswer) missingFields.push(`${prefix}.selectedAnswer`);
      if (!response.correctAnswer) missingFields.push(`${prefix}.correctAnswer`);
      if (response.isCorrect === undefined) missingFields.push(`${prefix}.isCorrect`);
      if (response.completionTime === undefined) missingFields.push(`${prefix}.completionTime`);
      if (response.answerChanges === undefined) missingFields.push(`${prefix}.answerChanges`);
      if (response.timeToFirstInteraction === undefined) missingFields.push(`${prefix}.timeToFirstInteraction`);
      if (response.pauseCount === undefined) missingFields.push(`${prefix}.pauseCount`);
      if (!response.startTimestamp) missingFields.push(`${prefix}.startTimestamp`);
      if (!response.endTimestamp) missingFields.push(`${prefix}.endTimestamp`);

      // Validate timing consistency
      if (response.completionTime < 0) {
        warnings.push(`${prefix}.completionTime is negative: ${response.completionTime}`);
      }
      if (response.completionTime > 300000) {
        warnings.push(`${prefix}.completionTime exceeds 5 minutes: ${response.completionTime}ms`);
      }
    });
  }

  // Validate satisfaction object
  if (!data.satisfaction) {
    missingFields.push('satisfaction');
  } else {
    if (!data.satisfaction.blockRatings || data.satisfaction.blockRatings.length === 0) {
      missingFields.push('satisfaction.blockRatings');
    } else {
      if (data.satisfaction.blockRatings.length !== 2) {
        warnings.push(`Expected 2 satisfaction blocks, found ${data.satisfaction.blockRatings.length}`);
      }

      data.satisfaction.blockRatings.forEach((block, index) => {
        const prefix = `satisfaction.blockRatings[${index}]`;

        if (block.blockNumber === undefined) missingFields.push(`${prefix}.blockNumber`);
        if (!block.layout) missingFields.push(`${prefix}.layout`);
        if (block.easeRating === undefined) {
          missingFields.push(`${prefix}.easeRating`);
        } else if (block.easeRating < 1 || block.easeRating > 5) {
          warnings.push(`${prefix}.easeRating should be 1-5, got ${block.easeRating}`);
        }
        if (block.intentionRating === undefined) {
          missingFields.push(`${prefix}.intentionRating`);
        } else if (block.intentionRating < 1 || block.intentionRating > 5) {
          warnings.push(`${prefix}.intentionRating should be 1-5, got ${block.intentionRating}`);
        }
        if (!block.timestamp) missingFields.push(`${prefix}.timestamp`);
      });
    }

    if (!data.satisfaction.finalPreference) {
      missingFields.push('satisfaction.finalPreference');
    }
  }

  // Validate usabilityMetrics object
  if (!data.usabilityMetrics) {
    missingFields.push('usabilityMetrics');
  } else {
    const metrics = data.usabilityMetrics;
    if (metrics.overlayAccuracyPercentage === undefined) missingFields.push('usabilityMetrics.overlayAccuracyPercentage');
    if (metrics.smallMultiplesAccuracyPercentage === undefined) missingFields.push('usabilityMetrics.smallMultiplesAccuracyPercentage');
    if (metrics.overlayMeanCompletionTime === undefined) missingFields.push('usabilityMetrics.overlayMeanCompletionTime');
    if (metrics.smallMultiplesMeanCompletionTime === undefined) missingFields.push('usabilityMetrics.smallMultiplesMeanCompletionTime');
    if (metrics.totalTasksCompleted === undefined) missingFields.push('usabilityMetrics.totalTasksCompleted');
    if (metrics.totalCorrect === undefined) missingFields.push('usabilityMetrics.totalCorrect');
    if (metrics.totalIncorrect === undefined) missingFields.push('usabilityMetrics.totalIncorrect');
    if (metrics.overallAccuracyPercentage === undefined) missingFields.push('usabilityMetrics.overallAccuracyPercentage');
  }

  // Validate cognitiveLoad if present (optional)
  if (data.cognitiveLoad) {
    const tlx = data.cognitiveLoad;
    if (tlx.mentalDemand === undefined) missingFields.push('cognitiveLoad.mentalDemand');
    if (tlx.physicalDemand === undefined) missingFields.push('cognitiveLoad.physicalDemand');
    if (tlx.temporalDemand === undefined) missingFields.push('cognitiveLoad.temporalDemand');
    if (tlx.performance === undefined) missingFields.push('cognitiveLoad.performance');
    if (tlx.effort === undefined) missingFields.push('cognitiveLoad.effort');
    if (tlx.frustration === undefined) missingFields.push('cognitiveLoad.frustration');
    if (tlx.compositeScore === undefined) missingFields.push('cognitiveLoad.compositeScore');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Helper function to detect browser information
 */
export function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Detect browser
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  return `${browserName} ${browserVersion}`;
}

/**
 * Helper function to detect operating system
 */
export function getOperatingSystem(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1) return 'iOS';
  return 'Unknown';
}

/**
 * Helper function to get screen resolution
 */
export function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

/**
 * Calculate usability metrics from task responses
 * This function aggregates effectiveness and efficiency metrics per layout
 */
export function calculateUsabilityMetrics(
  taskResponses: TaskResponse[]
): ExportUsabilityMetrics {
  // Separate responses by layout
  const overlayResponses = taskResponses.filter(r => r.layout === 'overlay');
  const smallMultiplesResponses = taskResponses.filter(r => r.layout === 'small-multiples');

  // Helper to calculate metrics for a layout
  const calculateLayoutMetrics = (responses: TaskResponse[]) => {
    if (responses.length === 0) {
      return {
        accuracy: 0,
        meanCompletionTime: 0,
        meanAnswerChanges: 0,
        meanTimeToFirstInteraction: 0,
        meanPauseCount: 0,
        correctCount: 0
      };
    }

    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = (correctCount / responses.length) * 100;

    const meanCompletionTime = responses.reduce((sum, r) => sum + r.completionTime, 0) / responses.length;
    const meanAnswerChanges = responses.reduce((sum, r) => sum + r.metrics.answerChanges, 0) / responses.length;
    const meanTimeToFirstInteraction = responses.reduce((sum, r) => sum + r.metrics.timeToFirstInteraction, 0) / responses.length;
    const meanPauseCount = responses.reduce((sum, r) => sum + r.metrics.pauseCount, 0) / responses.length;

    return {
      accuracy,
      meanCompletionTime,
      meanAnswerChanges,
      meanTimeToFirstInteraction,
      meanPauseCount,
      correctCount
    };
  };

  const overlayMetrics = calculateLayoutMetrics(overlayResponses);
  const smallMultiplesMetrics = calculateLayoutMetrics(smallMultiplesResponses);

  const totalCorrect = overlayMetrics.correctCount + smallMultiplesMetrics.correctCount;
  const totalIncorrect = taskResponses.length - totalCorrect;
  const overallAccuracy = taskResponses.length > 0 ? (totalCorrect / taskResponses.length) * 100 : 0;

  return {
    overlayAccuracyPercentage: Math.round(overlayMetrics.accuracy * 100) / 100,
    smallMultiplesAccuracyPercentage: Math.round(smallMultiplesMetrics.accuracy * 100) / 100,
    overlayMeanCompletionTime: Math.round(overlayMetrics.meanCompletionTime),
    smallMultiplesMeanCompletionTime: Math.round(smallMultiplesMetrics.meanCompletionTime),
    overlayMeanAnswerChanges: Math.round(overlayMetrics.meanAnswerChanges * 100) / 100,
    smallMultiplesMeanAnswerChanges: Math.round(smallMultiplesMetrics.meanAnswerChanges * 100) / 100,
    overlayMeanTimeToFirstInteraction: Math.round(overlayMetrics.meanTimeToFirstInteraction),
    smallMultiplesMeanTimeToFirstInteraction: Math.round(smallMultiplesMetrics.meanTimeToFirstInteraction),
    overlayMeanPauseCount: Math.round(overlayMetrics.meanPauseCount * 100) / 100,
    smallMultiplesMeanPauseCount: Math.round(smallMultiplesMetrics.meanPauseCount * 100) / 100,
    totalTasksCompleted: taskResponses.length,
    totalCorrect,
    totalIncorrect,
    overallAccuracyPercentage: Math.round(overallAccuracy * 100) / 100
  };
}

/**
 * Prepare complete export data structure from context state
 * Transforms raw context data into the structured format defined in Chapter 4
 *
 * @param participantId - Unique participant identifier
 * @param assignedGroup - Counterbalancing group (A or B)
 * @param sessionStartTime - Session start timestamp
 * @param demographics - Participant demographics data
 * @param taskResponses - All task responses with metrics
 * @param satisfactionResponses - Post-block satisfaction ratings
 * @param finalPreference - Final layout preference
 * @param comments - Optional open-ended feedback
 * @param nasaTLX - Optional NASA-TLX cognitive load data
 */
export function prepareExportData(params: {
  participantId: string;
  assignedGroup: 'A' | 'B';
  sessionStartTime: Date;
  demographics: ParticipantExportData['demographics'];
  taskResponses: TaskResponse[];
  satisfactionResponses: SatisfactionResponse[];
  finalPreference: 'overlay' | 'small-multiples' | 'no-preference';
  comments?: string;
  nasaTLX?: ParticipantExportData['cognitiveLoad'];
}): ParticipantExportData {
  const sessionEndTime = new Date();
  const sessionDurationMinutes = (sessionEndTime.getTime() - params.sessionStartTime.getTime()) / (1000 * 60);

  // Construct metadata
  const metadata: ExportMetadata = {
    participantId: params.participantId,
    assignedGroup: params.assignedGroup,
    sessionStartTimestamp: params.sessionStartTime.toISOString(),
    sessionEndTimestamp: sessionEndTime.toISOString(),
    sessionDurationMinutes: Math.round(sessionDurationMinutes * 10) / 10,
    browser: getBrowserInfo(),
    screenResolution: getScreenResolution(),
    operatingSystem: getOperatingSystem(),
    exportVersion: '1.0'
  };

  // Transform task responses to export format
  const exportResponses = params.taskResponses.map((task, index) => ({
    taskId: task.taskId,
    taskNumber: index + 1,
    blockNumber: index < 3 ? 1 : 2,
    layout: task.layout,
    question: task.question,
    selectedAnswer: task.selectedAnswer || 'No answer',
    correctAnswer: 'Unknown',  // Should be populated from task definition
    isCorrect: task.isCorrect || false,
    completionTime: task.completionTime,
    answerChanges: task.metrics.answerChanges,
    timeToFirstInteraction: task.metrics.timeToFirstInteraction,
    pauseCount: task.metrics.pauseCount,
    startTimestamp: new Date(task.timestamp - task.completionTime).toISOString(),
    endTimestamp: new Date(task.timestamp).toISOString()
  }));

  // Transform satisfaction responses to export format
  const satisfactionBlocks = params.satisfactionResponses.map((response, index) => ({
    blockNumber: index + 1,
    layout: response.layout,
    easeRating: response.ease,
    intentionRating: response.wouldUse,
    timestamp: new Date(response.timestamp).toISOString()
  }));

  // Construct satisfaction object
  const satisfaction = {
    blockRatings: satisfactionBlocks,
    finalPreference: params.finalPreference,
    comments: params.comments
  };

  // Calculate usability metrics
  const usabilityMetrics = calculateUsabilityMetrics(params.taskResponses);

  // Construct complete export data
  const exportData: ParticipantExportData = {
    metadata,
    demographics: params.demographics,
    responses: exportResponses,
    satisfaction,
    usabilityMetrics
  };

  // Add NASA-TLX if provided
  if (params.nasaTLX) {
    exportData.cognitiveLoad = params.nasaTLX;
  }

  return exportData;
} 