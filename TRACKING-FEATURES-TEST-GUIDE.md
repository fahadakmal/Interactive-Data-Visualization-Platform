# Task Tracking Features - Testing Guide

## Overview
This document explains how to test the three tracking features implemented in the TaskPresenter component.

## Implemented Features

### 1. Answer Change Tracking
**Location:** `TaskPresenter.tsx` (lines 56-66)

**Implementation:**
- Tracks every time a participant changes their answer selection
- Uses `previousAnswer` ref to compare with new selections
- Only counts actual changes (not initial selection)
- Stored as `answerChanges` in TaskResponse

**How it works:**
```typescript
const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const newAnswer = event.target.value;

  // Only increment if changing from a previous selection
  if (previousAnswer.current !== null && previousAnswer.current !== newAnswer) {
    setAnswerChanges(prev => prev + 1);
  }

  previousAnswer.current = newAnswer;
  setSelectedAnswer(newAnswer);
};
```

**Test Scenario:**
1. Load a task
2. Click answer A (count = 0, first selection doesn't count as change)
3. Click answer B (count = 1)
4. Click answer A again (count = 2)
5. Click answer C (count = 3)
6. Submit and verify `answerChanges = 3`

---

### 2. Time-to-First-Interaction
**Location:** `TaskPresenter.tsx` (lines 71-81)

**Implementation:**
- Measures milliseconds from task display to first user interaction
- Tracks both mouse movement and mouse clicks
- Uses `firstInteractionRecorded` flag to ensure single recording
- Stored as `timeToFirstInteraction` in TaskResponse

**How it works:**
```typescript
const handleFirstInteraction = useCallback(() => {
  if (!firstInteractionRecorded.current) {
    const firstInteractionTime = Date.now() - taskStartTime.current;
    setTimeToFirstInteraction(firstInteractionTime);
    firstInteractionRecorded.current = true;
  }
}, []);
```

**Test Scenario:**
1. Load a task
2. Wait 2 seconds without moving mouse
3. Move mouse or click
4. Verify `timeToFirstInteraction` is approximately 2000ms
5. Continue moving mouse and verify time doesn't change

---

### 3. Pause Detection
**Location:** `TaskPresenter.tsx` (lines 93-130)

**Implementation:**
- Counts pauses longer than 5 seconds with no mouse movement
- Uses interval check every 1 second
- Resets pause detection when mouse moves again
- Stored as `pauseCount` in TaskResponse

**How it works:**
```typescript
useEffect(() => {
  const PAUSE_THRESHOLD = 5000; // 5 seconds
  const CHECK_INTERVAL = 1000;   // Check every 1 second

  let pauseDetected = false;

  pauseCheckInterval.current = setInterval(() => {
    const timeSinceLastMove = Date.now() - lastMouseMoveTime.current;

    if (timeSinceLastMove >= PAUSE_THRESHOLD) {
      if (!pauseDetected) {
        setPauseCount(prev => prev + 1);
        pauseDetected = true;
      }
    } else {
      pauseDetected = false;
    }
  }, CHECK_INTERVAL);

  return () => clearInterval(pauseCheckInterval.current);
}, []);
```

**Test Scenario:**
1. Load a task
2. Move mouse to start tracking
3. Stop moving mouse for 6 seconds
4. Verify `pauseCount = 1`
5. Move mouse, then pause for 7 seconds again
6. Verify `pauseCount = 2`
7. Submit and check final pause count

---

## Testing the Component

### Setup Test Component

Create a test file: `project/src/components/steps/TaskPresenterTest.tsx`

```typescript
import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import TaskPresenter from './TaskPresenter';
import { ExperimentTask, TaskResponse } from '../../types/visualization';
import { useVisualization } from '../../contexts/VisualizationContext';

const TaskPresenterTest: React.FC = () => {
  const { addTaskResponse, getTaskResponses, clearTaskResponses } = useVisualization();
  const [currentTask, setCurrentTask] = useState<ExperimentTask | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Sample test task
  const testTask: ExperimentTask = {
    id: 'T1',
    question: 'Which variable shows the highest day-to-day variability in February 2023?',
    choices: [
      'A) Temperature',
      'B) Air Quality Index',
      'C) CO2',
      'D) Precipitation'
    ],
    correctAnswer: 'B) Air Quality Index',
    difficulty: 'easy',
    category: 'Pattern Identification'
  };

  const handleStartTask = () => {
    setCurrentTask(testTask);
    setShowResults(false);
  };

  const handleTaskComplete = (response: TaskResponse) => {
    addTaskResponse(response);
    setCurrentTask(null);
    setShowResults(true);

    console.log('Task Response:', response);
    console.log('Metrics:', response.metrics);
  };

  const responses = getTaskResponses();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Task Tracking Features Test
      </Typography>

      {!currentTask && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleStartTask}
            sx={{ mr: 2 }}
          >
            Start Test Task
          </Button>
          <Button
            variant="outlined"
            onClick={clearTaskResponses}
          >
            Clear All Responses
          </Button>
        </Box>
      )}

      {currentTask && (
        <TaskPresenter
          task={currentTask}
          layout="overlay"
          onComplete={handleTaskComplete}
        />
      )}

      {showResults && responses.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Latest Response Metrics
          </Typography>
          {responses.map((response, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Task:</strong> {response.taskId}
              </Typography>
              <Typography variant="body2">
                <strong>Selected:</strong> {response.selectedAnswer}
              </Typography>
              <Typography variant="body2">
                <strong>Correct:</strong> {response.isCorrect ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                <strong>Completion Time:</strong> {(response.completionTime / 1000).toFixed(2)}s
              </Typography>
              <Typography variant="body2">
                <strong>Answer Changes:</strong> {response.metrics.answerChanges}
              </Typography>
              <Typography variant="body2">
                <strong>Time to First Interaction:</strong> {response.metrics.timeToFirstInteraction}ms
              </Typography>
              <Typography variant="body2">
                <strong>Pause Count (&gt;5s):</strong> {response.metrics.pauseCount}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Test Instructions
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Testing Answer Changes:</strong>
          <br />1. Start the task
          <br />2. Click different answers multiple times
          <br />3. Expected: Each change increments the counter
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Testing Time-to-First-Interaction:</strong>
          <br />1. Start the task
          <br />2. Wait 2-3 seconds WITHOUT moving your mouse
          <br />3. Then move your mouse
          <br />4. Expected: Time recorded should be ~2000-3000ms
        </Typography>
        <Typography variant="body2">
          <strong>Testing Pause Detection:</strong>
          <br />1. Start the task
          <br />2. Move mouse to start tracking
          <br />3. Don't move mouse for 6+ seconds
          <br />4. Move mouse briefly
          <br />5. Pause again for 6+ seconds
          <br />6. Expected: pauseCount should be 2
        </Typography>
      </Paper>
    </Box>
  );
};

export default TaskPresenterTest;
```

### Running the Tests

1. **Enable debug mode in TaskPresenter.tsx:**
   - Change line 198: `const showDebugInfo = true;`

2. **Add test route to your app:**
   ```typescript
   // In App.tsx or routing file
   import TaskPresenterTest from './components/steps/TaskPresenterTest';

   // Add route or button to navigate to test
   ```

3. **Manual testing checklist:**

   - [ ] Start task and verify timer starts
   - [ ] Wait 2 seconds, then move mouse - verify timeToFirstInteraction ~2000ms
   - [ ] Click answer A - verify answerChanges = 0
   - [ ] Click answer B - verify answerChanges = 1
   - [ ] Click answer A - verify answerChanges = 2
   - [ ] Click answer C - verify answerChanges = 3
   - [ ] Move mouse, then pause 6 seconds - verify pauseCount = 1
   - [ ] Move mouse, then pause 6 seconds again - verify pauseCount = 2
   - [ ] Submit answer - verify all metrics saved correctly

---

## Data Storage

All task responses are stored in:
- **Memory:** `VisualizationContext.taskResponses` state
- **LocalStorage:** Key `'taskResponses'`
- **Format:** Array of `TaskResponse` objects

### Access stored data:
```typescript
const { getTaskResponses } = useVisualization();
const allResponses = getTaskResponses();
console.log('All task responses:', allResponses);
```

### Clear stored data:
```typescript
const { clearTaskResponses } = useVisualization();
clearTaskResponses();
```

---

## Expected Output Format

When a task is completed, the response object should look like:

```json
{
  "taskId": "T1",
  "question": "Which variable shows the highest day-to-day variability...",
  "selectedAnswer": "B) Air Quality Index",
  "isCorrect": true,
  "completionTime": 15420,
  "metrics": {
    "answerChanges": 2,
    "timeToFirstInteraction": 1834,
    "pauseCount": 1
  },
  "layout": "overlay",
  "timestamp": 1728140562000
}
```

---

## Troubleshooting

### Issue: timeToFirstInteraction always 0
**Solution:** Make sure mouse event listeners are attached. Check browser console for errors.

### Issue: pauseCount not incrementing
**Solution:** Verify you're waiting full 5+ seconds without ANY mouse movement. Check that interval is running.

### Issue: answerChanges counting first selection
**Solution:** This is incorrect. First selection should NOT count. Check `previousAnswer.current` logic.

### Issue: Metrics not persisting after page refresh
**Solution:** Verify localStorage is enabled and `saveTaskResponsesToLocalStorage` is being called.

---

## Performance Considerations

- **Mouse event listeners:** Attached to document level, cleaned up on unmount
- **Interval timer:** Runs every 1 second, cleared on unmount
- **LocalStorage:** Saves after each task completion, not on every state change

---

## Next Steps

After verifying all three features work correctly:

1. Integrate TaskPresenter into the main experiment workflow
2. Create experiment task definitions from `experiment-tasks-design-FINAL.md`
3. Implement block-based task presentation (3 tasks per block)
4. Add post-block satisfaction questionnaires
5. Create data export functionality for all metrics
