import * as fs from 'fs/promises';
import path from 'path';
import {
  listFiles,
  readFile,
  createFile,
  writeFile,
  updateFile,
  deleteFile,
  createDirectory,
  deleteDirectory,
  checkExistence,
} from '../src/executor/fileManager';

jest.mock('fs/promises');
jest.mock('path');
jest.mock('../src/utils/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('File Manager Functions', () => {
  const workingDirectory = '/test/dir';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ... (keep other test cases unchanged)

  describe('updateFile', () => {
    it('should update file content in overwrite mode', async () => {
      await updateFile(`${workingDirectory}/test-file.txt`, 'New content', 'overwrite');

      expect(fs.writeFile).toHaveBeenCalledWith(
        `${workingDirectory}/test-file.txt`,
        'New content',
        'utf-8'
      );
    });

    it('should update file content in append mode', async () => {
      await updateFile(`${workingDirectory}/test-file.txt`, 'Appended content', 'append');

      expect(fs.appendFile).toHaveBeenCalledWith(
        `${workingDirectory}/test-file.txt`,
        'Appended content',
        'utf-8'
      );
    });

    it('should throw an error for invalid mode', async () => {
      await expect(updateFile(`${workingDirectory}/test-file.txt`, 'Content', 'invalid' as any))
        .rejects.toThrow('Invalid mode for updateFile. Use "overwrite" or "append".');
    });

    it('should handle errors when updating a file in overwrite mode', async () => {
      const error = new Error('Write error');
      (fs.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(updateFile(`${workingDirectory}/test-file.txt`, 'New content', 'overwrite'))
        .rejects.toThrow('Write error');
    });

    it('should handle errors when updating a file in append mode', async () => {
      const error = new Error('Append error');
      (fs.appendFile as jest.Mock).mockRejectedValue(error);

      await expect(updateFile(`${workingDirectory}/test-file.txt`, 'Appended content', 'append'))
        .rejects.toThrow('Append error');
    });
  });

  // ... (keep other test cases unchanged)
});