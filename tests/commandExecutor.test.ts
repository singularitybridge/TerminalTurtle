import { executeCommand, stopProcess, getProcessStatus, stopAllProcesses } from '../src/executor/commandExecutor';
import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import { Writable, Readable } from 'stream';

jest.mock('child_process');
jest.mock('../src/utils/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Custom type for mocking ChildProcess
interface MockChildProcess extends EventEmitter {
  stdout: Readable;
  stderr: Readable;
  stdin: Writable;
  stdio: [Writable, Readable, Readable, Readable | Writable | null, Readable | Writable | null];
  killed: boolean;
  pid: number;
  connected: boolean;
  exitCode: number | null;
  signalCode: string | null;
  spawnargs: string[];
  spawnfile: string;
  kill: jest.Mock;
  send: jest.Mock;
  disconnect: jest.Mock;
  unref: jest.Mock;
  ref: jest.Mock;
  [Symbol.dispose]: () => void;
}

describe('Command Executor', () => {
  let mockSpawn: jest.SpyInstance;
  let mockChildProcess: MockChildProcess;

  beforeEach(() => {
    mockChildProcess = new EventEmitter() as MockChildProcess;
    mockChildProcess.stdout = new Readable({ read() {} });
    mockChildProcess.stderr = new Readable({ read() {} });
    mockChildProcess.stdin = new Writable({ write() {} });
    mockChildProcess.stdio = [
      mockChildProcess.stdin,
      mockChildProcess.stdout,
      mockChildProcess.stderr,
      null,
      null
    ];
    mockChildProcess.killed = false;
    mockChildProcess.pid = 123;
    mockChildProcess.connected = true;
    mockChildProcess.exitCode = null;
    mockChildProcess.signalCode = null;
    mockChildProcess.spawnargs = [];
    mockChildProcess.spawnfile = '';
    mockChildProcess.kill = jest.fn();
    mockChildProcess.send = jest.fn();
    mockChildProcess.disconnect = jest.fn();
    mockChildProcess.unref = jest.fn();
    mockChildProcess.ref = jest.fn();
    mockChildProcess[Symbol.dispose] = jest.fn();

    mockSpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockChildProcess as childProcess.ChildProcessWithoutNullStreams);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCommand', () => {
    it('should execute a command in the foreground and return the result', async () => {
      const command = 'echo "Hello, World!"';
      const workingDirectory = '/test/dir';

      const resultPromise = executeCommand(command, workingDirectory);

      // Simulate stdout data
      mockChildProcess.stdout.emit('data', 'Hello, World!');
      
      // Simulate process completion
      mockChildProcess.emit('close', 0);

      const result = await resultPromise;

      expect(mockSpawn).toHaveBeenCalledWith('bash', ['-c', command], { cwd: workingDirectory });
      expect(result).toEqual({
        stdout: 'Hello, World!',
        stderr: '',
        exitCode: 0,
      });
    });

    it('should execute a command in the background and return a process ID', async () => {
      const command = 'long-running-process';
      const workingDirectory = '/test/dir';

      const result = await executeCommand(command, workingDirectory, true);

      expect(mockSpawn).toHaveBeenCalledWith('bash', ['-c', command], { cwd: workingDirectory });
      expect(result).toHaveProperty('pid');
    });

    it('should handle command execution errors', async () => {
      const command = 'invalid-command';
      const workingDirectory = '/test/dir';

      mockSpawn.mockImplementation(() => {
        throw new Error('Command execution failed');
      });

      await expect(executeCommand(command, workingDirectory)).rejects.toThrow('Command execution failed');
    });
  });

  describe('getProcessStatus', () => {
    it('should return the status of a running process', async () => {
      const command = 'long-running-process';
      const workingDirectory = '/test/dir';

      const { pid } = await executeCommand(command, workingDirectory, true);
      
      if (!pid) {
        throw new Error('Failed to start background process');
      }

      const status = getProcessStatus(pid);

      expect(status).toEqual({
        stdout: '',
        stderr: '',
        running: true,
      });
    });

    it('should return undefined for a non-existent process', () => {
      const status = getProcessStatus('non-existent-pid');

      expect(status).toBeUndefined();
    });
  });

  describe('stopProcess', () => {
    it('should stop a running process', async () => {
      const command = 'long-running-process';
      const workingDirectory = '/test/dir';

      const { pid } = await executeCommand(command, workingDirectory, true);
      
      if (!pid) {
        throw new Error('Failed to start background process');
      }

      const result = stopProcess(pid);

      expect(result).toBe(true);
      expect(mockChildProcess.kill).toHaveBeenCalled();
    });

    it('should return false for a non-existent process', () => {
      const result = stopProcess('non-existent-pid');

      expect(result).toBe(false);
    });
  });

  describe('stopAllProcesses', () => {
    it('should stop all running processes', async () => {
      const command1 = 'long-running-process-1';
      const command2 = 'long-running-process-2';
      const workingDirectory = '/test/dir';

      await executeCommand(command1, workingDirectory, true);
      await executeCommand(command2, workingDirectory, true);

      stopAllProcesses();

      expect(mockChildProcess.kill).toHaveBeenCalledTimes(2);
    });
  });
});