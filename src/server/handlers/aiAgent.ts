import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';
import { createTask, updateTask, getTaskOutput, setTaskProcess, deleteTaskProcess } from '../../executor/taskManager';

const AIDER_TIMEOUT = 5 * 60 * 1000; // 5 minutes for AI operations

export const handleAIAgent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { prompt, agent = 'aider' } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  // Create a task for tracking
  const task = createTask(`AI Agent: ${prompt}`);
  logger.info(`Created AI agent task ${task.id} for prompt: ${prompt}`);

  try {
    updateTask(task.id, { status: 'running' });

    // Prepare the AI agent command
    let command: string;
    if (agent === 'aider') {
      // Escape the prompt for shell execution
      const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
      
      // Check if the prompt mentions specific files
      const filePattern = /\b(app\/\w+\.tsx?|src\/\w+\.tsx?|\w+\.tsx?)\b/g;
      const mentionedFiles = prompt.match(filePattern) || [];
      
      // Add files to the aider command if mentioned
      const filesArg = mentionedFiles.length > 0 ? mentionedFiles.join(' ') + ' ' : '';
      
      command = `aider --yes --no-auto-commits ${filesArg}--message '${escapedPrompt}'`;
      
      // Set OpenAI API key if available
      if (process.env.OPENAI_API_KEY) {
        command = `export OPENAI_API_KEY="${process.env.OPENAI_API_KEY}" && ${command}`;
      }
    } else {
      res.status(400).json({ error: 'Unsupported agent type' });
      return;
    }

    const { ptyProcess, resultPromise } = executeCommand(
      command,
      workingDirectory,
      (data: string) => {
        updateTask(task.id, { output: data });
      }
    );

    setTaskProcess(task.id, ptyProcess);

    // Set a timeout for AI operations
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI operation timed out')), AIDER_TIMEOUT);
    });

    const result = await Promise.race([resultPromise, timeoutPromise]);

    updateTask(task.id, {
      status: 'completed',
      exitCode: result.exitCode,
      output: result.output,
    });

    res.json({
      taskId: task.id,
      success: result.success,
      output: result.output,
      message: 'AI agent completed successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    updateTask(task.id, {
      status: 'failed',
      error: errorMessage,
    });

    logger.error('AI agent error', { error: errorMessage, taskId: task.id });
    
    res.status(500).json({ 
      taskId: task.id,
      error: errorMessage 
    });
  } finally {
    deleteTaskProcess(task.id);
  }
};
