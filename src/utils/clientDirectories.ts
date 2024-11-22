import path from 'path';
import fs from 'fs/promises';
import { logger } from './logging';

const clientWorkingDirectories = new Map<string, string>();

/**
 * Sets the working directory for a specific client.
 * @param clientId The unique identifier for the client.
 * @param newPath The new working directory path for the client.
 */
export const setClientWorkingDirectory = (clientId: string, newPath: string): void => {
  try {
    clientWorkingDirectories.set(clientId, newPath);
    logger.info(`Set working directory for client ${clientId} to ${newPath}`);
  } catch (error) {
    logger.error(`Failed to set working directory for client ${clientId}`, error);
  }
};

/**
 * Retrieves the working directory for a specific client.
 * If no directory is set for the client, it returns the base working directory.
 * @param clientId The unique identifier for the client.
 * @param baseWorkingDirectory The default base working directory.
 * @returns The client's working directory or the base working directory.
 */
export const getClientWorkingDirectory = (clientId: string, baseWorkingDirectory: string): string => {
  try {
    const clientDir = clientWorkingDirectories.get(clientId);
    if (clientDir) {
      logger.debug(`Retrieved working directory for client ${clientId}: ${clientDir}`);
      return clientDir;
    }
    logger.debug(`Using base working directory for client ${clientId}: ${baseWorkingDirectory}`);
    return baseWorkingDirectory;
  } catch (error) {
    logger.error(`Failed to get working directory for client ${clientId}`, error);
    return baseWorkingDirectory;
  }
};

/**
 * Resets the working directory for a specific client to the default.
 * @param clientId The unique identifier for the client.
 */
export const resetClientWorkingDirectory = (clientId: string): void => {
  try {
    clientWorkingDirectories.delete(clientId);
    logger.info(`Reset working directory for client ${clientId}`);
  } catch (error) {
    logger.error(`Failed to reset working directory for client ${clientId}`, error);
  }
};

/**
 * Cleans up inactive client directories.
 * This function should be called periodically to remove directories for inactive clients.
 * @param inactiveThreshold The time in milliseconds after which a client is considered inactive.
 */
export const cleanupInactiveClientDirectories = async (inactiveThreshold: number): Promise<void> => {
  const now = Date.now();
  for (const [clientId, directory] of clientWorkingDirectories.entries()) {
    try {
      const stats = await fs.stat(directory);
      if (now - stats.atimeMs > inactiveThreshold) {
        resetClientWorkingDirectory(clientId);
        logger.info(`Cleaned up inactive directory for client ${clientId}`);
      }
    } catch (error) {
      logger.error(`Failed to check or clean up directory for client ${clientId}`, error);
    }
  }
};
