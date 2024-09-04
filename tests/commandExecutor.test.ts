import { executeCommand, stopExecution } from '../src/executor/commandExecutor';
import { exec } from 'child_process';

jest.mock('child_process');

describe('Command Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCommand', () => {
    it('should execute a command and return the result', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command, options, callback) => {
        callback?.(null, 'Command executed successfully', '');
        return {} as any;
      });

      const result = await executeCommand('test command');
      expect(result).toBe('Command executed successfully');
      expect(mockExec).toHaveBeenCalledWith('test command', expect.any(Object), expect.any(Function));
    });

    it('should throw an error if the command fails', async () => {
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command, options, callback) => {
        callback?.(new Error('Command failed'), '', 'Error output');
        return {} as any;
      });

      await expect(executeCommand('test command')).rejects.toThrow('Command failed');
    });
  });

  describe('stopExecution', () => {
    it('should stop the execution of the current command', () => {
      const mockKill = jest.fn();
      (global as any).currentChildProcess = { kill: mockKill };

      stopExecution();

      expect(mockKill).toHaveBeenCalledWith('SIGTERM');
      expect((global as any).currentChildProcess).toBeNull();
    });

    it('should not throw an error if there is no current process', () => {
      (global as any).currentChildProcess = null;

      expect(() => stopExecution()).not.toThrow();
    });
  });
});