import { executeCommand, stopProcess, getProcessStatus, stopAllProcesses, _getProcesses, _setProcesses } from '../src/executor/commandExecutor';
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

    // Clear the processes map before each test
    _setProcesses(new Map());
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

      const result = await executeCommand(command, workingDirectory);

      expect(result).toEqual({
        stdout: '',
        stderr: '',
        exitCode: -1,
      });
    });
  });

  describe('getProcessStatus', () => {
    it('should return the status of a running process', () => {
      const pid = '12345';
      const mockProcess = { exitCode: null, killed: false } as childProcess.ChildProcessWithoutNullStreams;
      _setProcesses(new Map([[pid, { process: mockProcess, stdout: 'Some output', stderr: 'Some error' }]]));

      const status = getProcessStatus(pid);

      expect(status).toEqual({
        stdout: 'Some output',
        stderr: 'Some error',
        running: true,
      });
    });

    it('should return undefined for a non-existent process', () => {
      const status = getProcessStatus('non-existent-pid');

      expect(status).toBeUndefined();
    });
  });

  describe('stopProcess', () => {
    it('should stop a running process', () => {
      const pid = '12345';
      const mockProcess = { kill: jest.fn() } as unknown as childProcess.ChildProcessWithoutNullStreams;
      _setProcesses(new Map([[pid, { process: mockProcess, stdout: '', stderr: '' }]]));

      const result = stopProcess(pid);

      expect(result).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
      expect(_getProcesses().size).toBe(0);
    });

    it('should return false for a non-existent process', () => {
      const result = stopProcess('non-existent-pid');

      expect(result).toBe(false);
    });
  });

  describe('stopAllProcesses', () => {
    it('should stop all running processes', () => {
      const mockProcess1 = { kill: jest.fn() } as unknown as childProcess.ChildProcessWithoutNullStreams;
      const mockProcess2 = { kill: jest.fn() } as unknown as childProcess.ChildProcessWithoutNullStreams;
      _setProcesses(new Map([
        ['pid1', { process: mockProcess1, stdout: '', stderr: '' }],
        ['pid2', { process: mockProcess2, stdout: '', stderr: '' }]
      ]));

      stopAllProcesses();

      expect(mockProcess1.kill).toHaveBeenCalled();
      expect(mockProcess2.kill).toHaveBeenCalled();
      expect(_getProcesses().size).toBe(0);
    });
  });
});