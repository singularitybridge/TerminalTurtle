# AI Agent Executor

The AI Agent Executor is a secure, containerized environment that allows an AI agent to execute commands and manage files on a user's device. This system provides a controlled interface for AI agents to perform tasks such as cloning repositories, installing dependencies, running scripts, and managing files, all while maintaining strict security measures.

## Features

- Command Execution: Execute whitelisted shell commands
- File Management: List, create, read, and update files and directories
- Code Execution: Allow AI agent to write code to files and execute them
- Security: Run operations within a Docker container with command whitelisting and secure file access controls
- REST API: Expose functionality through a RESTful API
- Configuration: Use environment variables for setup and sensitive information

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-agent-executor.git
   cd ai-agent-executor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `config/.env.example` to `.env`
   - Fill in the required values in `.env`

4. Build the project:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

## Usage

The AI Agent Executor now uses a REST API for communication. Here are some example operations:

1. Execute a command:
   ```bash
   curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -d '{"command": "git clone https://github.com/example/repo.git"}'
   ```

2. List files in a directory:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "list", "path": "./repo"}'
   ```

3. Read a file:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "read", "path": "./repo/README.md"}'
   ```

4. Write to a file:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "write", "path": "./repo/script.ts", "content": "console.log(\"Hello, World!\");"}'
   ```

5. Execute a script:
   ```bash
   curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -d '{"command": "node ./repo/script.ts"}'
   ```

6. Stop execution:
   ```bash
   curl -X POST http://localhost:3000/stop-execution
   ```

## Security

- All operations run within a Docker container
- Commands are whitelisted
- File access is controlled and limited to a specific working directory
- Authentication is required to access the API (implement this using middleware)
- Rate limiting should be implemented to prevent abuse

## Testing

Run the test suite:
```
npm test
```

## License

[MIT License](LICENSE)