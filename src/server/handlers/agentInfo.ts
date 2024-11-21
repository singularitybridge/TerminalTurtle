import { Request, Response } from 'express';
import { getCredentials } from '../../utils/credentials';

export const handleAgentInfo = (_req: Request, res: Response): void => {
  try {
    const credentials = getCredentials();
    res.json({
      id: credentials.id,
      name: credentials.name,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
