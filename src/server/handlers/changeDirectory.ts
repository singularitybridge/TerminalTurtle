import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth';
import { setClientWorkingDirectory } from '../../utils/clientDirectories';

export const handleChangeDirectory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { newPath } = req.body;
  const clientId = req.agentId as string; // Type assertion to ensure clientId is a string

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  if (!newPath) {
    res.status(400).json({ error: 'newPath is required' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const absolutePath = path.resolve(baseWorkingDirectory, newPath);

  // Security: Ensure the new path is within the base working directory
  if (!absolutePath.startsWith(baseWorkingDirectory)) {
    res.status(400).json({ error: 'Invalid directory path' });
    return;
  }

  // Check if the path exists and is a directory
  try {
    const stats = fs.statSync(absolutePath);
    if (!stats.isDirectory()) {
      res.status(400).json({ error: 'Path is not a directory' });
      return;
    }
  } catch (error) {
    res.status(400).json({ error: 'Directory does not exist' });
    return;
  }

  setClientWorkingDirectory(clientId, absolutePath);
  res.status(200).json({ message: `Working directory changed to ${absolutePath}` });
};
