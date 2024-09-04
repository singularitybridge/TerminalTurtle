import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logging';

const resolvePath = (workingDirectory: string, filePath: string): string =>
  path.resolve(workingDirectory, filePath);

const listFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursive(res) : res;
  }));
  return files.flat();
};

export const listFiles = async (fullPath: string, recursive: boolean = false): Promise<string[]> => {
  logger.info(`Listing files in ${fullPath}`);
  try {
    if (recursive) {
      return await listFilesRecursive(fullPath);
    } else {
      const entries = await fs.readdir(fullPath);
      return entries.map(entry => path.join(fullPath, entry));
    }
  } catch (error: unknown) {
    logger.error(`Error listing files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const readFile = async (fullPath: string): Promise<string> => {
  logger.info(`Reading file ${fullPath}`);
  try {
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error: unknown) {
    logger.error(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const writeFile = async (fullPath: string, content: string): Promise<void> => {
  logger.info(`Writing to file ${fullPath}`);
  try {
    await fs.writeFile(fullPath, content, 'utf-8');
  } catch (error: unknown) {
    logger.error(`Error writing to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const createDirectory = async (fullPath: string): Promise<void> => {
  logger.info(`Creating directory ${fullPath}`);
  try {
    await fs.mkdir(fullPath, { recursive: true });
  } catch (error: unknown) {
    logger.error(`Error creating directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};