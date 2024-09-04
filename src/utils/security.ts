import { logger } from './logging';

const whitelistedCommands = [
  'git',
  'npm',
  'node',
  'python',
  'pip',
];

export const isCommandWhitelisted = (command: string): boolean => {
  const commandBase = command.split(' ')[0];
  const isWhitelisted = whitelistedCommands.includes(commandBase);
  
  if (!isWhitelisted) {
    logger.warn(`Attempted to execute non-whitelisted command: ${command}`);
  }
  
  return isWhitelisted;
};

export const sanitizeInput = (input: string): string => {
  // Remove any characters that aren't alphanumeric, space, or common symbols
  return input.replace(/[^a-zA-Z0-9\s\-_.,]/g, '');
};

export const rateLimiter = (() => {
  const requestCounts = new Map<string, number>();
  const RATE_LIMIT = 100; // Maximum number of requests per minute
  const RATE_WINDOW = 60000; // 1 minute in milliseconds

  return (clientId: string): boolean => {
    const now = Date.now();
    const count = requestCounts.get(clientId) || 0;

    if (count >= RATE_LIMIT) {
      logger.warn(`Rate limit exceeded for client: ${clientId}`);
      return false;
    }

    requestCounts.set(clientId, count + 1);

    setTimeout(() => {
      const currentCount = requestCounts.get(clientId);
      if (currentCount && currentCount > 0) {
        requestCounts.set(clientId, currentCount - 1);
      }
    }, RATE_WINDOW);

    return true;
  };
})();

export const authenticate = (token: string): boolean => {
  // This is a placeholder for actual authentication logic
  // In a real-world scenario, you would validate the token against a secure store
  const validToken = process.env.AUTH_TOKEN;
  return token === validToken;
};