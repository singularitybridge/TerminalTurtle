import ngrok from 'ngrok';
import { logger } from './logging';

interface NgrokConnection {
  url: string;
  disconnect: () => Promise<void>;
}

export const setupNgrok = async (port: number): Promise<NgrokConnection | null> => {
  const enableNgrok = process.env.ENABLE_NGROK === 'true';
  const authtoken = process.env.NGROK_AUTHTOKEN;

  if (!enableNgrok) {
    logger.info('Ngrok is not enabled. Set ENABLE_NGROK=true in your .env file to enable it.');
    return null;
  }

  if (!authtoken) {
    logger.warn('Ngrok auth token is not provided. Set NGROK_AUTHTOKEN in your .env file to use ngrok.');
    return null;
  }

  try {
    logger.info('Starting ngrok tunnel...', { port });

    const url = await ngrok.connect({
      addr: port,
      authtoken,
    });

    logger.info('Ngrok tunnel established', { url });

    return {
      url,
      disconnect: async () => {
        try {
          await ngrok.disconnect(url);
          await ngrok.kill();
          logger.info('Ngrok tunnel disconnected');
        } catch (error) {
          logger.error('Error disconnecting ngrok tunnel', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    };
  } catch (error) {
    logger.error('Error establishing ngrok tunnel', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};
