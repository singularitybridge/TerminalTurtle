# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

TerminalTurtle is a secure terminal automation tool built with TypeScript and Express. The architecture follows a modular design:

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
   - Each API key gets its own working directory
   - Automatic cleanup of inactive directories after 24 hours
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
- `PORT`: Server port (default: 3000)
- `WORKING_DIRECTORY`: Base working directory (default: ./working_directory)
- `API_KEY`: Required authentication key
- `AGENT_ID`: Optional agent identifier
- `AGENT_NAME`: Optional agent name
