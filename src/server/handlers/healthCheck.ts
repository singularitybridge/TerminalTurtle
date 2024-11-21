import { Request, Response } from 'express';

export const handleHealthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'healthy' });
};
