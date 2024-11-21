import { Request, Response, NextFunction } from 'express';
import { getCredentials } from '../../utils/credentials';
import { logger } from '../../utils/logging';

export interface AuthenticatedRequest extends Request {
  agentId?: string;
}

export const authenticateRequest = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const credentials = getCredentials();
    const providedApiKey = authHeader.split(' ')[1];

    if (providedApiKey !== credentials.apiKey) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.agentId = credentials.id;
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};
