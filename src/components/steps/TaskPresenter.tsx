import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  LinearProgress,
} from '@mui/material';
import { ExperimentTask, TaskResponse, TaskMetrics } from '../../types/visualization';

interface TaskPresenterProps {
  task: ExperimentTask;
  layout: 'overlay' | 'small-multiples';
  onComplete: (response: TaskResponse) => void;
  onSkip?: () => void;
}

const TaskPresenter: React.FC<TaskPresenterProps> = ({
  task,
  layout,
  onComplete,
  onSkip,
}) => {
  // State for selected answer
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Tracking metrics state
  const [answerChanges, setAnswerChanges] = useState<number>(0);
  const [timeToFirstInteraction, setTimeToFirstInteraction] = useState<number | null>(null);
  const [pauseCount, setPauseCount] = useState<number>(0);

  // Refs for timing and interaction tracking
  const taskStartTime = useRef<number>(performance.now());
  const lastMouseMoveTime = useRef<number>(performance.now());
  const firstInteractionRecorded = useRef<boolean>(false);
  const pauseCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const previousAnswer = useRef<string | null>(null);

  /**
   * Feature 1: Answer Change Tracking
   * Counts how many times the participant changes their answer
   */
  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = event.target.value;

    // Increment answer changes counter if this is a change from a previous selection
    if (previousAnswer.current !== null && previousAnswer.current !== newAnswer) {
      setAnswerChanges(prev => prev + 1);
    }

    previousAnswer.current = newAnswer;
    setSelectedAnswer(newAnswer);
  };

  /**
   * Feature 2: Time-to-First-Interaction
   * Measures time from task display to first mouse movement or click
   */
  const handleFirstInteraction = useCallback(() => {
    if (!firstInteractionRecorded.current) {
      const firstInteractionTime = performance.now() - taskStartTime.current;
      setTimeToFirstInteraction(firstInteractionTime);
      firstInteractionRecorded.current = true;
    }
  }, []);

  /**
   * Feature 3: Pause Detection
   * Counts pauses >5 seconds with no mouse movement
   */
  const handleMouseMove = useCallback(() => {
    // Record first interaction on mouse movement
    handleFirstInteraction();

    // Update last mouse move timestamp
    lastMouseMoveTime.current = performance.now();
  }, [handleFirstInteraction]);

  const handleMouseClick = useCallback(() => {
    // Record first interaction on mouse click
    handleFirstInteraction();

    // Update last mouse move timestamp (click counts as activity)
    lastMouseMoveTime.current = performance.now();
  }, [handleFirstInteraction]);

  /**
   * Check for pauses every second
   * A pause is defined as >5 seconds of no mouse movement
   */
  useEffect(() => {
    const PAUSE_THRESHOLD = 5000; // 5 seconds in milliseconds
    const CHECK_INTERVAL = 1000;   // Check every 1 second

    let lastPauseCheckTime = performance.now();
    let pauseDetected = false;

    pauseCheckInterval.current = setInterval(() => {
      const now = performance.now();
      const timeSinceLastMove = now - lastMouseMoveTime.current;

      // If more than 5 seconds have passed since last mouse movement
      if (timeSinceLastMove >= PAUSE_THRESHOLD) {
        // Only count a new pause if we haven't already counted this pause period
        if (!pauseDetected) {
          setPauseCount(prev => prev + 1);
          pauseDetected = true;
        }
      } else {
        // Reset pause detection when user moves mouse again
        pauseDetected = false;
      }

      lastPauseCheckTime = now;
    }, CHECK_INTERVAL);

    return () => {
      if (pauseCheckInterval.current) {
        clearInterval(pauseCheckInterval.current);
      }
    };
  }, []);

  /**
   * Attach global mouse event listeners
   * These track all mouse activity on the page during the task
   */
  useEffect(() => {
    // Add event listeners to track mouse activity
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);

    // Cleanup event listeners when component unmounts
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
    };
  }, [handleMouseMove, handleMouseClick]);

  /**
   * Handle task completion
   * Collects all metrics and creates the response object
   */
  const handleSubmit = () => {
    const completionTime = performance.now() - taskStartTime.current;

    const metrics: TaskMetrics = {
      answerChanges,
      timeToFirstInteraction: timeToFirstInteraction ?? 0,
      pauseCount,
    };

    // Extract the letter (A, B, C, D) from the selected answer
    // Selected answer format: "A) Temperature" -> Extract "A"
    const answerLetter = selectedAnswer?.charAt(0) || null;

    const response: TaskResponse = {
      taskId: task.id,
      question: task.question,
      selectedAnswer,
      isCorrect: answerLetter === task.correctAnswer,
      completionTime,
      metrics,
      layout,
      timestamp: Date.now(),
    };

    onComplete(response);
  };

  /**
   * Display debug information (for testing/verification)
   * This can be removed in production
   */
  const showDebugInfo = false; // Set to true to see real-time metrics

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Task Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Task {task.id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Layout: {layout === 'overlay' ? 'Overlay (Combined)' : 'Small Multiples (Separate)'}
          </Typography>
        </Box>

        {/* Task Question */}
        <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
          {task.question}
        </Typography>

        {/* Answer Choices */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
          <RadioGroup
            value={selectedAnswer || ''}
            onChange={handleAnswerChange}
          >
            {task.choices.map((choice, index) => (
              <FormControlLabel
                key={index}
                value={choice}
                control={<Radio />}
                label={choice}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* Debug Information (for testing) */}
        {showDebugInfo && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              Debug Metrics:
            </Typography>
            <Typography variant="caption" display="block">
              Answer Changes: {answerChanges}
            </Typography>
            <Typography variant="caption" display="block">
              Time to First Interaction: {timeToFirstInteraction ? `${timeToFirstInteraction}ms` : 'Not recorded'}
            </Typography>
            <Typography variant="caption" display="block">
              Pause Count (&gt;5s): {pauseCount}
            </Typography>
            <Typography variant="caption" display="block">
              Elapsed Time: {Math.floor((performance.now() - taskStartTime.current) / 1000)}s
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onSkip && (
            <Button
              variant="outlined"
              onClick={onSkip}
            >
              Skip
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Submit Answer
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TaskPresenter;
