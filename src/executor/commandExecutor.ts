import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { isCommandWhitelisted } from '../utils/security';
import { logger } from '../utils/logging';

const execAsync = promisify(exec);

/**
 * Execute a shell command.
 */
export const executeCommand = async (
  command: string,
  workingDirectory?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  if (!isCommandWhitelisted(command)) {
    logger.warn(`Attempt to execute non-whitelisted command: ${command}`);
    throw new Error('Command not allowed');
  }

  try {
    logger.info(
      `Executing command: ${command}${
        workingDirectory ? ` in directory ${workingDirectory}` : ''
      }`
    );
    const options: ExecOptions = {};
    if (workingDirectory) {
      options.cwd = workingDirectory;
    }

    const { stdout, stderr } = await execAsync(command, options);
    const exitCode = 0; // Success exit code

    if (stderr) {
      logger.warn(`Command execution warning: ${stderr}`);
    }
    return { stdout, stderr, exitCode };
  } catch (error: any) {
    logger.error(`Command execution failed: ${error.message || 'Unknown error'}`);
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const exitCode = error.code || -1;

    return { stdout, stderr, exitCode };
  }
};

/**
 * Stop the execution process.
 */
export const stopExecution = (): void => {
  logger.info('Stop execution requested');
  process.exit(0);
};
