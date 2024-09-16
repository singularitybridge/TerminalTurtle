import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { logger } from '../utils/logging';

/**
 * Recursively list all files in a directory.
 */
const listFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? listFilesRecursive(res) : res;
    })
  );
  return files.flat();
};

/**
 * List files in a directory.
 */
export const listFiles = async (
  fullPath: string,
  recursive: boolean = false
): Promise<string[]> => {
  logger.info(`Listing files in ${fullPath}`);
  try {
    if (recursive) {
      return await listFilesRecursive(fullPath);
    } else {
      const entries = await fs.readdir(fullPath);
      return entries.map((entry) => path.join(fullPath, entry));
    }
  } catch (error: unknown) {
    logger.error(
      `Error listing files: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Read the content of a file.
 */
export const readFile = async (fullPath: string): Promise<string> => {
  logger.info(`Reading file ${fullPath}`);
  try {
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error: unknown) {
    logger.error(
      `Error reading file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Create a new file with specified content.
 * Throws an error if the file already exists.
 */
export const createFile = async (
  fullPath: string,
  content: string
): Promise<void> => {
  logger.info(`Creating file ${fullPath}`);
  try {
    await fs.writeFile(fullPath, content, { flag: 'wx', encoding: 'utf-8' });
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      logger.error(`File already exists: ${fullPath}`);
      throw new Error('File already exists');
    } else {
      logger.error(
        `Error creating file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }
};

/**
 * Write content to a file, overwriting existing content or creating a new file.
 */
export const writeFile = async (
  fullPath: string,
  content: string
): Promise<void> => {
  logger.info(`Writing to file ${fullPath}`);
  try {
    await fs.writeFile(fullPath, content, 'utf-8');
  } catch (error: unknown) {
    logger.error(
      `Error writing to file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Update an existing file's content with the specified mode.
 */
export const updateFile = async (
  fullPath: string,
  content: string,
  mode: 'overwrite' | 'append'
): Promise<void> => {
  logger.info(`Updating file ${fullPath} with mode ${mode}`);
  try {
    if (mode === 'overwrite') {
      await fs.writeFile(fullPath, content, 'utf-8');
    } else if (mode === 'append') {
      await fs.appendFile(fullPath, content, 'utf-8');
    } else {
      throw new Error('Invalid mode for updateFile. Use "overwrite" or "append".');
    }
  } catch (error: unknown) {
    logger.error(
      `Error updating file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Delete a specified file.
 */
export const deleteFile = async (fullPath: string): Promise<void> => {
  logger.info(`Deleting file ${fullPath}`);
  try {
    await fs.unlink(fullPath);
  } catch (error: unknown) {
    logger.error(
      `Error deleting file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Create a new directory.
 */
export const createDirectory = async (fullPath: string): Promise<void> => {
  logger.info(`Creating directory ${fullPath}`);
  try {
    await fs.mkdir(fullPath, { recursive: true });
  } catch (error: unknown) {
    logger.error(
      `Error creating directory: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Delete a specified directory and its contents.
 */
export const deleteDirectory = async (fullPath: string): Promise<void> => {
  logger.info(`Deleting directory ${fullPath}`);
  try {
    await fs.rm(fullPath, { recursive: true, force: true });
  } catch (error: unknown) {
    logger.error(
      `Error deleting directory: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    throw error;
  }
};

/**
 * Check if a file or directory exists.
 */
export const checkExistence = async (fullPath: string): Promise<boolean> => {
  logger.info(`Checking existence of ${fullPath}`);
  try {
    await fs.access(fullPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
