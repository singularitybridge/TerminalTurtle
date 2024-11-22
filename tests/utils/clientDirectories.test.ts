import {
  setClientWorkingDirectory,
  getClientWorkingDirectory,
  resetClientWorkingDirectory,
  cleanupInactiveClientDirectories
} from '../../src/utils/clientDirectories';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('../../src/utils/logging');

describe('clientDirectories', () => {
  const baseWorkingDirectory = '/base/working/directory';
  const clientId = 'test-client-id';
  const newPath = '/base/working/directory/test-path';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setClientWorkingDirectory should set the working directory for a client', () => {
    setClientWorkingDirectory(clientId, newPath);
    expect(getClientWorkingDirectory(clientId, baseWorkingDirectory)).toBe(newPath);
  });

  test('getClientWorkingDirectory should return base directory if client directory is not set', () => {
    expect(getClientWorkingDirectory('non-existent-client', baseWorkingDirectory)).toBe(baseWorkingDirectory);
  });

  test('resetClientWorkingDirectory should remove the client\'s working directory', () => {
    setClientWorkingDirectory(clientId, newPath);
    resetClientWorkingDirectory(clientId);
    expect(getClientWorkingDirectory(clientId, baseWorkingDirectory)).toBe(baseWorkingDirectory);
  });

  test('cleanupInactiveClientDirectories should remove inactive directories', async () => {
    const mockStat = jest.fn().mockResolvedValue({ atimeMs: Date.now() - 2 * 86400000 }); // 2 days old
    (fs.stat as jest.Mock).mockImplementation(mockStat);

    setClientWorkingDirectory(clientId, newPath);
    await cleanupInactiveClientDirectories(86400000); // 1 day threshold

    expect(getClientWorkingDirectory(clientId, baseWorkingDirectory)).toBe(baseWorkingDirectory);
  });

  test('cleanupInactiveClientDirectories should not remove active directories', async () => {
    const mockStat = jest.fn().mockResolvedValue({ atimeMs: Date.now() - 12 * 3600000 }); // 12 hours old
    (fs.stat as jest.Mock).mockImplementation(mockStat);

    setClientWorkingDirectory(clientId, newPath);
    await cleanupInactiveClientDirectories(86400000); // 1 day threshold

    expect(getClientWorkingDirectory(clientId, baseWorkingDirectory)).toBe(newPath);
  });
});
