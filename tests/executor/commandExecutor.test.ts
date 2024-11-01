import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { executeCommand } from '../../src/executor/commandExecutor';

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('commandExecutor', () => {
  let mockChildProcess: any;
  let mockSpawn: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock process with EventEmitter
    mockChildProcess = {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      on: jest.fn(),
    };

    // Setup spawn mock
    mockSpawn = spawn as jest.Mock;
    mockSpawn.mockReturnValue(mockChildProcess);
  });

  describe('executeCommand', () => {
    const testCommand = 'test command';
    const testDir = '/test/dir';

    it('should execute command and return output', async () => {
      const expectedStdout = 'test output';
      const expectedStderr = 'test error';
      const expectedExitCode = 0;

      // Setup process completion handlers
      mockChildProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(expectedExitCode), 10);
        }
      });

      // Create promise for command execution
      const commandPromise = executeCommand(testCommand, testDir);

      // Emit some output
      mockChildProcess.stdout.emit('data', Buffer.from(expectedStdout));
      mockChildProcess.stderr.emit('data', Buffer.from(expectedStderr));

      const result = await commandPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        '/usr/bin/env',
        ['bash', '-c', testCommand],
        { cwd: testDir }
      );
      expect(result).toEqual({
        stdout: expectedStdout,
        stderr: expectedStderr,
        exitCode: expectedExitCode,
      });
    });

    it('should handle command execution errors', async () => {
      const testError = new Error('Command failed');

      mockChildProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(testError), 10);
        }
      });

      await expect(executeCommand(testCommand, testDir)).rejects.toThrow(testError);
    });

    it('should handle non-zero exit codes', async () => {
      const expectedExitCode = 1;
      const expectedStderr = 'command failed';

      mockChildProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(expectedExitCode), 10);
        }
      });

      const commandPromise = executeCommand(testCommand, testDir);
      mockChildProcess.stderr.emit('data', Buffer.from(expectedStderr));

      const result = await commandPromise;

      expect(result.exitCode).toBe(expectedExitCode);
      expect(result.stderr).toBe(expectedStderr);
    });
  });
});
