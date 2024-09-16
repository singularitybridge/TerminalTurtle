import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { logger } from '../utils/logging';

interface ProcessInfo {
  process: ChildProcessWithoutNullStreams;
  stdout: string;
  stderr: string;
}

const processes: Map<string, ProcessInfo> = new Map();

/**
 * Execute a shell command.
 * If runInBackground is true, the command is executed in the background.
 * Returns a process ID for background processes.
 */
export const executeCommand = async (
  command: string,
  workingDirectory: string,
  runInBackground: boolean = false
): Promise<{ stdout?: string; stderr?: string; exitCode?: number; pid?: string }> => {
  try {
    logger.info(`Executing command: ${command} in directory ${workingDirectory}`);

    if (runInBackground) {
      const args = ['-c', command];
      const childProcess = spawn('bash', args, { cwd: workingDirectory });

      const pid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const processInfo: ProcessInfo = {
        process: childProcess,
        stdout: '',
        stderr: '',
      };

      childProcess.stdout.on('data', (data) => {
        processInfo.stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        processInfo.stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        logger.info(`Background process ${pid} exited with code ${code}`);
        processes.delete(pid);
      });

      processes.set(pid, processInfo);

      return { pid };
    } else {
      // For foreground processes, we execute and wait for completion
      const args = ['-c', command];
      const childProcess = spawn('bash', args, { cwd: workingDirectory });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      return await new Promise((resolve, reject) => {
        childProcess.on('close', (code) => {
          const exitCode = code === null ? -1 : code;
          resolve({ stdout, stderr, exitCode });
        });

        childProcess.on('error', (err) => {
          reject({ stdout, stderr, exitCode: -1, error: err });
        });
      });
    }
  } catch (error: any) {
    logger.error(`Command execution failed: ${error.message || 'Unknown error'}`);
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const exitCode = error.exitCode || -1;

    return { stdout, stderr, exitCode };
  }
};

/**
 * Get the status of a background process.
 */
export const getProcessStatus = (
  pid: string
): { stdout: string; stderr: string; running: boolean } | undefined => {
  const processInfo = processes.get(pid);
  if (processInfo) {
    const { process, stdout, stderr } = processInfo;
    const running = process.exitCode === null && !process.killed;
    return { stdout, stderr, running };
  } else {
    return undefined;
  }
};

/**
 * Stop a background process by PID.
 */
export const stopProcess = (pid: string): boolean => {
  const processInfo = processes.get(pid);
  if (processInfo) {
    processInfo.process.kill();
    processes.delete(pid);
    logger.info(`Process ${pid} has been stopped`);
    return true;
  } else {
    logger.warn(`Process ${pid} not found`);
    return false;
  }
};

/**
 * Stop all running processes.
 */
export const stopAllProcesses = (): void => {
  processes.forEach((processInfo, pid) => {
    processInfo.process.kill();
    logger.info(`Process ${pid} has been stopped`);
    processes.delete(pid);
  });
};
