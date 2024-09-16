# AI Agent Executor

The AI Agent Executor is a secure, containerized environment that allows an AI agent to execute commands and manage files on a user's device. This system provides a controlled interface for AI agents to perform tasks such as cloning repositories, installing dependencies, running scripts, and managing files, all while maintaining strict security measures.

## Features

- Command Execution: Execute whitelisted shell commands
- File Management: List, create, read, update, and delete files and directories
- Code Execution: Allow AI agent to write code to files and execute them
- Security: Run operations within a Docker container with command whitelisting, input sanitization, and secure file access controls
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
   - Fill in the required values in `.env` (PORT, WORKING_DIRECTORY, AUTH_TOKEN)

4. Build the project:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

## Usage

The AI Agent Executor uses a REST API for communication. Here are some example operations:

1. Execute a command:
   ```bash
   curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"command": "git clone https://github.com/example/repo.git", "working_directory": "/path/to/working/dir"}'
   ```

2. List files in a directory:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "list", "path": "./repo", "recursive": true}'
   ```

3. Read a file:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "read", "path": "./repo/README.md"}'
   ```

4. Write to a file:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "write", "path": "./repo/script.ts", "content": "console.log(\"Hello, World!\");"}'
   ```

5. Create a directory:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "createDir", "path": "./repo/newdir"}'
   ```

6. Update a file:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "update", "path": "./repo/script.ts", "content": "console.log(\"Updated!\");", "mode": "append"}'
   ```

7. Check if a file or directory exists:
   ```bash
   curl -X POST http://localhost:3000/file-operation \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"operation": "checkExistence", "path": "./repo/script.ts"}'
   ```

8. Execute a script:
   ```bash
   curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -d '{"command": "node ./repo/script.ts"}'
   ```

9. Stop execution:
   ```bash
   curl -X POST http://localhost:3000/stop-execution \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN"
   ```

## File Operations

The following file operations are supported:

- `list`: List files in a directory
- `read`: Read the contents of a file
- `write`: Write content to a file (creates if it doesn't exist)
- `createFile`: Create a new file with content
- `update`: Update an existing file (with 'overwrite' or 'append' mode)
- `deleteFile`: Delete a file
- `createDir`: Create a new directory
- `deleteDirectory`: Delete a directory
- `checkExistence`: Check if a file or directory exists

## Error Handling

The API includes robust error handling:

- If a file or directory is not found, a 404 status code is returned.
- For other errors, a 500 status code is returned with an error message.
- Detailed error logs are maintained on the server side for debugging purposes.

## Security

- All operations run within a Docker container
- Commands are whitelisted (git, npm, node, python, pip)
- File access is controlled and limited to a specific working directory
- Input sanitization is implemented to prevent injection attacks
- Authentication is required to access the API (using AUTH_TOKEN)
- Rate limiting is implemented to prevent abuse (100 requests per minute per client)

## Development

For development purposes, you can use the following npm scripts:

- `npm run dev`: Start the server using ts-node for development
- `npm run lint`: Run ESLint to check for code style issues

## Testing

Run the test suite:
```
npm test
```

## License

[MIT License](LICENSE)