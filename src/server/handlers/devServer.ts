import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';
import * as pty from 'node-pty';

const devServerProcesses = new Map<string, pty.IPty>();

export const handleDevServer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { action = 'start', port } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  if (action === 'start') {
    // Check if dev server is already running
    if (devServerProcesses.has(clientId)) {
      res.status(400).json({ error: 'Dev server is already running' });
      return;
    }

    try {
      // Detect project type and determine the right command
      const fs = await import('fs/promises');
      const path = await import('path');
      const packageJsonPath = path.join(workingDirectory, 'package.json');
      
      let devCommand = 'npm run dev';
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};
        
        if (scripts.dev) {
          devCommand = 'npm run dev';
        } else if (scripts.start) {
          devCommand = 'npm start';
        } else if (scripts.serve) {
          devCommand = 'npm run serve';
        }
        
        // Set port if specified, otherwise use default from environment
        const devPort = port || process.env.DEV_SERVER_PORT || '3100';
        devCommand = `PORT=${devPort} ${devCommand}`;
      } catch (error) {
        logger.warn('Could not read package.json, using default command');
      }

      const { ptyProcess } = executeCommand(devCommand, workingDirectory, (data) => {
        logger.info(`Dev server output for ${clientId}: ${data}`);
      });

      devServerProcesses.set(clientId, ptyProcess);

      res.json({ 
        success: true,
        action: 'started',
        command: devCommand,
        message: 'Dev server started successfully'
      });

    } catch (error) {
      logger.error('Error starting dev server', { error, clientId });
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to start dev server' 
      });
    }

  } else if (action === 'stop') {
    const process = devServerProcesses.get(clientId);
    
    if (!process) {
      res.status(400).json({ error: 'No dev server is running' });
      return;
    }

    try {
      process.kill();
      devServerProcesses.delete(clientId);
      
      res.json({ 
        success: true,
        action: 'stopped',
        message: 'Dev server stopped successfully'
      });
    } catch (error) {
      logger.error('Error stopping dev server', { error, clientId });
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to stop dev server' 
      });
    }

  } else if (action === 'status') {
    const isRunning = devServerProcesses.has(clientId);
    
    res.json({ 
      running: isRunning,
      message: isRunning ? 'Dev server is running' : 'Dev server is not running'
    });

  } else {
    res.status(400).json({ error: 'Invalid action. Use: start, stop, or status' });
  }
};
