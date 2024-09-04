import request from 'supertest';
import { createApiServer } from '../src/server/apiServer';
import { executeCommand } from '../src/executor/commandExecutor';
import * as fileOperations from '../src/executor/fileManager';

jest.mock('../src/executor/commandExecutor');
jest.mock('../src/executor/fileManager');

describe('API Server', () => {
  const app = createApiServer('/test/working/directory');

  describe('POST /execute', () => {
    it('should execute a command and return the result', async () => {
      const mockResult = 'Command executed successfully';
      (executeCommand as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/execute')
        .send({ command: 'test command' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: mockResult });
      expect(executeCommand).toHaveBeenCalledWith('test command');
    });

    it('should handle errors during command execution', async () => {
      const mockError = new Error('Command execution failed');
      (executeCommand as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/execute')
        .send({ command: 'test command' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Command execution failed' });
    });
  });

  describe('POST /file-operation', () => {
    it('should perform file operations and return the result', async () => {
      const mockResult = ['file1', 'file2'];
      (fileOperations.listFiles as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/file-operation')
        .send({ operation: 'list', path: 'test/path' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: mockResult });
      expect(fileOperations.listFiles).toHaveBeenCalledWith('/test/working/directory/test/path', undefined);
    });

    it('should handle errors during file operations', async () => {
      const mockError = new Error('File operation failed');
      (fileOperations.listFiles as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/file-operation')
        .send({ operation: 'list', path: 'test/path' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'File operation failed' });
    });
  });

  describe('POST /stop-execution', () => {
    it('should stop execution and return a success message', async () => {
      const response = await request(app).post('/stop-execution');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Execution stopped' });
    });
  });
});