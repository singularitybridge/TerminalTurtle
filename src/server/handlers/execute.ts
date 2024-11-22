import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { logger } from '../../utils/logging';
import { AuthenticatedRequest } from '../middleware/auth';
import { createTask, updateTask, getTaskOutput } from '../../executor/taskManager';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';

const INITIAL_RESPONSE_TIMEOUT = 10000; // 10 seconds

export const handleExecute = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { command } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  // Get the client-specific working directory
  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  // Create a new task
  const task = createTask(command);
  logger.info(`Created task ${task.id} for command: ${command}`);

  let commandCompleted = false;
  let initialOutputSent = false;

  const executionPromise = executeCommand(
    command,
    workingDirectory,
    (data: string) => {
      updateTask(task.id, { output: data });
    }
  );

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!commandCompleted && !initialOutputSent) {
        initialOutputSent = true;
        const initialOutput = getTaskOutput(task.id);
        res.json({ taskId: task.id, initialOutput });
      }
      resolve();
    }, INITIAL_RESPONSE_TIMEOUT);
  });

  try {
    const result = await Promise.race([executionPromise, timeoutPromise]);

    if (result) {
      // Command completed before timeout
      commandCompleted = true;
      updateTask(task.id, {
        status: 'completed',
        exitCode: result.exitCode,
        output: result.output,
      });

      if (!initialOutputSent) {
        // Command completed within 10 seconds, send final response
        res.json({
          output: result.output,
          exitCode: result.exitCode,
          completed: true,
        });
      }

      logger.info(`Task ${task.id} completed with exit code ${result.exitCode}`);
    } else if (!initialOutputSent) {
      // Timeout occurred, but response wasn't sent (rare case)
      const initialOutput = getTaskOutput(task.id);
      res.json({ taskId: task.id, initialOutput });
    }

    // If initial output was sent, continue execution in the background
    if (initialOutputSent && !commandCompleted) {
      executionPromise.then((result) => {
        updateTask(task.id, {
          status: 'completed',
          exitCode: result.exitCode,
          output: result.output,
        });
        logger.info(`Task ${task.id} completed with exit code ${result.exitCode}`);
      }).catch((error) => {
        const err = error as Error;
        updateTask(task.id, {
          status: 'failed',
          error: err.message,
        });
        logger.error(`Task ${task.id} failed: ${err.message}`);
      });
    }
  } catch (error) {
    const err = error as Error;
    updateTask(task.id, {
      status: 'failed',
      error: err.message,
    });

    if (!initialOutputSent) {
      res.status(500).json({ error: err.message });
    }

    logger.error(`Task ${task.id} failed: ${err.message}`);
  }
};
