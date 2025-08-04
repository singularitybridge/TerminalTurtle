import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';
import { createTask, updateTask, setTaskProcess, deleteTaskProcess } from '../../executor/taskManager';

interface ProjectConfig {
  command: string;
  description: string;
  defaultFiles?: { [filename: string]: string };
}

const PROJECT_CONFIGS: { [key: string]: ProjectConfig } = {
  nextjs: {
    command: 'npx create-next-app@latest . --typescript --tailwind --app --no-git --yes',
    description: 'Next.js with TypeScript, Tailwind CSS, and App Router'
  },
  react: {
    command: 'npx create-react-app . --template typescript',
    description: 'React with TypeScript'
  },
  node: {
    command: 'npm init -y',
    description: 'Basic Node.js project',
    defaultFiles: {
      'index.js': `const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from DevAtelier!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      '.gitignore': 'node_modules/\n.env\n*.log'
    }
  }
};

export const handleInitProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectType = 'nextjs' } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  const config = PROJECT_CONFIGS[projectType];
  if (!config) {
    res.status(400).json({ error: 'Invalid project type. Use: nextjs, react, or node' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  const task = createTask(`Initializing ${projectType} project`);
  logger.info(`Created project initialization task ${task.id} for client ${clientId}`);

  res.status(202).json({
    taskId: task.id,
    message: `Project initialization started for ${projectType}.`,
    workingDirectory,
  });

  // Run the rest of the logic in the background
  (async () => {
    try {
      updateTask(task.id, { status: 'running' });

      // Execute the project creation command
      const { ptyProcess, resultPromise } = executeCommand(
        config.command,
        workingDirectory,
        (data: string) => {
          updateTask(task.id, { output: data });
        }
      );
      setTaskProcess(task.id, ptyProcess);
      const result = await resultPromise;

      if (!result.success) {
        throw new Error(`Project initialization failed: ${result.output}`);
      }

      // Create default files if specified
      if (config.defaultFiles) {
        const fs = await import('fs/promises');
        const path = await import('path');
        for (const [filename, content] of Object.entries(config.defaultFiles)) {
          const filePath = path.join(workingDirectory, filename);
          await fs.writeFile(filePath, content);
        }
      }

      // Install additional dependencies for Node.js projects
      if (projectType === 'node') {
        const { resultPromise: npmInstall } = executeCommand(
          'npm install express cors dotenv',
          workingDirectory
        );
        await npmInstall;
      }

      updateTask(task.id, {
        status: 'completed',
        exitCode: result.exitCode,
        output: result.output,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTask(task.id, {
        status: 'failed',
        error: errorMessage,
      });
      logger.error('Error initializing project', { error: errorMessage, taskId: task.id });
    } finally {
      deleteTaskProcess(task.id);
    }
  })();
};
