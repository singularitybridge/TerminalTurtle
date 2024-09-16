import dotenv from 'dotenv';
import path from 'path';
import { createApiServer } from './server/apiServer';
import { logger, setupUnhandledExceptionLogging } from './utils/logging';

dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const { PORT, WORKING_DIRECTORY } = process.env;

if (!PORT || !WORKING_DIRECTORY) {
  logger.error('Missing required environment variables');
  process.exit(1);
}

setupUnhandledExceptionLogging();

const startServer = async (): Promise<void> => {
  logger.info('Starting AI Agent Executor');

  const app = createApiServer(WORKING_DIRECTORY);

  app.listen(Number(PORT), () => {
    logger.info(`AI Agent Executor is listening on port ${PORT}`);
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
