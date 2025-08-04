# AI Agent Guide: Transform TerminalTurtle into DevAtelier

## Mission Context
You are transforming TerminalTurtle (a terminal automation tool) into DevAtelier (an AI-powered development workspace system). DevAtelier will allow users to create isolated development environments where AI agents (like Aider) can build and modify Next.js/React/Node.js applications.

## Prerequisites Check
Ensure you're in the TerminalTurtle project root directory. Verify by running:
```bash
ls -la | grep -E "(package.json|Dockerfile|src)"
```

## Step-by-Step Implementation

### Step 1: Update Dockerfile to Include AI Agents and Dev Tools

**File to modify:** `Dockerfile`

**Action:** Replace the existing Dockerfile with this complete version:

```dockerfile
# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files for efficient caching
COPY package*.json ./

# Install dependencies with clean npm cache
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install system dependencies including Python for Aider
RUN apt-get update && \
    apt-get install -y curl wget unzip git python3 python3-pip python3-venv build-essential && \
    rm -rf /var/lib/apt/lists/*

# Install Aider in a virtual environment
RUN python3 -m venv /opt/aider-venv && \
    /opt/aider-venv/bin/pip install --upgrade pip && \
    /opt/aider-venv/bin/pip install aider-chat

# Create aider wrapper script
RUN echo '#!/bin/bash\n/opt/aider-venv/bin/aider "$@"' > /usr/local/bin/aider && \
    chmod +x /usr/local/bin/aider

# Install global Node.js development tools
RUN npm install -g create-react-app create-next-app typescript nodemon pm2

# Set default environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    WORKING_DIRECTORY=/data/workspace \
    AGENT_NAME=devatelier

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create and set permissions for workspace directory
RUN mkdir -p /data/workspace && \
    chown -R node:node /data/workspace

# Set ownership of /app to node user
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Document the ports being exposed
EXPOSE 8080 3000 4000 5173

# Health check to ensure service is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]

# Build-time metadata
LABEL org.opencontainers.image.title="DevAtelier" \
      org.opencontainers.image.description="AI-powered development workspace system" \
      org.opencontainers.image.source="https://github.com/yourusername/devatelier"
```

**Test:** Build the Docker image to ensure it works:
```bash
docker build -t devatelier-test .
```

### Step 2: Create Project Initialization Handler

**File to create:** `src/server/handlers/initProject.ts`

**Action:** Create this new file with the following content:

```typescript
import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';

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

  logger.info(`Initializing ${projectType} project for client ${clientId}`);

  try {
    // Execute the project creation command
    const { resultPromise } = executeCommand(config.command, workingDirectory);
    const result = await resultPromise;

    if (!result.success) {
      res.status(500).json({ 
        error: 'Project initialization failed', 
        output: result.output 
      });
      return;
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

    res.json({ 
      success: true, 
      projectType,
      description: config.description,
      message: `${projectType} project initialized successfully`,
      workingDirectory
    });

  } catch (error) {
    logger.error('Error initializing project', { error, projectType, clientId });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};
```

### Step 3: Create AI Agent Handler

**File to create:** `src/server/handlers/aiAgent.ts`

**Action:** Create this new file:

```typescript
import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';
import { createTask, updateTask, getTaskOutput, setTaskProcess, deleteTaskProcess } from '../../executor/taskManager';

const AIDER_TIMEOUT = 5 * 60 * 1000; // 5 minutes for AI operations

export const handleAIAgent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { prompt, agent = 'aider' } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  // Create a task for tracking
  const task = createTask(`AI Agent: ${prompt}`);
  logger.info(`Created AI agent task ${task.id} for prompt: ${prompt}`);

  try {
    updateTask(task.id, { status: 'running' });

    // Prepare the AI agent command
    let command: string;
    if (agent === 'aider') {
      // Escape the prompt for shell execution
      const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
      command = `aider --yes --no-auto-commits --message '${escapedPrompt}'`;
      
      // Set OpenAI API key if available
      if (process.env.OPENAI_API_KEY) {
        command = `export OPENAI_API_KEY="${process.env.OPENAI_API_KEY}" && ${command}`;
      }
    } else {
      res.status(400).json({ error: 'Unsupported agent type' });
      return;
    }

    const { ptyProcess, resultPromise } = executeCommand(
      command,
      workingDirectory,
      (data: string) => {
        updateTask(task.id, { output: data });
      }
    );

    setTaskProcess(task.id, ptyProcess);

    // Set a timeout for AI operations
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI operation timed out')), AIDER_TIMEOUT);
    });

    const result = await Promise.race([resultPromise, timeoutPromise]);

    updateTask(task.id, {
      status: 'completed',
      exitCode: result.exitCode,
      output: result.output,
    });

    res.json({
      taskId: task.id,
      success: result.success,
      output: result.output,
      message: 'AI agent completed successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    updateTask(task.id, {
      status: 'failed',
      error: errorMessage,
    });

    logger.error('AI agent error', { error: errorMessage, taskId: task.id });
    
    res.status(500).json({ 
      taskId: task.id,
      error: errorMessage 
    });
  } finally {
    deleteTaskProcess(task.id);
  }
};
```

### Step 4: Create Dev Server Handler

**File to create:** `src/server/handlers/devServer.ts`

**Action:** Create this new file:

```typescript
import { Response } from 'express';
import { executeCommand } from '../../executor/commandExecutor';
import { AuthenticatedRequest } from '../middleware/auth';
import { getClientWorkingDirectory } from '../../utils/clientDirectories';
import { logger } from '../../utils/logging';
import * as pty from 'node-pty';

const devServerProcesses = new Map<string, pty.IPty>();

export const handleDevServer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { action = 'start', port } = req.body;
  const clientId = req.agentId as string;

  if (!clientId) {
    res.status(401).json({ error: 'Unauthorized: Missing client ID' });
    return;
  }

  const baseWorkingDirectory = req.app.locals.baseWorkingDirectory;
  const workingDirectory = getClientWorkingDirectory(clientId, baseWorkingDirectory);

  if (action === 'start') {
    // Check if dev server is already running
    if (devServerProcesses.has(clientId)) {
      res.status(400).json({ error: 'Dev server is already running' });
      return;
    }

    try {
      // Detect project type and determine the right command
      const fs = await import('fs/promises');
      const path = await import('path');
      const packageJsonPath = path.join(workingDirectory, 'package.json');
      
      let devCommand = 'npm run dev';
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};
        
        if (scripts.dev) {
          devCommand = 'npm run dev';
        } else if (scripts.start) {
          devCommand = 'npm start';
        } else if (scripts.serve) {
          devCommand = 'npm run serve';
        }
        
        // Set port if specified
        if (port) {
          devCommand = `PORT=${port} ${devCommand}`;
        }
      } catch (error) {
        logger.warn('Could not read package.json, using default command');
      }

      const { ptyProcess } = executeCommand(devCommand, workingDirectory, (data) => {
        logger.info(`Dev server output for ${clientId}: ${data}`);
      });

      devServerProcesses.set(clientId, ptyProcess);

      res.json({ 
        success: true,
        action: 'started',
        command: devCommand,
        message: 'Dev server started successfully'
      });

    } catch (error) {
      logger.error('Error starting dev server', { error, clientId });
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to start dev server' 
      });
    }

  } else if (action === 'stop') {
    const process = devServerProcesses.get(clientId);
    
    if (!process) {
      res.status(400).json({ error: 'No dev server is running' });
      return;
    }

    try {
      process.kill();
      devServerProcesses.delete(clientId);
      
      res.json({ 
        success: true,
        action: 'stopped',
        message: 'Dev server stopped successfully'
      });
    } catch (error) {
      logger.error('Error stopping dev server', { error, clientId });
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to stop dev server' 
      });
    }

  } else if (action === 'status') {
    const isRunning = devServerProcesses.has(clientId);
    
    res.json({ 
      running: isRunning,
      message: isRunning ? 'Dev server is running' : 'Dev server is not running'
    });

  } else {
    res.status(400).json({ error: 'Invalid action. Use: start, stop, or status' });
  }
};
```

### Step 5: Update API Server Routes

**File to modify:** `src/server/apiServer.ts`

**Action:** Add these imports at the top (after existing imports):

```typescript
import { handleInitProject } from './handlers/initProject';
import { handleAIAgent } from './handlers/aiAgent';
import { handleDevServer } from './handlers/devServer';
```

**Action:** Add these routes after the existing protected routes (around line 33):

```typescript
  // DevAtelier-specific routes
  app.post('/init-project', authenticateRequest, handleInitProject);
  app.post('/ai-agent', authenticateRequest, handleAIAgent);
  app.post('/dev-server', authenticateRequest, handleDevServer);
```

### Step 6: Update Environment Variables

**File to modify:** `.env.example`

**Action:** Add these lines at the end:

```env
# AI Agent Configuration
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# DevAtelier Settings
PROJECT_NAME=devatelier
DEFAULT_PROJECT_TYPE=nextjs
```

### Step 7: Update docker-compose.yml

**File to modify:** `docker-compose.yml`

**Action:** Replace the entire file with:

```yaml
version: '3.8'

services:
  devatelier:
    build: .
    ports:
      - "8080:8080"    # API server
      - "3000:3000"    # Next.js/React dev server
      - "4000:4000"    # Node.js app port
      - "5173:5173"    # Vite dev server
    env_file: .env
    environment:
      - NODE_ENV=production
      - PORT=8080
      - WORKING_DIRECTORY=/data/workspace
      - AGENT_NAME=${AGENT_NAME:-devatelier}
      - AGENT_ID=${AGENT_ID}
      - API_KEY=${API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./workspace:/data/workspace
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    labels:
      - "com.devatelier.description=AI-powered development workspace"
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`${DOMAIN:-localhost}`)"
      - "traefik.http.services.api.loadbalancer.server.port=8080"
```

### Step 8: Create Test Script

**File to create:** `test-devatelier.sh`

**Action:** Create this file in the project root:

```bash
#!/bin/bash

echo "🧪 Testing DevAtelier Implementation"
echo "===================================="

# Set test variables
API_KEY=${API_KEY:-"test-key-123"}
BASE_URL="http://localhost:8080"

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .

echo -e "\n2. Testing project initialization..."
api_call POST "/init-project" '{"projectType": "nextjs"}' | jq .

echo -e "\n3. Testing AI agent..."
api_call POST "/ai-agent" '{"prompt": "Create a simple Hello World component"}' | jq .

echo -e "\n4. Testing dev server start..."
api_call POST "/dev-server" '{"action": "start"}' | jq .

echo -e "\n5. Testing dev server status..."
api_call POST "/dev-server" '{"action": "status"}' | jq .

echo -e "\n✅ All tests completed!"
```

**Action:** Make it executable:
```bash
chmod +x test-devatelier.sh
```

### Step 9: Build and Test

Run these commands in order:

```bash
# 1. Build the Docker image
docker build -t devatelier:latest .

# 2. Start the container
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. In a new terminal, run tests
./test-devatelier.sh
```

### Step 10: Verify AI Agent Works

Test the AI agent with a real command:

```bash
# Create a Next.js project
curl -X POST http://localhost:8080/init-project \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"projectType": "nextjs"}'

# Ask AI to create a component
curl -X POST http://localhost:8080/ai-agent \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a responsive navigation bar component with Home, About, and Contact links. Use Tailwind CSS for styling."}'

# Start the dev server
curl -X POST http://localhost:8080/dev-server \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Check if app is running
curl http://localhost:3000
```

## Success Criteria

You have successfully transformed TerminalTurtle into DevAtelier when:

1. ✅ Docker image builds without errors
2. ✅ Container starts and health check passes
3. ✅ Can initialize Next.js/React/Node projects via API
4. ✅ AI agent (Aider) can receive prompts and modify code
5. ✅ Dev server can be started/stopped via API
6. ✅ Multiple ports are exposed (8080, 3000, 4000, 5173)
7. ✅ All test scripts pass

## Troubleshooting

If you encounter issues:

1. **Aider not found**: Check if Python venv was created properly in Docker image
2. **Port conflicts**: Ensure no other services are using ports 8080, 3000
3. **Permission errors**: Verify the node user has proper permissions
4. **API errors**: Check docker logs with `docker-compose logs`

## Next Steps

After successful implementation:

1. Push to a new repository named 'devatelier'
2. Create Docker Hub image
3. Deploy to Coolify with subdomain routing
4. Test with real AI development tasks

Good luck! 🚀