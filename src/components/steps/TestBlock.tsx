import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress } from '@mui/material';
import TaskPresenter from './TaskPresenter';
import { useVisualization } from '../../contexts/VisualizationContext';
import VisualizationStep from './VisualizationStep';
import { getTasksForBlock } from '../../data/experimentTasks';

interface TestBlockProps {
  blockId: string;
  layout: 'overlay' | 'small-multiples';
  onComplete?: () => void;
}

// Define TaskResponse type locally (should match what TaskPresenter expects)
interface TaskResponse {
  taskId: string;
  question: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  completionTime: number;
  metrics: {
    answerChanges: number;
    timeToFirstInteraction: number;
    pauseCount: number;
  };
  layout: string;
  timestamp: number;
}

/**
 * TestBlock Component - BETWEEN-SUBJECTS DESIGN
 *
 * This component represents the test block in the usability experiment.
 * Each participant completes ONE block with their assigned layout only.
 *
 * Flow:
 * 1. Display tasks with the specified layout (overlay or small-multiples)
 * 2. User completes all 6 tasks
 * 3. Proceed directly to UMUX questionnaire (no post-block satisfaction)
 * 4. Save all responses to context and Firebase
 */
const TestBlock: React.FC<TestBlockProps> = ({ blockId, layout, onComplete }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const { addTaskResponse, setChartDisplayMode } = useVisualization();

  // Get tasks for this block
  const tasks = getTasksForBlock(blockId);

  // Set the appropriate display mode based on layout
  React.useEffect(() => {
    if (layout === 'overlay') {
      setChartDisplayMode('single');
    } else {
      setChartDisplayMode('separate');
    }
  }, [layout, setChartDisplayMode]);

  const handleTaskComplete = (response: TaskResponse) => {
    // Save this task's response to both local state and context
    const updatedResponses = [...taskResponses, response];
    setTaskResponses(updatedResponses);

    // Save to context (persisted to localStorage)
    addTaskResponse(response);

    console.log('✅ Task completed:', response);

    // Move to next task or finish block
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // All tasks complete, proceed to UMUX questionnaire
      console.log('✅ All tasks in Block', blockId, 'completed. Total responses:', updatedResponses.length);
      console.log('📊 Proceeding to UMUX questionnaire');

      // Directly complete block - no post-block satisfaction questionnaire
      if (onComplete) {
        onComplete();
      }
    }
  };

  const currentTask = tasks[currentTaskIndex];

  return (
    <Box>
      {/* Block Header with Progress */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Block {blockId} - {layout === 'overlay' ? 'Overlay Layout' : 'Small Multiples Layout'}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete the tasks using the {layout === 'overlay' ? 'overlay (combined)' : 'small multiples (separate)'} visualization layout.
        </Typography>

        {/* Progress Indicator */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              Task {currentTaskIndex + 1} of {tasks.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(((currentTaskIndex + 1) / tasks.length) * 100)}% Complete
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentTaskIndex + 1) / tasks.length) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      {/* Grid Layout: Visualization on Top, Task on Bottom */}
      <Grid container spacing={3}>
        {/* Top: Visualization */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <VisualizationStep onBack={() => {}} onReset={() => {}} />
          </Paper>
        </Grid>

        {/* Bottom: Task Presenter */}
        <Grid item xs={12}>
          <TaskPresenter
            task={currentTask}
            layout={layout}
            onComplete={handleTaskComplete}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestBlock;
