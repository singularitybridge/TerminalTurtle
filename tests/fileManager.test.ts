import { FileManager } from '../src/executor/fileManager';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('FileManager', () => {
  const workingDirectory = '/test/working/directory';
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager(workingDirectory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listFiles', () => {
    it('should list files in a directory', async () => {
      const mockFiles = ['file1', 'file2'];
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);
      (path.join as jest.Mock).mockReturnValue('/test/working/directory/test-path');

      const result = await fileManager.listFiles('test-path');

      expect(result).toEqual(mockFiles);
      expect(fs.readdir).toHaveBeenCalledWith('/test/working/directory/test-path', { withFileTypes: true });
    });
  });

  describe('readFile', () => {
    it('should read the contents of a file', async () => {
      const mockContent = 'File content';
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from(mockContent));
      (path.join as jest.Mock).mockReturnValue('/test/working/directory/test-file.txt');

      const result = await fileManager.readFile('test-file.txt');

      expect(result).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith('/test/working/directory/test-file.txt', 'utf-8');
    });
  });

  describe('writeFile', () => {
    it('should write content to a file', async () => {
      (path.join as jest.Mock).mockReturnValue('/test/working/directory/test-file.txt');

      await fileManager.writeFile('test-file.txt', 'New content');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/working/directory/test-file.txt', 'New content');
    });
  });

  describe('createDirectory', () => {
    it('should create a new directory', async () => {
      (path.join as jest.Mock).mockReturnValue('/test/working/directory/new-dir');

      await fileManager.createDirectory('new-dir');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/working/directory/new-dir', { recursive: true });
    });
  });
});