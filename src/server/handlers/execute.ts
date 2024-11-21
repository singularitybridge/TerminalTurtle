import { Response } from 'express';
import path from 'path';
import { executeCommand } from '../../executor/commandExecutor';
import { checkExistence } from '../../executor/fileManager';
import { logger } from '../../utils/logging';
import { AuthenticatedRequest } from '../middleware/auth';

interface CommandResponse {
  success: boolean;
  exitCode?: number;
  result: string;
}

const handleChangeDirectory = async (command: string, currentWorkingDirectory: string): Promise<CommandResponse> => {
  const newDir = command.slice(3).trim();
  const newPath = path.resolve(currentWorkingDirectory, newDir);
  
  try {
    const exists = await checkExistence(newPath);
    if (exists) {
      return {
        success: true,
        result: `Changed directory to: ${newPath}`,
      };
    } else {
      return {
        success: false,
        result: `Directory not found: ${newPath}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      result: `Error changing directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

const logFormattedResult = (result: string): void => {
  const separator = '-'.repeat(50);
  const formattedResult = `
${separator}
${result}
${separator}
`.trim();

  logger.info(`Response:\n${formattedResult}`);
};

export const handleExecute = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  logger.info(`Received execute request:\n> ${req.body.command}`);

  try {
    let { command } = req.body;
    let response: CommandResponse;

    if (command.startsWith('cd ')) {
      response = await handleChangeDirectory(command, req.app.locals.currentWorkingDirectory);
      req.app.locals.currentWorkingDirectory = response.result.split(': ')[1];
    } else {
      if (command === 'npm run build') {
        command = 'npm run build -- --pretty';
      }
      const result = await executeCommand(command, req.app.locals.currentWorkingDirectory);
      response = {
        success: true,
        exitCode: result.exitCode,
        result: result.stdout + result.stderr || 'Command executed successfully',
      };
    }

    logFormattedResult(response.result);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    const err = error as any;
    const response: CommandResponse = {
      success: false,
      exitCode: err.exitCode || -1,
      result: err.stdout + err.stderr || 'An error occurred.',
    };
    logFormattedResult(response.result);
    res.status(500).json(response);
  }
};
