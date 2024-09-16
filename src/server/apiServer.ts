import express, { Request, Response } from 'express';
import path from 'path';
import {
  executeCommand,
  stopProcess,
  getProcessStatus,
  stopAllProcesses,
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
      const { command, runInBackground } = req.body;

      // Handle 'cd' commands to change directories
      if (command.startsWith('cd ')) {
        const targetDir = command.slice(3).trim();
        const newPath = path.resolve(currentWorkingDirectory, targetDir);

        currentWorkingDirectory = newPath;
        logger.info(`Changed directory to ${currentWorkingDirectory}`);
        res.json({ result: `Changed directory to ${currentWorkingDirectory}` });
      } else {
        const result = await executeCommand(
          command,
          currentWorkingDirectory,
          runInBackground
        );

        if (runInBackground && result.pid) {
          res.json({ message: 'Command is running in background', pid: result.pid });
        } else {
          res.json({ result });
        }
      }
    } catch (error) {
      logger.error('Error executing command', { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  /**
   * Endpoint to get process status and output.
   */
  app.get('/process/:pid', (req: Request, res: Response) => {
    const pid = req.params.pid;
    const status = getProcessStatus(pid);
    if (status) {
      res.json({ pid, ...status });
    } else {
      res.status(404).json({ error: 'Process not found' });
    }
  });

  /**
   * Endpoint to stop a background process.
   */
  app.post('/process/:pid/stop', (req: Request, res: Response) => {
    const pid = req.params.pid;
    const stopped = stopProcess(pid);
    if (stopped) {
      res.json({ message: `Process ${pid} has been stopped` });
    } else {
      res.status(404).json({ error: 'Process not found' });
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

  /**
   * Endpoint to stop all running processes and shut down server.
   */
  app.post('/stop-execution', (_: Request, res: Response) => {
    logger.info('Received stop execution command');
    stopAllProcesses();
    res.json({ message: 'All processes stopped' });
    process.exit(0);
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
