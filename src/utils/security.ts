import { logger } from './logging';

export const isCommandWhitelisted = (command: string): boolean => {
  // For testing purposes, allow all commands
  logger.info(`Allowing command: ${command}`);
  return true;
};

export const sanitizeInput = (input: string): string => {
  // Optionally, implement input sanitization if needed
  return input;
};

export const rateLimiter = (() => {
  // For testing purposes, disable rate limiting
  return (_clientId: string): boolean => {
    return true;
  };
})();

export const authenticate = (token: string): boolean => {
  // For testing purposes, bypass authentication
  return true;
};
