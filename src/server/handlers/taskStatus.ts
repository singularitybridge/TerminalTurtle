import { Response } from 'express';
import { logger } from '../../utils/logging';
import { AuthenticatedRequest } from '../middleware/auth';
import { getTask, getTaskOutput } from '../../executor/taskManager';

export const handleTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const task = getTask(taskId);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.status(200).json({
    id: task.id,
    command: task.command,
    status: task.status,
    output: getTaskOutput(task.id),
    exitCode: task.exitCode,
    error: task.error,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
};
