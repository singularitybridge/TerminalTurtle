import { listFiles, readFile, writeFile, createDirectory } from '../src/executor/fileManager';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('File Manager Functions', () => {
  const workingDirectory = '/test/working/directory';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listFiles', () => {
    it('should list files in a directory', async () => {
      const mockFiles = ['file1', 'file2'];
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

      const result = await listFiles(`${workingDirectory}/test-path`);

      expect(result).toEqual(mockFiles.map(file => `${workingDirectory}/test-path/${file}`));
      expect(fs.readdir).toHaveBeenCalledWith(`${workingDirectory}/test-path`);
    });
  });

  describe('readFile', () => {
    it('should read the contents of a file', async () => {
      const mockContent = 'File content';
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await readFile(`${workingDirectory}/test-file.txt`);

      expect(result).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith(`${workingDirectory}/test-file.txt`, 'utf-8');
    });
  });

  describe('writeFile', () => {
    it('should write content to a file', async () => {
      await writeFile(`${workingDirectory}/test-file.txt`, 'New content');

      expect(fs.writeFile).toHaveBeenCalledWith(`${workingDirectory}/test-file.txt`, 'New content', 'utf-8');
    });
  });

  describe('createDirectory', () => {
    it('should create a new directory', async () => {
      await createDirectory(`${workingDirectory}/new-dir`);

      expect(fs.mkdir).toHaveBeenCalledWith(`${workingDirectory}/new-dir`, { recursive: true });
    });
  });
});