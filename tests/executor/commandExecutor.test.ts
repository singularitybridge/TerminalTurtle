import { exec } from 'child_process';
import { executeCommand } from '../../src/executor/commandExecutor';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('executeCommand', () => {
  let mockExec: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockExec = exec as unknown as jest.Mock;
  });

  it('should execute a successful command and return output', async () => {
    const expectedStdout = 'test output\n';
    const expectedStderr = '';

    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: expectedStdout, stderr: expectedStderr });
      return {} as any;
    });

    const result = await executeCommand('echo "test output"', '/test/dir');

    expect(result).toEqual({
      stdout: expectedStdout,
      stderr: expectedStderr,
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
      }),
      expect.any(Function)
    );
  });

  it('should handle command failure and capture error output', async () => {
    const expectedError = {
      code: 1,
      stdout: '',
      stderr: 'command not found\n'
    };

    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(expectedError, { stdout: '', stderr: expectedError.stderr });
      return {} as any;
    });

    const result = await executeCommand('nonexistentcommand', '/test/dir');

    expect(result).toEqual({
      stdout: '',
      stderr: expectedError.stderr,
      exitCode: expectedError.code
    });
  });

  it('should strip ANSI codes from output', async () => {
    const ansiOutput = '\u001b[32mcolored text\u001b[0m\n';
    const expectedOutput = 'colored text\n';

    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: ansiOutput, stderr: '' });
      return {} as any;
    });

    const result = await executeCommand('ls --color=always', '/test/dir');

    expect(result.stdout).toBe(expectedOutput);
  });

  it('should handle large output within maxBuffer limit', async () => {
    const largeOutput = 'x'.repeat(1024 * 1024); // 1MB of data

    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: largeOutput, stderr: '' });
      return {} as any;
    });

    const result = await executeCommand('echo "large output"', '/test/dir');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(largeOutput);
  });

  it('should handle maxBuffer exceeded error', async () => {
    const maxBufferError = {
      code: 'ENOBUFS',
      stdout: '',
      stderr: 'MaxBufferError: stdout maxBuffer exceeded'
    };

    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(maxBufferError, { stdout: '', stderr: maxBufferError.stderr });
      return {} as any;
    });

    const result = await executeCommand('command-with-large-output', '/test/dir');

    expect(result.exitCode).toBe('ENOBUFS');
    expect(result.stderr).toContain('maxBuffer exceeded');
  });

  it('should handle commands with environment variables', async () => {
    mockExec.mockImplementation((cmd, opts, callback) => {
      // Verify that environment variables are passed correctly
      const env = (opts as any).env;
      expect(env).toHaveProperty('FORCE_COLOR', '1');
      expect(env).toHaveProperty('TERM', 'xterm-256color');
      callback(null, { stdout: 'success\n', stderr: '' });
      return {} as any;
    });

    const result = await executeCommand('echo $TERM', '/test/dir');
    expect(result.exitCode).toBe(0);
  });

  it('should handle stderr output without failing', async () => {
    mockExec.mockImplementation((cmd, opts, callback) => {
      callback(null, { stdout: 'success\n', stderr: 'warning: something happened\n' });
      return {} as any;
    });

    const result = await executeCommand('command-with-warning', '/test/dir');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('success\n');
    expect(result.stderr).toBe('warning: something happened\n');
  });
});
