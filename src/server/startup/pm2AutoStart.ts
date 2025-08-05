import { logger } from '../../utils/logging';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Auto-start dev servers using PM2 for better process management
 */
export async function autoStartWithPM2(workingDirectory: string): Promise<void> {
  const autoStart = process.env.AUTO_START_DEV_SERVER === 'true';
  
  if (!autoStart) {
    logger.info('Auto-start dev server is disabled');
    return;
  }

  logger.info('Auto-start dev server is enabled, checking for projects...');

  try {
    // Check if there's a package.json in the workspace
    const packageJsonPath = path.join(workingDirectory, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      logger.info('Found package.json, starting dev server with PM2...');
      
      const port = process.env.DEV_SERVER_PORT || '3100';
      
      // Create PM2 ecosystem file
      const pm2Config = {
        apps: [{
          name: 'dev-server',
          script: 'npm',
          args: 'run dev',
          cwd: workingDirectory,
          env: {
            PORT: port,
            NODE_ENV: 'development'
          },
          error_file: path.join(workingDirectory, 'pm2-error.log'),
          out_file: path.join(workingDirectory, 'pm2-out.log'),
          autorestart: true,
          watch: false
        }]
      };
      
      const ecosystemPath = path.join(workingDirectory, 'ecosystem.config.js');
      await fs.writeFile(
        ecosystemPath, 
        `module.exports = ${JSON.stringify(pm2Config, null, 2)}`
      );
      
      // Start with PM2
      const pm2Process = spawn('pm2', ['start', ecosystemPath, '--no-daemon'], {
        cwd: workingDirectory,
        env: { ...process.env, PORT: port }
      });
      
      pm2Process.stdout.on('data', (data) => {
        logger.info(`PM2: ${data.toString().trim()}`);
      });
      
      pm2Process.stderr.on('data', (data) => {
        logger.error(`PM2 Error: ${data.toString().trim()}`);
      });
      
      // Give PM2 time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logger.info(`Dev server started with PM2 on port ${port}`);
      
    } catch (error) {
      logger.info('No package.json found in workspace, skipping auto-start');
    }
    
  } catch (error) {
    logger.error('Error during PM2 auto-start', error);
  }
}