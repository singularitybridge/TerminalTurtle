# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Terminal Turtle is a multi-instance development environment system that spawns isolated Docker containers with integrated VS Code web editors. Each "turtle" is a complete development environment with its own container, ports, and workspace.

## Recent Updates (2025-08-09)

- Renamed project from DevAtelier to Terminal Turtle
- Fixed Docker caching issues with unique image names per turtle
- Added code editor URL to `turtle info` command output
- Implemented automatic code-server startup with no authentication
- Fixed Vite/React dev dependencies installation with NODE_ENV=development
- Removed unused root docker-compose.yml (each turtle has its own)
- Made AGENT_ID optional - not needed for one-turtle-per-container design
- **Refactored all environment variables for clarity:**
  - `PORT` → `TURTLE_API_PORT` (Terminal Turtle control API)
  - `DEV_PORT` & `NODE_PORT` → `APP_PORT` (unified for any app type)
  - `API_KEY` → `TURTLE_API_KEY` (authentication key)
  - `EDITOR_PORT` remains (already clear)
- Removed all backward compatibility (no legacy support needed)

## Development Commands

### Build and Run
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run in production mode (requires build)
npm start

# Run in development mode with hot reload
npm run dev

# Generate API credentials
npm run generate-credentials
```

### Testing and Linting
```bash
# Run all tests
npm test

# Run tests for a specific file
npm test path/to/file.test.ts

# Run ESLint
npm run lint
```

## Turtle System Commands

### Main Commands
```bash
# Spawn a new turtle
./turtle spawn <port> <template> <name>  # template: vite, react, or express

# Manage turtles
./turtle list                # List all turtles
./turtle info <name>          # Show detailed info with all URLs
./turtle start <name>         # Start a turtle
./turtle stop <name>          # Stop a turtle
./turtle restart <name>       # Restart a turtle
./turtle logs <name>          # View logs
./turtle kill <name>          # Destroy a turtle
./turtle clean                # Clean up stopped turtles
```

## Architecture Overview

TerminalTurtle is a multi-instance development environment system. Each turtle is an isolated Docker container with its own:
- Docker image: `terminal-turtle-<name>`
- Docker Compose configuration in `instances/<name>/docker-compose.yml`
- Workspace volume at `instances/<name>/workspace/`
- Environment configuration in `instances/<name>/.env`
- Startup scripts for initialization

### Port Architecture
Each turtle uses three distinct ports with clear naming:
- **TURTLE_API_PORT**: Terminal Turtle control API (execute commands, file operations)
- **APP_PORT**: Your application (Vite dev server, React dev server, or Express app)
- **EDITOR_PORT**: VS Code web editor (code-server on port 8443 internally)

The architecture follows a modular design:

### Core Components

1. **API Server** (`src/server/apiServer.ts`): Express-based REST API server with authentication middleware
   - All protected endpoints require Bearer token authentication via API_KEY
   - Supports per-client working directory management

2. **Command Execution** (`src/executor/commandExecutor.ts`): Uses node-pty for proper terminal emulation
   - Executes commands in isolated pty sessions with 5-minute timeout
   - Supports streaming output and ANSI color stripping
   - Returns exit codes and handles timeouts gracefully

3. **Task Management** (`src/executor/taskManager.ts`): Async task tracking system
   - Tasks run in background with unique IDs
   - Supports status polling and manual task termination
   - Output is chunked with 1MB size limit per task

4. **File Operations** (`src/executor/fileManager.ts`): Secure file system operations
   - All operations are sandboxed within the configured working directory
   - Supports recursive directory listing and file manipulation

5. **Client Directory Management** (`src/utils/clientDirectories.ts`): Per-client isolation
   - Uses AGENT_NAME or 'default' as client identifier (AGENT_ID is optional)
   - Each client can have its own working directory within the container
   - Path sanitization prevents directory traversal attacks

### Security Features

- API key authentication required for all operations
- Working directory sandboxing prevents access outside base directory
- Command timeout prevents resource exhaustion
- Path traversal protection in file operations
- Environment variable isolation

### Key Endpoints

- `POST /execute`: Runs commands synchronously with streaming output
- `POST /file-operation`: File CRUD operations (list, read, write, delete)
- `GET /tasks`: List all running/completed tasks
- `GET /tasks/:id`: Get task status and output
- `POST /tasks/:id/end`: Terminate a running task
- `POST /change-directory`: Change client's working directory

### Configuration

The application uses environment variables (via .env file or system):
- `TURTLE_API_PORT`: Terminal Turtle API port (default: 3000)
- `APP_PORT`: Application port for your project (Vite/React/Express)
- `EDITOR_PORT`: VS Code web editor port (default: 4433)
- `WORKING_DIRECTORY`: Base working directory (default: ./working_directory)
- `TURTLE_API_KEY`: Required authentication key for API access
- `AGENT_NAME`: Optional instance name (default: 'terminal-turtle')
- `PROJECT_TEMPLATE`: Template type (vite, react, or express)
- `AUTO_START_DEV_SERVER`: Auto-start dev server on launch (default: true)

## Deployment

### Coolify/Hetzner Deployment
The project includes deployment files in `deploy/`:
- `docker-compose.coolify.yml`: Coolify-compatible compose file
- `.env.coolify.example`: Environment template for Coolify
- `DEPLOY_COOLIFY.md`: Detailed deployment instructions

Important: Avoid ports 80, 443, 6001, 6002 (used by Coolify). Use ports 3000-9999.
