import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Grid, LinearProgress } from '@mui/material';
import SatisfactionQuestionnaire from '../SatisfactionQuestionnaire';
import TaskPresenter from './TaskPresenter';
import { useVisualization } from '../../contexts/VisualizationContext';
import VisualizationStep from './VisualizationStep';
import { getTasksForBlock } from '../../data/experimentTasks';
import { ExperimentTask } from '../../data/experimentTasks';

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
 * TestBlock Component
 *
 * This component represents a single test block in the usability experiment.
 * It displays tasks with a specific visualization layout, followed by a
 * satisfaction questionnaire after the tasks are completed.
 *
 * Flow:
 * 1. Display tasks with the specified layout (overlay or small-multiples)
 * 2. User completes tasks
 * 3. Show satisfaction questionnaire
 * 4. Save responses to context
 * 5. Move to next block or complete experiment
 */
const TestBlock: React.FC<TestBlockProps> = ({ blockId, layout, onComplete }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const { addSatisfactionResponse, addTaskResponse, setChartDisplayMode } = useVisualization();

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
      // All tasks complete, show questionnaire
      console.log('✅ All tasks in Block', blockId, 'completed. Total responses:', updatedResponses.length);
      setShowQuestionnaire(true);
    }
  };

  const handleQuestionnaireSubmit = (responses: { ease: number; wouldUse: number }) => {
    // Save satisfaction response to context
    addSatisfactionResponse({
      blockId,
      layout,
      ease: responses.ease,
      wouldUse: responses.wouldUse,
    });

    console.log('✅ Satisfaction questionnaire submitted for Block', blockId);
    console.log('📊 Task responses for this block:', taskResponses);

    // Move to next block or complete experiment
    if (onComplete) {
      onComplete();
    }
  };

  const handleQuestionnaireSkip = () => {
    // Allow skipping for testing purposes
    if (onComplete) {
      onComplete();
    }
  };

  const currentTask = tasks[currentTaskIndex];

  return (
    <Box>
      {!showQuestionnaire ? (
        <>
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

          {/* Grid Layout: Visualization on Left, Task on Right */}
          <Grid container spacing={3}>
            {/* Left: Visualization */}
            <Grid item xs={12} md={7}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <VisualizationStep onBack={() => {}} onReset={() => {}} />
              </Paper>
            </Grid>

            {/* Right: Task Presenter */}
            <Grid item xs={12} md={5}>
              <TaskPresenter
                task={currentTask}
                layout={layout}
                onComplete={handleTaskComplete}
              />
            </Grid>
          </Grid>
        </>
      ) : (
        /* Show Satisfaction Questionnaire after tasks */
        <SatisfactionQuestionnaire
          blockId={blockId}
          layout={layout}
          onSubmit={handleQuestionnaireSubmit}
          onSkip={handleQuestionnaireSkip}
        />
      )}
    </Box>
  );
};

export default TestBlock;
