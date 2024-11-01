import { exec } from 'child_process';
import { promisify } from 'util';

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
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDirectory,
      env: { ...process.env },
      shell: '/bin/bash', // Use bash shell for Linux
      maxBuffer: 1024 * 1024 * 10, // Increase buffer size if needed
    });
    // Command executed successfully
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const err = error as any; // Type assertion for error object
    // Command failed; capture stdout, stderr, and exit code
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.code || -1,
    };
  }
};
