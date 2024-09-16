import express, { Request, Response } from 'express';
import path from 'path';
import {
  executeCommand,
  stopExecution,
} from '../executor/commandExecutor';
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
} from '../executor/fileManager';
import { logger } from '../utils/logging';

type FileOperation =
  | 'list'
  | 'read'
  | 'write'
  | 'createFile'
  | 'update'
  | 'deleteFile'
  | 'deleteDirectory'
  | 'createDir'
  | 'checkExistence';

interface FileOperationRequest {
  operation: FileOperation;
  path: string;
  content?: string;
  recursive?: boolean;
  mode?: 'overwrite' | 'append';
}

const handleFileOperation = async (
  workingDirectory: string,
  req: FileOperationRequest
): Promise<any> => {
  const { operation, path: relativePath, content, recursive, mode } = req;
  const fullPath = path.resolve(workingDirectory, relativePath);

  switch (operation) {
    case 'list':
      return await listFiles(fullPath, recursive);
    case 'read':
      return await readFile(fullPath);
    case 'write':
      if (content === undefined) {
        throw new Error('Content is required for write operation');
      }
      await writeFile(fullPath, content);
      return 'File written successfully';
    case 'createFile':
      if (content === undefined) {
        throw new Error('Content is required for createFile operation');
      }
      await createFile(fullPath, content);
      return 'File created successfully';
    case 'update':
      if (content === undefined || mode === undefined) {
        throw new Error('Content and mode are required for update operation');
      }
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
      return exists;
    default:
      throw new Error('Invalid file operation');
  }
};

export const createApiServer = (workingDirectory: string): express.Express => {
  const app = express();

  app.use(express.json());

  /**
   * Endpoint to execute shell commands.
   */
  app.post('/execute', async (req: Request, res: Response) => {
    try {
      const { command, working_directory } = req.body;
      const result = await executeCommand(command, working_directory);
      res.json({ result });
    } catch (error) {
      logger.error('Error executing command', { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * Endpoint to perform file operations.
   */
  app.post('/file-operation', async (req: Request, res: Response) => {
    try {
      const result = await handleFileOperation(workingDirectory, req.body);
      res.json({ result });
    } catch (error) {
      logger.error('Error performing file operation', {
        error,
        request: req.body,
      });
      if (
        error instanceof Error &&
        error.message === 'File or directory not found'
      ) {
        res.status(404).json({ error: 'File or directory not found' });
      } else {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }
  });

  /**
   * Endpoint to stop command execution.
   */
  app.post('/stop-execution', (_: Request, res: Response) => {
    logger.info('Received stop execution command');
    stopExecution();
    res.json({ message: 'Execution stopped' });
  });

  return app;
};
