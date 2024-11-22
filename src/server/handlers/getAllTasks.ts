import { Request, Response } from 'express';
import { getAllTasks } from '../../executor/taskManager';

export const handleGetAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error getting all tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
