import { executeCommand, stopExecution } from '../src/executor/commandExecutor';
import * as security from '../src/utils/security';
import { ExecException, ChildProcess } from 'child_process';

jest.mock('../src/utils/security');
jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

// Mock winston logger
jest.mock('../src/utils/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Command Executor', () => {
  const originalProcessExit = process.exit;
  let mockExec: jest.Mock;

  beforeAll(() => {
    // @ts-ignore
    process.exit = jest.fn();
    (security.isCommandWhitelisted as jest.Mock).mockReturnValue(true);
  });

  beforeEach(() => {
    mockExec = jest.fn();
    jest.mock('child_process', () => ({
      exec: mockExec,
    }));
  });

  afterAll(() => {
    process.exit = originalProcessExit;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCommand', () => {
    it('should execute a command and return the result', async () => {
      mockExec.mockImplementation((command: string, callback: (error: ExecException | null, stdout: string, stderr: string) => void) => {
        callback(null, 'Command executed successfully', '');
        return {} as ChildProcess;
      });

      const result = await executeCommand('test command');
      expect(result).toBe('Command executed successfully');
      expect(mockExec).toHaveBeenCalledWith('test command', expect.any(Function));
    });

    it('should throw an error if the command fails', async () => {
      mockExec.mockImplementation((command: string, callback: (error: ExecException | null, stdout: string, stderr: string) => void) => {
        callback(new Error('Command failed'), '', 'Error output');
        return {} as ChildProcess;
      });

      await expect(executeCommand('test command')).rejects.toThrow('Command failed');
    });

    it('should throw an error if the command is not whitelisted', async () => {
      (security.isCommandWhitelisted as jest.Mock).mockReturnValueOnce(false);

      await expect(executeCommand('non-whitelisted command')).rejects.toThrow('Command not allowed');
    });
  });

  describe('stopExecution', () => {
    it('should call process.exit', () => {
      stopExecution();

      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});