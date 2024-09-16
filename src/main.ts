import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createApiServer } from './server/apiServer';
import { logger, setupUnhandledExceptionLogging } from './utils/logging';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { PORT, WORKING_DIRECTORY } = process.env;

if (!PORT || !WORKING_DIRECTORY) {
  logger.error('Missing required environment variables');
  process.exit(1);
}

setupUnhandledExceptionLogging();

const startServer = async (): Promise<void> => {
  logger.info('Starting AI Agent Executor');
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

  app.listen(Number(PORT), () => {
    logger.info(`AI Agent Executor is listening on port ${PORT}`);
    logger.info(`Working directory: ${WORKING_DIRECTORY}`);
  });
};

startServer().catch((error: unknown) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Shutting down AI Agent Executor');
  process.exit(0);
});
