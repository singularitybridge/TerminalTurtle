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

    if (runInBackground) {
      const pid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const processInfo: ProcessInfo = {
        process: childProcess,
        stdout,
        stderr,
      };

      childProcess.on('close', (code) => {
        logger.info(`Background process ${pid} exited with code ${code}`);
        processes.delete(pid);
      });

      processes.set(pid, processInfo);

      return { pid };
    } else {
      return await new Promise((resolve) => {
        childProcess.on('close', (code) => {
          const exitCode = code === null ? -1 : code;
          resolve({ stdout, stderr, exitCode });
        });
      });
    }
  } catch (error: any) {
    logger.error(`Command execution failed: ${error.message || 'Unknown error'}`);
    return { stdout: '', stderr: '', exitCode: -1 };
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
  }
  return undefined;
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
  }
  logger.warn(`Process ${pid} not found`);
  return false;
};

/**
 * Stop all running processes.
 */
export const stopAllProcesses = (): void => {
  processes.forEach((processInfo, pid) => {
    processInfo.process.kill();
    logger.info(`Process ${pid} has been stopped`);
  });
  processes.clear();
};

// For testing purposes
export const _getProcesses = () => processes;
export const _setProcesses = (newProcesses: Map<string, ProcessInfo>) => {
  processes.clear();
  newProcesses.forEach((value, key) => processes.set(key, value));
};
