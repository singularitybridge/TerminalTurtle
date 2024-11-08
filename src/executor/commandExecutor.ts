import { exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import stripAnsi from 'strip-ansi';

// Default timeout in milliseconds (15 seconds)
const DEFAULT_TIMEOUT = 15000;

const createTimeout = (childProcess: ChildProcess): Promise<never> =>
  new Promise((_, reject) => 
    setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Command timed out after ${DEFAULT_TIMEOUT}ms`));
    }, DEFAULT_TIMEOUT));

/**
 * Execute a shell command in a given working directory and return the output.
 */
export const executeCommand = async (
  command: string,
  workingDirectory: string
): Promise<{ 
  success: boolean;
  stdout: string; 
  stderr: string; 
  exitCode: number;
  timedOut?: boolean;
}> => {
  try {
    // Create child process
    const childProcess = exec(command, {
      cwd: workingDirectory,
      env: { ...process.env, FORCE_COLOR: '1', TERM: 'xterm-256color' },
      shell: '/bin/bash',
      maxBuffer: 1024 * 1024 * 10,
    });

    // Create promise that resolves with command output
    const execPromise = new Promise<{stdout: string, stderr: string, exitCode: number}>((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data;
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data;
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Command failed: ${error.message}`));
      });

      childProcess.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? -1 });
      });
    });

    // Race between command execution and timeout
    const { stdout, stderr, exitCode } = await Promise.race([
      execPromise,
      createTimeout(childProcess)
    ]);

    // Strip ANSI escape codes from stdout and stderr
    const cleanStdout = stripAnsi(stdout);
    const cleanStderr = stripAnsi(stderr);

    return { 
      success: exitCode === 0,
      stdout: cleanStdout, 
      stderr: cleanStderr, 
      exitCode 
    };
  } catch (error) {
    const err = error as any;

    // Handle timeout error specifically
    if (err.message && err.message.includes('Command timed out')) {
      return {
        success: false,
        stdout: '',
        stderr: `Command terminated: ${err.message}`,
        exitCode: 124, // Standard timeout exit code
        timedOut: true
      };
    }

    // Handle other errors
    const stdout = stripAnsi(err.stdout || '');
    const stderr = stripAnsi(err.stderr || err.message || 'Unknown error occurred');

    return {
      success: false,
      stdout,
      stderr,
      exitCode: err.code || -1,
    };
  }
};
