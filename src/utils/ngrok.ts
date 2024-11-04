import ngrok from 'ngrok';
import { logger } from './logging';

type NgrokRegion = 'us' | 'eu' | 'au' | 'ap' | 'sa' | 'jp' | 'in';

interface NgrokConfig {
  port: number;
  authtoken?: string;
  region?: NgrokRegion;
}

interface NgrokConnection {
  url: string;
  disconnect: () => Promise<void>;
}

const DEFAULT_PORT = 3000;

const getPort = (): number => {
  const port = process.env.PORT;
  return port ? parseInt(port, 10) : DEFAULT_PORT;
};

const createNgrokConfig = (config?: Partial<NgrokConfig>): NgrokConfig => ({
  port: config?.port || getPort(),
  region: config?.region || 'us',
  authtoken: process.env.NGROK_AUTHTOKEN || config?.authtoken,
});

export const connectNgrok = async (
  config?: Partial<NgrokConfig>
): Promise<NgrokConnection> => {
  try {
    const ngrokConfig = createNgrokConfig(config);
    
    logger.info('Starting ngrok tunnel...', { port: ngrokConfig.port });
    
    try {
      const url = await ngrok.connect({
        addr: ngrokConfig.port,
        region: ngrokConfig.region,
        authtoken: ngrokConfig.authtoken,
      });

      logger.info('Ngrok tunnel established', { url });

      return {
        url,
        disconnect: async () => {
          try {
            await ngrok.disconnect();
            logger.info('Ngrok tunnel disconnected');
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error) {
              if (error.code === 'ECONNREFUSED') {
                logger.info('Ngrok connection already closed');
                return;
              }
            }
            logger.error('Error disconnecting ngrok tunnel', { error });
            throw error;
          }
        },
      };
    } catch (error) {
      // If the error is auth-related, provide helpful instructions
      if (error && typeof error === 'object' && 
          ('message' in error && typeof error.message === 'string' && 
           error.message.toLowerCase().includes('auth'))) {
        logger.error(
          'Ngrok authentication required. Please follow these steps:\n' +
          '1. Sign up for a free ngrok account at https://dashboard.ngrok.com/signup\n' +
          '2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken\n' +
          '3. Set the NGROK_AUTHTOKEN environment variable in your docker-compose.yml or .env file\n' +
          '4. Restart the application'
        );
      }
      throw error;
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Failed to connect to ngrok service. This usually means:\n' +
          '1. ngrok is not properly initialized\n' +
          '2. You need to authenticate with ngrok first\n' +
          'Please set the NGROK_AUTHTOKEN environment variable in your docker-compose.yml or .env file\n' +
          'If the problem persists, try running: npm install ngrok --save'
        );
      }
    }
    
    logger.error('Error establishing ngrok tunnel', { error });
    throw error;
  }
};

export const disconnectAll = async (): Promise<void> => {
  try {
    await ngrok.kill();
    logger.info('All ngrok tunnels terminated');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        logger.info('No active ngrok tunnels to terminate');
        return;
      }
    }
    logger.error('Error killing ngrok tunnels', { error });
    throw error;
  }
};
