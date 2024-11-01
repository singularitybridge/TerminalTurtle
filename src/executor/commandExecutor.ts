import { exec } from 'child_process';
import { promisify } from 'util';
import stripAnsi from 'strip-ansi';


/**
 * Execute a shell command in a given working directory and return the output.
 */
export const executeCommand = async (
  command: string,
  workingDirectory: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  // Promisify the exec function for easier async/await usage
  const execAsync = promisify(exec);

  try {
    let { stdout, stderr } = await execAsync(command, {
      cwd: workingDirectory,
      env: { ...process.env, FORCE_COLOR: '1', TERM: 'xterm-256color' },
      shell: '/bin/bash',
      maxBuffer: 1024 * 1024 * 10,
    });

    // Strip ANSI escape codes from stdout and stderr
    stdout = stripAnsi(stdout);
    stderr = stripAnsi(stderr);

    // Command executed successfully
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const err = error as any; // Type assertion for error object

    // Strip ANSI escape codes from error outputs
    const stdout = stripAnsi(err.stdout || '');
    const stderr = stripAnsi(err.stderr || '');

    // Command failed; capture stdout, stderr, and exit code
    return {
      stdout,
      stderr,
      exitCode: err.code || -1,
    };
  }
};
