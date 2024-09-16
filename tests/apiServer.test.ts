import request from 'supertest';
import { createApiServer } from '../src/server/apiServer';
import * as commandExecutor from '../src/executor/commandExecutor';
import * as fileOperations from '../src/executor/fileManager';

jest.mock('../src/executor/commandExecutor');
jest.mock('../src/executor/fileManager');
jest.mock('../src/utils/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('API Server', () => {
  const app = createApiServer('/test/working/directory');

  // ... (keep all other test cases unchanged)

  describe('POST /stop-execution', () => {
    it('should stop all processes and return a success message', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit() was called'); });

      try {
        await request(app).post('/stop-execution');
      } catch (error) {
        expect((error as Error).message).toBe('process.exit() was called');
      }

      expect(commandExecutor.stopAllProcesses).toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });
});