import { v4 as uuidv4 } from 'uuid';

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1 MB

interface Task {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputChunks: string[];
  exitCode: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const tasks = new Map<string, Task>();

export const createTask = (command: string): Task => {
  const id = uuidv4();
  const task: Task = {
    id,
    command,
    status: 'pending',
    outputChunks: [],
    exitCode: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  tasks.set(id, task);
  return task;
};

export const getTask = (id: string): Task | undefined => {
  return tasks.get(id);
};

export const updateTask = (id: string, updates: Partial<Omit<Task, 'outputChunks'>> & { output?: string }): void => {
  const task = tasks.get(id);
  if (task) {
    if (updates.output !== undefined) {
      const currentSize = task.outputChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const availableSize = MAX_OUTPUT_SIZE - currentSize;
      
      if (availableSize > 0) {
        const newChunk = updates.output.slice(0, availableSize);
        task.outputChunks.push(newChunk);
      }
      
      delete updates.output;
    }
    
    Object.assign(task, updates);
    task.updatedAt = new Date();
  }
};

export const getTaskOutput = (id: string): string => {
  const task = tasks.get(id);
  return task ? task.outputChunks.join('') : '';
};

export const getAllTasks = (): Task[] => {
  return Array.from(tasks.values());
};

export const endTask = (id: string): boolean => {
  const task = tasks.get(id);
  if (task && (task.status === 'pending' || task.status === 'running')) {
    task.status = 'completed';
    task.updatedAt = new Date();
    return true;
  }
  return false;
};
