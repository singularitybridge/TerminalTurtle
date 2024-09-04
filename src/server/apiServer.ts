import express, { Request, Response } from 'express';
import { executeCommand, stopExecution } from '../executor/commandExecutor';
import { listFiles, readFile, writeFile, createDirectory } from '../executor/fileManager';
import { logger } from '../utils/logging';

type FileOperation = 'list' | 'read' | 'write' | 'createDir';

interface FileOperationRequest {
  operation: FileOperation;
  path: string;
  content?: string;
  recursive?: boolean;
}

const handleFileOperation = async (workingDirectory: string, req: FileOperationRequest): Promise<string | string[] | void> => {
  const { operation, path, content, recursive } = req;
  const fullPath = `${workingDirectory}/${path}`;

  switch (operation) {
    case 'list':
      return listFiles(fullPath, recursive);
    case 'read':
      return readFile(fullPath);
    case 'write':
      if (content === undefined) {
        throw new Error('Content is required for write operation');
      }
      await writeFile(fullPath, content);
      return 'File written successfully';
    case 'createDir':
      await createDirectory(fullPath);
      return 'Directory created successfully';
    default:
      throw new Error('Invalid file operation');
  }
};

export const createApiServer = (workingDirectory: string): express.Express => {
  const app = express();

  app.use(express.json());

  app.post('/execute', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      const result = await executeCommand(command);
      res.json({ result });
    } catch (error) {
      logger.error('Error executing command', { error });
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  });

  app.post('/file-operation', async (req: Request, res: Response) => {
    try {
      const result = await handleFileOperation(workingDirectory, req.body);
      res.json({ result });
    } catch (error) {
      logger.error('Error performing file operation', { error });
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  });

  app.post('/stop-execution', (_: Request, res: Response) => {
    logger.info('Received stop execution command');
    stopExecution();
    res.json({ message: 'Execution stopped' });
  });

  return app;
};