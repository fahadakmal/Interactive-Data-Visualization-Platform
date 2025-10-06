# Data Export System - Usage Guide

## Overview

The data export system has been updated to comprehensively capture all usability metrics as defined in **Chapter 4, Section 4.5.3** of the thesis. The export generates a complete JSON file containing:

- **Metadata**: Session information, browser details, timestamps
- **Demographics**: Participant background information
- **Responses**: All task responses with effectiveness and efficiency metrics
- **Satisfaction**: Post-block Likert ratings and final preference
- **Usability Metrics**: Pre-computed aggregated metrics for quick validation
- **Cognitive Load**: Optional NASA-TLX scores

## Export Structure

The exported JSON follows this structure:

```json
{
  "metadata": {
    "participantId": "P001",
    "assignedGroup": "A",
    "sessionStartTimestamp": "2025-10-05T10:30:00.000Z",
    "sessionEndTimestamp": "2025-10-05T11:02:15.000Z",
    "sessionDurationMinutes": 32.3,
    "browser": "Chrome 118",
    "screenResolution": "1920x1080",
    "operatingSystem": "Windows",
    "exportVersion": "1.0"
  },
  "demographics": {
    "age": 25,
    "gender": "female",
    "educationLevel": "master",
    "fieldOfStudy": "computer science",
    "dataVisualizationExperience": "intermediate"
  },
  "responses": [
    {
      "taskId": "T1",
      "taskNumber": 1,
      "blockNumber": 1,
      "layout": "overlay",
      "question": "Which variable shows the highest day-to-day variability?",
      "selectedAnswer": "Air Quality Index",
      "correctAnswer": "Air Quality Index",
      "isCorrect": true,
      "completionTime": 15420,
      "answerChanges": 2,
      "timeToFirstInteraction": 1834,
      "pauseCount": 1,
      "startTimestamp": "2025-10-05T10:35:00.000Z",
      "endTimestamp": "2025-10-05T10:35:15.420Z"
    }
    // ... 5 more tasks
  ],
  "satisfaction": {
    "blockRatings": [
      {
        "blockNumber": 1,
        "layout": "overlay",
        "easeRating": 4,
        "intentionRating": 3,
        "timestamp": "2025-10-05T10:48:00.000Z"
      },
      {
        "blockNumber": 2,
        "layout": "small-multiples",
        "easeRating": 5,
        "intentionRating": 4,
        "timestamp": "2025-10-05T11:00:00.000Z"
      }
    ],
    "finalPreference": "small-multiples",
    "comments": "Small multiples made comparisons clearer..."
  },
  "usabilityMetrics": {
    "overlayAccuracyPercentage": 66.67,
    "smallMultiplesAccuracyPercentage": 100.0,
    "overlayMeanCompletionTime": 18523,
    "smallMultiplesMeanCompletionTime": 14200,
    "overlayMeanAnswerChanges": 1.67,
    "smallMultiplesMeanAnswerChanges": 0.33,
    "overlayMeanTimeToFirstInteraction": 2100,
    "smallMultiplesMeanTimeToFirstInteraction": 1500,
    "overlayMeanPauseCount": 1.33,
    "smallMultiplesMeanPauseCount": 0.67,
    "totalTasksCompleted": 6,
    "totalCorrect": 5,
    "totalIncorrect": 1,
    "overallAccuracyPercentage": 83.33
  },
  "cognitiveLoad": {
    "mentalDemand": 65,
    "physicalDemand": 10,
    "temporalDemand": 45,
    "performance": 80,
    "effort": 50,
    "frustration": 25,
    "compositeScore": 45.83
  }
}
```

## How to Use the Export System

### Step 1: Collect All Data During Session

Throughout the experiment, the context automatically stores:

```typescript
// Task responses are automatically saved when submitted
const { addTaskResponse } = useVisualization();

// When task is completed:
addTaskResponse({
  taskId: 'T1',
  question: 'Which variable shows highest variability?',
  selectedAnswer: 'Air Quality Index',
  isCorrect: true,
  completionTime: 15420,
  metrics: {
    answerChanges: 2,
    timeToFirstInteraction: 1834,
    pauseCount: 1
  },
  layout: 'overlay',
  timestamp: Date.now()
});

// Satisfaction responses saved after each block
const { addSatisfactionResponse } = useVisualization();

addSatisfactionResponse({
  blockId: '1',
  layout: 'overlay',
  ease: 4,
  wouldUse: 3
});
```

### Step 2: Prepare Export Data

When the experiment is complete (typically in a completion/thank-you component):

```typescript
import { prepareExportData, downloadUsabilityData, validateUsabilityData } from '../utils/downloadUtils';
import { useVisualization } from '../contexts/VisualizationContext';

function CompletionStep() {
  const {
    taskResponses,
    satisfactionResponses,
    getTaskResponses,
    getSatisfactionResponses
  } = useVisualization();

  const handleExport = () => {
    // Gather all the data
    const exportData = prepareExportData({
      participantId: 'P001',  // Should be set at session start
      assignedGroup: 'A',     // A = overlay first, B = small-multiples first
      sessionStartTime: new Date(sessionStorage.getItem('sessionStart')!),
      demographics: {
        age: 25,
        gender: 'female',
        educationLevel: 'master',
        fieldOfStudy: 'computer science',
        dataVisualizationExperience: 'intermediate'
      },
      taskResponses: getTaskResponses(),
      satisfactionResponses: getSatisfactionResponses(),
      finalPreference: 'small-multiples',  // From final questionnaire
      comments: 'Optional participant feedback',
      nasaTLX: {  // Optional
        mentalDemand: 65,
        physicalDemand: 10,
        temporalDemand: 45,
        performance: 80,
        effort: 50,
        frustration: 25,
        compositeScore: 45.83
      }
    });

    // Validate before download
    const validation = validateUsabilityData(exportData);
    if (!validation.isValid) {
      console.error('Export validation failed:', validation.missingFields);
      alert('Data export is incomplete. Missing: ' + validation.missingFields.join(', '));
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('Export warnings:', validation.warnings);
    }

    // Download the JSON file
    downloadUsabilityData(exportData, 'P001');
    // This creates: participant_P001_20251005_143000.json
  };

  return (
    <Box>
      <Typography variant="h4">Thank You!</Typography>
      <Typography>Your data has been recorded.</Typography>
      <Button onClick={handleExport} variant="contained" color="primary">
        Download Data File
      </Button>
    </Box>
  );
}
```

### Step 3: Validation

The `validateUsabilityData` function checks for:

**Critical Errors** (will prevent download):
- Missing metadata fields
- Missing task responses
- Missing satisfaction ratings
- Missing usability metrics

**Warnings** (will allow download but log issues):
- Wrong number of tasks (expected 6)
- Wrong number of satisfaction blocks (expected 2)
- Likert ratings out of range (1-5)
- Completion times out of plausible range

Example validation output:

```typescript
{
  isValid: true,
  missingFields: [],
  warnings: [
    "responses[2].completionTime exceeds 5 minutes: 320000ms"
  ]
}
```

## Metrics Explained

### Effectiveness Metrics
- **isCorrect**: Boolean indicating if answer was correct
- **accuracy**: Percentage of correct answers per layout
- **totalCorrect/totalIncorrect**: Counts across all tasks

### Efficiency Metrics
- **completionTime**: Total milliseconds from task display to submit
- **answerChanges**: Number of times participant changed their radio button selection
- **timeToFirstInteraction**: Milliseconds from task display to first user action
- **pauseCount**: Number of pauses >5 seconds during task

### Satisfaction Metrics
- **easeRating**: "How easy was it to complete tasks?" (1-5 Likert)
- **intentionRating**: "Would you use this layout in your work?" (1-5 Likert)
- **finalPreference**: Overall layout preference (overlay/small-multiples/no-preference)

## Statistical Analysis Integration

The exported JSON can be directly imported into R for analysis:

```r
library(jsonlite)
library(dplyr)

# Read participant data
data <- fromJSON("participant_P001_20251005_143000.json")

# Extract effectiveness data
accuracy_overlay <- data$usabilityMetrics$overlayAccuracyPercentage
accuracy_sm <- data$usabilityMetrics$smallMultiplesAccuracyPercentage

# Extract efficiency data
time_overlay <- data$usabilityMetrics$overlayMeanCompletionTime
time_sm <- data$usabilityMetrics$smallMultiplesMeanCompletionTime

# Extract satisfaction data
satisfaction <- data$satisfaction$blockRatings
ease_overlay <- satisfaction[satisfaction$layout == "overlay", "easeRating"]
ease_sm <- satisfaction[satisfaction$layout == "small-multiples", "easeRating"]

# Run paired t-test (see Chapter 5 methodology)
t.test(accuracy_overlay, accuracy_sm, paired = TRUE)
```

## File Naming Convention

Exported files follow this naming pattern:
```
participant_{participantId}_{timestamp}.json
```

Examples:
- `participant_P001_20251005_143000.json`
- `participant_P015_20251115_091530.json`

Timestamp format: `YYYYMMDD_HHMMSS`

## Error Handling

The export system includes comprehensive error handling:

```typescript
try {
  downloadUsabilityData(exportData, participantId);
  console.log('Export successful');
} catch (error) {
  console.error('Export failed:', error);
  alert('Failed to export data. Please try again or contact the researcher.');
}
```

## Testing the Export

To test the export system with sample data:

```typescript
import { prepareExportData, validateUsabilityData } from './utils/downloadUtils';

// Create mock data
const mockData = prepareExportData({
  participantId: 'TEST001',
  assignedGroup: 'A',
  sessionStartTime: new Date('2025-10-05T10:00:00Z'),
  demographics: {
    age: 25,
    dataVisualizationExperience: 'intermediate'
  },
  taskResponses: [
    // Add 6 mock task responses
  ],
  satisfactionResponses: [
    // Add 2 mock satisfaction responses
  ],
  finalPreference: 'overlay'
});

// Validate
const validation = validateUsabilityData(mockData);
console.log('Validation result:', validation);

// If valid, inspect structure
if (validation.isValid) {
  console.log('Export data structure:', JSON.stringify(mockData, null, 2));
}
```

## Notes for Researchers

1. **Participant ID Management**: Assign unique IDs sequentially (P001, P002, etc.) at session start
2. **Group Assignment**: Use counterbalancing (odd participants = Group A, even = Group B)
3. **Data Backup**: localStorage automatically backs up data during session
4. **Manual Collection**: Instruct participants to email JSON file to researcher after download
5. **Data Verification**: Use Python validation script (`validate_export.py`) to check received files

## Related Files

- **Type Definitions**: `src/types/visualization.ts`
- **Export Functions**: `src/utils/downloadUtils.ts`
- **Context State**: `src/contexts/VisualizationContext.tsx`
- **Chapter 4 Documentation**: `LUT_Thesis_2023_LaTeX/ch4.tex` (Section 4.5.3)

## Changelog

**Version 1.0** (October 2025)
- Complete implementation of Chapter 4 export schema
- All effectiveness, efficiency, and satisfaction metrics included
- Automatic metadata collection (browser, OS, screen resolution)
- Comprehensive validation with error reporting
- Pre-computed usability metrics for quick verification
