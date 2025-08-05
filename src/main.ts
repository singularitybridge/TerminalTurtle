import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createApiServer } from './server/apiServer';
import { logger, setupUnhandledExceptionLogging } from './utils/logging';
import { AddressInfo } from 'net';
import { getCredentials } from './utils/credentials';
import { cleanupInactiveClientDirectories } from './utils/clientDirectories';
import { autoStartDevServers } from './server/startup/autoStart';

// Load environment variables from .env file if it exists
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  // Check if error is a NodeJS.ErrnoException which has the 'code' property
  if ((result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
    // Only exit if there's an error other than the file not existing
    console.error('Error loading .env file:', result.error);
    process.exit(1);
  } else {
    console.warn('No .env file found. Proceeding with environment variables.');
  }
}

// Default values
const DEFAULT_PORT = 3000;
const DEFAULT_WORKING_DIRECTORY = path.resolve(__dirname, '../working_directory');
const CLEANUP_INTERVAL = 3600000; // 1 hour in milliseconds
const INACTIVE_THRESHOLD = 86400000; // 24 hours in milliseconds

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
const WORKING_DIRECTORY = process.env.WORKING_DIRECTORY || DEFAULT_WORKING_DIRECTORY;

if (!process.env.PORT) {
  logger.warn(`PORT not set in environment. Using default port: ${DEFAULT_PORT}`);
}

if (!process.env.WORKING_DIRECTORY) {
  logger.warn(`WORKING_DIRECTORY not set in environment. Using default: ${DEFAULT_WORKING_DIRECTORY}`);
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
  logger.info(`Starting AI Agent Executor in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Configured working directory: ${WORKING_DIRECTORY}`);

  // Initialize agent credentials from environment variables
  try {
    const credentials = getCredentials();
    logger.info('Agent configured successfully', {
      agentId: credentials.id,
      name: credentials.name,
    });
  } catch (error) {
    logger.error('Error setting up agent credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }

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

  try {
    // Create API server
    const { start } = await createApiServer(WORKING_DIRECTORY);

    // Find an available port starting from the configured PORT
    const availablePort = await findAvailablePort(PORT);
    if (availablePort !== PORT) {
      logger.info(`Port ${PORT} was in use, using port ${availablePort} instead`);
    }

    // Start the server
    const server = await start(availablePort);

    // Set up periodic cleanup of inactive client directories
    setInterval(() => {
      cleanupInactiveClientDirectories(INACTIVE_THRESHOLD)
        .catch(error => {
          logger.error('Error during cleanup of inactive client directories', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
    }, CLEANUP_INTERVAL);

    // Auto-start dev servers if enabled
    if (process.env.AUTO_START_DEV_SERVER === 'true') {
      logger.info('Auto-starting dev servers...');
      autoStartDevServers(WORKING_DIRECTORY).catch(error => {
        logger.error('Failed to auto-start dev servers', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${availablePort} is already in use. Please try again in a few moments or use a different port.`);
      } else {
        logger.error('Server error', { error });
      }
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down AI Agent Executor');
      server.close(() => {
        process.exit(0);
      });
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
