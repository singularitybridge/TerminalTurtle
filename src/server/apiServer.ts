import express, { Request, Response } from 'express';
import path from 'path';
import { executeCommand } from '../executor/commandExecutor';
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

export const createApiServer = (workingDirectory: string): express.Express => {
  const app = express();
  app.use(express.json());

  // Initialize the current working directory
  let currentWorkingDirectory = path.resolve(workingDirectory);

  /**
   * Endpoint to execute shell commands.
   */
  app.post('/execute', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;

      // Handle 'cd' commands to change directories
      if (command.startsWith('cd ')) {
        const targetDir = command.slice(3).trim();
        const newPath = path.resolve(currentWorkingDirectory, targetDir);

        currentWorkingDirectory = newPath;
        logger.info(`Changed directory to ${currentWorkingDirectory}`);
        res.json({ result: `Changed directory to ${currentWorkingDirectory}` });
      } else {
        const result = await executeCommand(command, currentWorkingDirectory);
        
        res.status(200).json({
          success: true,
          exitCode: result.exitCode,
          output: result.stdout + result.stderr, // Combine outputs if needed
        });
    
      }
    } catch (error) {
      const err = error as any;
      res.status(500).json({
        success: false,
        exitCode: err.exitCode || -1,
        output: err.stdout + err.stderr || 'An error occurred.',
      });
  
    }
  });

  /**
   * Endpoint to perform file operations.
   */
  app.post('/file-operation', async (req: Request, res: Response) => {
    try {
      const result = await handleFileOperation(
        currentWorkingDirectory,
        req.body
      );
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
          error: error instanceof Error
            ? error.message
            : 'Unknown error occurred',
        });
      }
    }
  });

  return app;
};

const handleFileOperation = async (
  workingDirectory: string,
  req: any
): Promise<any> => {
  const { operation, path: relativePath, content, recursive, mode } = req;
  const fullPath = path.resolve(workingDirectory, relativePath);

  logger.info(`Performing ${operation} on ${fullPath}`);

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
      return { exists };
    default:
      throw new Error('Invalid file operation');
  }
};
