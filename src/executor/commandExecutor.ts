import { spawn } from 'child_process';
import { logger } from '../utils/logging';

/**
 * Execute a shell command.
 */
export const executeCommand = async (
  command: string,
  workingDirectory: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  return new Promise((resolve, reject) => {
    logger.info(`Executing command: ${command} in directory ${workingDirectory}`);

    const args = ['-c', command];
    const bashPath = '/usr/bin/env';
    const childProcess = spawn(bashPath, ['bash', ...args], { cwd: workingDirectory });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logger.info(`stdout: ${output}`);
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logger.error(`stderr: ${output}`);
    });

    childProcess.on('close', (code) => {
      const exitCode = code === null ? -1 : code;
      resolve({ stdout, stderr, exitCode });
    });

    childProcess.on('error', (err) => {
      reject(err);
    });
  });
};
