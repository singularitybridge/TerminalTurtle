import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { Server } from 'http';
import { logger } from '../utils/logging';
import { getCredentials } from '../utils/credentials';
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
import { authenticateEditor, createEditorProxy } from './handlers/editorProxy';

export const createApiServer = async (workingDirectory: string): Promise<{ 
  app: express.Express, 
  start: (port: number) => Promise<Server>
}> => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

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

  // Terminal Turtle-specific routes
  app.post('/init-project', authenticateRequest, handleInitProject);
  app.post('/ai-agent', authenticateRequest, handleAIAgent);
  app.post('/dev-server', authenticateRequest, handleDevServer);

  // Code Editor Routes
  
  // Special endpoint to authenticate and set session (must be BEFORE the general /editor proxy)
  app.get('/editor-auth', (req, res) => {
    const apiKey = req.query.key as string;
    if (apiKey) {
      const credentials = getCredentials();
      if (apiKey === credentials.apiKey) {
        res.cookie('editor-auth', 'true', { 
          httpOnly: true, 
          path: '/',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.redirect('/editor/');
        return;
      }
    }
    res.status(401).json({ error: 'Invalid API key' });
  });
  
  app.get('/editor/status', authenticateRequest, (req, res) => {
    res.json({ 
      status: 'available',
      message: 'Code editor is available',
      url: '/editor-auth?key=YOUR_API_KEY',
      note: 'Use /editor-auth?key=YOUR_API_KEY to authenticate and access the editor'
    });
  });

  // Proxy all /editor requests to code-server
  const editorProxy = createEditorProxy();
  // Store the proxy for WebSocket upgrade
  app.set('editorProxy', editorProxy);
  app.use('/editor', authenticateEditor, editorProxy);

  const start = async (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        logger.info(`AI Agent Executor is listening on port ${port}`);
        logger.info(`Base working directory: ${workingDirectory}`);
        
        // The http-proxy-middleware with ws:true automatically handles WebSocket upgrades
        // We need to ensure the server instance is available for the proxy
        logger.info('WebSocket proxy configured for /editor paths');
        
        resolve(server);
      });

      server.on('error', (error: Error) => {
        reject(error);
      });
    });
  };

  return { app, start };
};
