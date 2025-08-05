import { logger } from '../../utils/logging';
import { executeCommand } from '../../executor/commandExecutor';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AutoStartConfig {
  enabled: boolean;
  projectPath: string;
  port?: number;
}

/**
 * Auto-start dev servers based on configuration
 */
export async function autoStartDevServers(baseWorkingDirectory: string): Promise<void> {
  const autoStart = process.env.AUTO_START_DEV_SERVER === 'true';
  
  if (!autoStart) {
    logger.info('Auto-start dev server is disabled');
    return;
  }

  logger.info('Auto-start dev server is enabled, checking for projects...');

  try {
    // Check if there's a package.json in the workspace
    const packageJsonPath = path.join(baseWorkingDirectory, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      logger.info('Found package.json, attempting to start dev server...');
      
      // Detect project type and start appropriate dev server
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      let command = 'npm run dev';
      const port = process.env.DEV_SERVER_PORT || '3100';
      
      if (scripts.dev) {
        command = `PORT=${port} npm run dev`;
      } else if (scripts.start) {
        command = `PORT=${port} npm start`;
      } else if (scripts.serve) {
        command = `PORT=${port} npm run serve`;
      } else {
        logger.warn('No suitable start script found in package.json');
        return;
      }
      
      // Create a startup script that will run the dev server
      const startupScript = `#!/bin/bash
cd ${baseWorkingDirectory}
${command} > dev-server.log 2>&1 &
echo $! > dev-server.pid
echo "Dev server started with PID $(cat dev-server.pid)"
`;
      
      const scriptPath = path.join(baseWorkingDirectory, 'start-dev-server.sh');
      await fs.writeFile(scriptPath, startupScript);
      await fs.chmod(scriptPath, '755');
      
      // Execute the startup script
      const { resultPromise } = executeCommand('bash start-dev-server.sh', baseWorkingDirectory);
      const result = await resultPromise;
      
      if (result.exitCode === 0) {
        logger.info(`Dev server auto-started successfully on port ${port}`);
      } else {
        logger.error('Failed to auto-start dev server', { exitCode: result.exitCode });
      }
      
    } catch (error) {
      logger.info('No package.json found in workspace, skipping auto-start');
    }
    
  } catch (error) {
    logger.error('Error during auto-start', error);
  }
}

/**
 * Save dev server state for persistence
 */
export async function saveDevServerState(clientId: string, state: any): Promise<void> {
  const stateDir = path.join(process.cwd(), '.devserver-state');
  const stateFile = path.join(stateDir, `${clientId}.json`);
  
  try {
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    logger.info(`Saved dev server state for client ${clientId}`);
  } catch (error) {
    logger.error(`Failed to save dev server state for client ${clientId}`, error);
  }
}

/**
 * Load dev server state from persistence
 */
export async function loadDevServerState(clientId: string): Promise<any | null> {
  const stateFile = path.join(process.cwd(), '.devserver-state', `${clientId}.json`);
  
  try {
    const data = await fs.readFile(stateFile, 'utf-8');
    logger.info(`Loaded dev server state for client ${clientId}`);
    return JSON.parse(data);
  } catch (error) {
    // State file doesn't exist or can't be read
    return null;
  }
}