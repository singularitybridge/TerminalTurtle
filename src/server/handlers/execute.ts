import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { logger } from '../../utils/logging';
import { AuthenticatedRequest } from '../middleware/auth';
import { createTask, updateTask } from '../../executor/taskManager';

export const handleExecute = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { command } = req.body;

  // Create a new task
  const task = createTask(command);
  logger.info(`Created task ${task.id} for command: ${command}`);

  // Respond immediately with the task ID
  res.status(202).json({ taskId: task.id });

  // Start command execution in the background
  (async () => {
    try {
      updateTask(task.id, { status: 'running' });

      const result = await executeCommand(
        command,
        req.app.locals.currentWorkingDirectory,
        (data: string) => {
          // Update task with new output
          updateTask(task.id, { output: data });
        }
      );

      updateTask(task.id, {
        status: 'completed',
        exitCode: result.exitCode,
        output: result.output, // This will append the final output
      });

      logger.info(`Task ${task.id} completed with exit code ${result.exitCode}`);
    } catch (error) {
      const err = error as Error;
      updateTask(task.id, {
        status: 'failed',
        error: err.message,
      });

      logger.error(`Task ${task.id} failed: ${err.message}`);
    }
  })();
};
