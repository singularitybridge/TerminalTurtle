import { exec, ChildProcess } from 'child_process';
import { executeCommand } from '../../src/executor/commandExecutor';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('executeCommand', () => {
  let mockExec: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExec = exec as unknown as jest.Mock;
  });

  const createMockChildProcess = () => {
    const childProcess = new EventEmitter() as ChildProcess;
    
    // Create proper readable streams for stdout and stderr
    const stdout = new Readable({ read: () => {} });
    const stderr = new Readable({ read: () => {} });
    
    // Attach streams to child process
    Object.defineProperty(childProcess, 'stdout', {
      value: stdout,
      writable: true
    });
    Object.defineProperty(childProcess, 'stderr', {
      value: stderr,
      writable: true
    });
    
    // Add kill method
    childProcess.kill = jest.fn();
    
    return childProcess;
  };

  it('should execute a successful command and return output', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const execPromise = executeCommand('echo "test output"', '/test/dir');

    // Push data to stdout and end the process
    mockChildProcess.stdout?.push('test output\n');
    mockChildProcess.stdout?.push(null);
    mockChildProcess.emit('close', 0);

    const result = await execPromise;

    expect(result).toEqual({
      stdout: 'test output\n',
      stderr: '',
      exitCode: 0
    });

    expect(mockExec).toHaveBeenCalledWith(
      'echo "test output"',
      expect.objectContaining({
        cwd: '/test/dir',
        env: expect.objectContaining({
          FORCE_COLOR: '1',
          TERM: 'xterm-256color'
        }),
        shell: '/bin/bash',
        maxBuffer: 1024 * 1024 * 10
      })
    );
  });

  it('should handle command failure and capture error output', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const execPromise = executeCommand('nonexistentcommand', '/test/dir');

    // Push error data to stderr and end the process
    mockChildProcess.stderr?.push('command not found\n');
    mockChildProcess.stderr?.push(null);
    mockChildProcess.emit('close', 1);

    const result = await execPromise;

    expect(result).toEqual({
      stdout: '',
      stderr: 'command not found\n',
      exitCode: -1
    });
  });

  it('should handle command timeout and terminate process', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const execPromise = executeCommand('npm run dev', '/test/dir');

    // Wait for timeout
    const result = await execPromise;

    expect(result).toEqual({
      stdout: '',
      stderr: expect.stringContaining('Command terminated: Command timed out after'),
      exitCode: 124,
      timedOut: true
    });

    expect(mockChildProcess.kill).toHaveBeenCalled();
  });

  it('should strip ANSI codes from output', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const execPromise = executeCommand('ls --color=always', '/test/dir');

    // Push colored output to stdout and end the process
    mockChildProcess.stdout?.push('\u001b[32mcolored text\u001b[0m\n');
    mockChildProcess.stdout?.push(null);
    mockChildProcess.emit('close', 0);

    const result = await execPromise;

    expect(result.stdout).toBe('colored text\n');
  });

  it('should handle large output within maxBuffer limit', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const largeOutput = 'x'.repeat(1024 * 1024); // 1MB of data
    const execPromise = executeCommand('echo "large output"', '/test/dir');

    mockChildProcess.stdout?.push(largeOutput);
    mockChildProcess.stdout?.push(null);
    mockChildProcess.emit('close', 0);

    const result = await execPromise;

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(largeOutput);
  });

  it('should handle stderr output without failing', async () => {
    const mockChildProcess = createMockChildProcess();
    mockExec.mockReturnValue(mockChildProcess);

    const execPromise = executeCommand('command-with-warning', '/test/dir');

    mockChildProcess.stdout?.push('success\n');
    mockChildProcess.stderr?.push('warning: something happened\n');
    mockChildProcess.stdout?.push(null);
    mockChildProcess.stderr?.push(null);
    mockChildProcess.emit('close', 0);

    const result = await execPromise;

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('success\n');
    expect(result.stderr).toBe('warning: something happened\n');
  });
});
