import express from 'express';
import path from 'path';
import { Server } from 'http';
import { logger } from '../utils/logging';
import { authenticateRequest } from './middleware/auth';
import { handleHealthCheck } from './handlers/healthCheck';
import { handleAgentInfo } from './handlers/agentInfo';
import { handleExecute } from './handlers/execute';
import { handleFileOperation } from './handlers/fileOperation';
import { handleTaskStatus } from './handlers/taskStatus';
import { handleChangeDirectory } from './handlers/changeDirectory';
import { handleGetAllTasks } from './handlers/getAllTasks';
import { handleEndTask } from './handlers/endTask';
import { handleInitProject } from './handlers/initProject';
import { handleAIAgent } from './handlers/aiAgent';
import { handleDevServer } from './handlers/devServer';

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

  // DevAtelier-specific routes
  app.post('/init-project', authenticateRequest, handleInitProject);
  app.post('/ai-agent', authenticateRequest, handleAIAgent);
  app.post('/dev-server', authenticateRequest, handleDevServer);

  const start = async (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        logger.info(`AI Agent Executor is listening on port ${port}`);
        logger.info(`Base working directory: ${workingDirectory}`);
        resolve(server);
      });

      server.on('error', (error: Error) => {
        reject(error);
      });
    });
  };

  return { app, start };
};
