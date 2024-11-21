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

export const createApiServer = async (workingDirectory: string): Promise<{ 
  app: express.Express, 
  start: (port: number) => Promise<Server>
}> => {
  const app = express();
  app.use(express.json());

  app.locals.currentWorkingDirectory = path.resolve(workingDirectory);

  app.get('/health', handleHealthCheck);
  app.get('/agent-info', handleAgentInfo);

  app.use(['/execute', '/file-operation', '/tasks'], authenticateRequest);
  app.post('/execute', handleExecute);
  app.post('/file-operation', handleFileOperation);
  app.get('/tasks/:taskId', handleTaskStatus);

  const start = async (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, async () => {
        logger.info(`AI Agent Executor is listening on port ${port}`);
        logger.info(`Working directory: ${workingDirectory}`);

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
