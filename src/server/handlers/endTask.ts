import { Request, Response } from 'express';
import { endTask, getTask } from '../../executor/taskManager';

export const handleEndTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;

  try {
    const task = getTask(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const success = endTask(taskId);
    if (success) {
      res.json({ message: 'Task ended successfully', taskId });
    } else {
      res.status(400).json({ error: 'Task could not be ended. It may already be completed or failed.' });
    }
  } catch (error) {
    console.error('Error ending task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
