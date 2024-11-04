import express, { Request, Response, NextFunction } from 'express';
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
import { getCredentials } from '../utils/credentials';
import { setupNgrok } from '../utils/ngrok';
import { Server } from 'http';

// Custom interface for authenticated requests
interface AuthenticatedRequest extends Request {
  agentId?: string;
}

// Authentication middleware
const authenticateRequest = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const credentials = getCredentials();
    const providedApiKey = authHeader.split(' ')[1];

    if (providedApiKey !== credentials.apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Add agent ID to request for logging purposes
    req.agentId = credentials.id;
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createApiServer = async (workingDirectory: string): Promise<{ 
  app: express.Express, 
  start: (port: number) => Promise<Server>
}> => {
  const app = express();
  app.use(express.json());

  // Initialize the current working directory
  let currentWorkingDirectory = path.resolve(workingDirectory);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy' });
  });

  // Get agent information
  app.get('/agent-info', (req: Request, res: Response) => {
    try {
      const credentials = getCredentials();
      res.json({
        id: credentials.id,
        name: credentials.name,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Apply authentication middleware to protected routes
  app.use(['/execute', '/file-operation'], authenticateRequest);

  /**
   * Endpoint to execute shell commands.
   */
  app.post('/execute', async (req: AuthenticatedRequest, res: Response) => {
    try {
      let { command } = req.body;
  
      // Handle 'cd' commands to change directories
      if (command.startsWith('cd ')) {
        const newDir = command.slice(3).trim();
        const newPath = path.resolve(currentWorkingDirectory, newDir);
        
        try {
          // Check if the new path exists
          const exists = await checkExistence(newPath);
          if (exists) {
            currentWorkingDirectory = newPath;
            res.status(200).json({
              success: true,
              result: `Changed directory to: ${currentWorkingDirectory}`,
            });
          } else {
            res.status(400).json({
              success: false,
              result: `Directory not found: ${newPath}`,
            });
          }
        } catch (error) {
          res.status(400).json({
            success: false,
            result: `Error changing directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      } else {
        // Optionally adjust the command for 'npm run build'
        if (command === 'npm run build') {
          command = 'npm run build -- --pretty';
        }
  
        const result = await executeCommand(command, currentWorkingDirectory);
        const output = result.stdout + result.stderr;
  
        res.status(200).json({
          success: true,
          exitCode: result.exitCode,
          result: output || `command executed successfully`, // Ensure non-empty result
        });
      }
    } catch (error) {
      const err = error as any;
      res.status(500).json({
        success: false,
        exitCode: err.exitCode || -1,
        result: err.stdout + err.stderr || 'An error occurred.',
      });
    }
  });

  /**
   * Endpoint to perform file operations.
   */
  app.post('/file-operation', async (req: AuthenticatedRequest, res: Response) => {
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
        agentId: req.agentId,
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

  const start = async (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, async () => {
        logger.info(`AI Agent Executor is listening on port ${port}`);
        logger.info(`Working directory: ${workingDirectory}`);

        // Setup ngrok after server starts
        const ngrokConnection = await setupNgrok(port);
        
        if (ngrokConnection) {
          // Handle cleanup when server closes
          server.on('close', async () => {
            logger.info('Server closing, cleaning up...');
            await ngrokConnection.disconnect();
          });
        }

        resolve(server);
      });

      server.on('error', (error: Error) => {
        reject(error);
      });
    });
  };

  return { app, start };
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
