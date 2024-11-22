import express from 'express';
import path from 'path';
import { Server } from 'http';
import { logger } from '../utils/logging';
import { setupNgrok } from '../utils/ngrok';
import { authenticateRequest } from './middleware/auth';
import { handleHealthCheck } from './handlers/healthCheck';
import { handleAgentInfo } from './handlers/agentInfo';
import { handleExecute } from './handlers/execute';
import { handleFileOperation } from './handlers/fileOperation';
import { handleTaskStatus } from './handlers/taskStatus';
import { handleChangeDirectory } from './handlers/changeDirectory';
import { handleGetAllTasks } from './handlers/getAllTasks';
import { handleEndTask } from './handlers/endTask';

export const createApiServer = async (workingDirectory: string): Promise<{ 
  app: express.Express, 
  start: (port: number) => Promise<Server>
}> => {
  const app = express();
  app.use(express.json());

  app.locals.baseWorkingDirectory = path.resolve(workingDirectory);

  // Public routes
  app.get('/health', handleHealthCheck);
  app.get('/agent-info', handleAgentInfo);

  // Protected routes
  app.use(['/execute', '/file-operation', '/tasks', '/change-directory'], authenticateRequest);
  app.post('/execute', handleExecute);
  app.post('/file-operation', handleFileOperation);
  app.get('/tasks', handleGetAllTasks);
  app.get('/tasks/:taskId', handleTaskStatus);
  app.post('/tasks/:taskId/end', handleEndTask);
  app.post('/change-directory', handleChangeDirectory);

  const start = async (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, async () => {
        logger.info(`AI Agent Executor is listening on port ${port}`);
        logger.info(`Base working directory: ${workingDirectory}`);

        const ngrokConnection = await setupNgrok(port);
        
        if (ngrokConnection) {
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
