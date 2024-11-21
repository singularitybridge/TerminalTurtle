import { Response } from 'express';
import path from 'path';
import {
  listFiles,
  readFile,
  writeFile,
  createFile,
  updateFile,
  deleteFile,
  createDirectory,
  deleteDirectory,
  checkExistence,
} from '../../executor/fileManager';
import { logger } from '../../utils/logging';
import { AuthenticatedRequest } from '../middleware/auth';

const performFileOperation = async (workingDirectory: string, req: any): Promise<any> => {
  const { operation, path: relativePath, content, recursive, mode } = req;
  const fullPath = path.resolve(workingDirectory, relativePath);

  logger.info(`Performing ${operation} on ${fullPath}`);

  switch (operation) {
    case 'list': return await listFiles(fullPath, recursive);
    case 'read': return await readFile(fullPath);
    case 'write':
      if (content === undefined) throw new Error('Content is required for write operation');
      await writeFile(fullPath, content);
      return 'File written successfully';
    case 'createFile':
      if (content === undefined) throw new Error('Content is required for createFile operation');
      await createFile(fullPath, content);
      return 'File created successfully';
    case 'update':
      if (content === undefined || mode === undefined) throw new Error('Content and mode are required for update operation');
      await updateFile(fullPath, content, mode);
      return 'File updated successfully';
    case 'deleteFile':
      await deleteFile(fullPath);
      return 'File deleted successfully';
    case 'createDir':
      await createDirectory(fullPath);
      return 'Directory created successfully';
    case 'deleteDirectory':
      await deleteDirectory(fullPath);
      return 'Directory deleted successfully';
    case 'checkExistence':
      const exists = await checkExistence(fullPath);
      return { exists };
    default:
      throw new Error('Invalid file operation');
  }
};

export const handleFileOperation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await performFileOperation(req.app.locals.currentWorkingDirectory, req.body);
    res.json({ result });
  } catch (error) {
    logger.error('Error performing file operation', {
      error,
      request: req.body,
      agentId: req.agentId,
    });
    if (error instanceof Error && error.message === 'File or directory not found') {
      res.status(404).json({ error: 'File or directory not found' });
    } else {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
};
