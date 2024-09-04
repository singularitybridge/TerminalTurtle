import { exec } from 'child_process';
import { promisify } from 'util';
import { isCommandWhitelisted } from '../utils/security';
import { logger } from '../utils/logging';

const execAsync = promisify(exec);

export const executeCommand = async (command: string): Promise<string> => {
  if (!isCommandWhitelisted(command)) {
    logger.warn(`Attempt to execute non-whitelisted command: ${command}`);
    throw new Error('Command not allowed');
  }

  try {
    logger.info(`Executing command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      logger.error(`Command execution error: ${stderr}`);
    }
    return stdout;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Command execution failed: ${error.message}`);
    } else {
      logger.error(`Command execution failed with unknown error`);
    }
    throw error;
  }
};

export const stopExecution = (): void => {
  logger.info('Stop execution requested');
  process.exit(0);
};