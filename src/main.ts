import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createApiServer } from './server/apiServer';
import { logger, setupUnhandledExceptionLogging } from './utils/logging';
import { connectNgrok, disconnectAll } from './utils/ngrok';
import { AddressInfo } from 'net';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

const { PORT, WORKING_DIRECTORY } = process.env;
const isLocalMode = process.env.NODE_ENV === 'local';

if (!PORT || !WORKING_DIRECTORY) {
  logger.error('Missing required environment variables');
  process.exit(1);
}

setupUnhandledExceptionLogging();

const findAvailablePort = async (startPort: number): Promise<number> => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Try the next port
        server.listen(startPort + 1);
      } else {
        reject(err);
      }
    });

    server.listen(startPort, () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
};

const startServer = async (): Promise<void> => {
  logger.info(`Starting AI Agent Executor in ${isLocalMode ? 'local' : 'development'} mode`);
  logger.info(`Configured working directory: ${WORKING_DIRECTORY}`);

  try {
    if (!fs.existsSync(WORKING_DIRECTORY)) {
      logger.info(`Creating working directory: ${WORKING_DIRECTORY}`);
      fs.mkdirSync(WORKING_DIRECTORY, { recursive: true });
    } else {
      logger.info(`Working directory already exists: ${WORKING_DIRECTORY}`);
    }

    // Check if the directory is writable
    fs.accessSync(WORKING_DIRECTORY, fs.constants.W_OK);
    logger.info(`Working directory is writable: ${WORKING_DIRECTORY}`);
  } catch (error) {
    logger.error('Error with working directory', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }

  const app = createApiServer(WORKING_DIRECTORY);

  try {
    // Find an available port starting from the configured PORT
    const availablePort = await findAvailablePort(Number(PORT));
    if (availablePort !== Number(PORT)) {
      logger.info(`Port ${PORT} was in use, using port ${availablePort} instead`);
    }

    const server = app.listen(availablePort, async () => {
      logger.info(`AI Agent Executor is listening on port ${availablePort}`);
      logger.info(`Working directory: ${WORKING_DIRECTORY}`);

      // Only initialize ngrok in development mode
      if (!isLocalMode) {
        try {
          const ngrokConnection = await connectNgrok({
            port: availablePort,
          });
          
          logger.info(`Public URL available at: ${ngrokConnection.url}`);

          // Store the disconnect function for cleanup
          process.on('SIGINT', async () => {
            logger.info('Shutting down ngrok tunnel...');
            await ngrokConnection.disconnect().catch(err => {
              // Error already logged in the ngrok utility
            });
            logger.info('Shutting down AI Agent Executor');
            server.close();
            process.exit(0);
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Ngrok tunnel setup failed', {
            error: errorMessage,
            note: 'Server will continue running without public URL access'
          });
        }
      }
    });

    // Handle server shutdown
    server.on('close', async () => {
      logger.info('Server closing, cleaning up...');
      if (!isLocalMode) {
        await disconnectAll().catch(err => {
          // Error already logged in the ngrok utility
        });
      }
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${availablePort} is already in use. Please try again in a few moments or use a different port.`);
      } else {
        logger.error('Server error', { error });
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', {
    error: reason instanceof Error ? reason.message : 'Unknown error',
  });
});

startServer().catch((error: unknown) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
