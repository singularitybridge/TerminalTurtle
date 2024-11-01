# AI Agent Executor

The AI Agent Executor is an environment that allows an AI agent to execute commands and manage files on a user's device. This system provides an interface for AI agents to perform tasks such as cloning repositories, installing dependencies, running scripts, and managing files, mimicking the behavior of a human developer using shell or SSH access.

**Note:** For testing purposes, security restrictions have been relaxed to allow full command execution and directory access. **These changes should not be used in a production environment.** Proper security measures must be re-implemented before deploying this system to users.

## Features

- **Command Execution**: Execute shell commands synchronously with output capture.
- **File Management**: List, create, read, update, and delete files and directories.
- **Code Execution**: Allow AI agent to write code to files and execute them.
- **REST API**: Expose functionality through a RESTful API.
- **Configuration**: Use environment variables for setup and sensitive information.
- **Recursive File Listing**: Support for listing files and directories recursively.

## Project Structure

```
ai-agent-executor/
├── .env.example
├── src/
│   ├── executor/
│   │   ├── commandExecutor.ts
│   │   └── fileManager.ts
│   ├── server/
│   │   └── apiServer.ts
│   ├── utils/
│   │   ├── logging.ts
│   │   └── security.ts
│   └── main.ts
├── tests/
│   ├── apiServer.test.ts
│   ├── commandExecutor.test.ts
│   └── fileManager.test.ts
├── .gitignore
├── Dockerfile
├── jest.config.js
├── package.json
├── package-lock.json
├── README.md
├── requirements.txt
└── tsconfig.json
```

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/ai-agent-executor.git
   cd ai-agent-executor
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Copy `.env.example` to `.env` in the root directory
   - Fill in the required values in `.env`:

     ```
     PORT=3001
     WORKING_DIRECTORY=/path/to/your/working/directory
     AUTH_TOKEN=your_auth_token
     ```

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Start the server:**

   ```bash
   npm start
   ```

## Usage

### Executing Commands

Send a POST request to `/execute` with the command you want to run.

**Example:**

```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "echo Hello World"}'
```

**Sample Response:**

```json
{
  "result": {
    "stdout": "Hello World\n",
    "stderr": "",
    "exitCode": 0
  }
}
```

### Changing Directories

The AI agent can change the current working directory using the `cd` command.

**Example:**

```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "cd /path/to/dir"}'
```

**Sample Response:**

```json
{
  "result": "Changed directory to /path/to/dir"
}
```

### File Operations

The AI Agent Executor uses a REST API for file operations. Send a POST request to `/file-operation` with the desired operation and parameters.

#### Supported Operations:

- `list`: List files in a directory (supports recursive listing).
- `read`: Read the contents of a file.
- `write`: Write content to a file (creates if it doesn't exist).
- `createFile`: Create a new file with content.
- `update`: Update an existing file (with 'overwrite' or 'append' mode).
- `deleteFile`: Delete a file.
- `createDir`: Create a new directory.
- `deleteDirectory`: Delete a directory.
- `checkExistence`: Check if a file or directory exists.

#### Examples:

1. **List Files in a Directory (Recursively)**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "list", "path": "./", "recursive": true}'
   ```

2. **Read a File**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "read", "path": "./README.md"}'
   ```

3. **Write to a File**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "write", "path": "./newfile.txt", "content": "Hello, World!"}'
   ```

4. **Update a File**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{
           "operation": "update",
           "path": "./newfile.txt",
           "content": "\nAppended text.",
           "mode": "append"
         }'
   ```

5. **Create a Directory**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "createDir", "path": "./newdir"}'
   ```

6. **Check if a File Exists**

   ```bash
   curl -X POST http://localhost:3001/file-operation \
     -H "Content-Type: application/json" \
     -d '{"operation": "checkExistence", "path": "./newfile.txt"}'
   ```

## Error Handling

The API includes robust error handling:

- If a file or directory is not found, a `404 Not Found` status code is returned.
- For other errors, a `500 Internal Server Error` status code is returned with an error message.
- Detailed error logs are maintained on the server side for debugging purposes.

## Security

**Important:** For testing purposes, security restrictions have been relaxed to allow full command execution and directory access. **These changes are not safe for production use.** Proper security measures must be re-implemented before deploying this system to users.

- **Directory Access**: Operations run without strict directory access controls.
- **Command Execution**: Command whitelisting is disabled to allow all commands.
- **Authentication and Rate Limiting**: Authentication and rate limiting mechanisms are bypassed.
- **Caution**: Be extremely cautious when running untrusted commands or code.

## Development

The project is written in TypeScript and uses Node.js. It's configured with `tsconfig.json` for TypeScript compilation.

For development purposes, you can use the following npm scripts:

- `npm run dev`: Start the server using `ts-node` for development with hot-reloading.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Run the compiled JavaScript.
- `npm run lint`: Run ESLint to check for code style issues.
- `npm test`: Run the Jest test suite.

### Example:

```bash
npm run dev
```

## Testing

The project uses Jest for testing. Run the test suite with:

```bash
npm test
```

Test files are located in the `tests/` directory and follow the naming convention `*.test.ts`.

The test suite covers all major functionalities including:
- Command execution with output capture
- File operations (list, read, write, create, update, delete, check existence)
- API endpoints

Each component (commandExecutor, fileManager, apiServer) has its own dedicated test file with comprehensive test cases.

## License

[MIT License](LICENSE)

---

**Note to Developers:**

- This project is currently set up to mimic a human developer's behavior for testing and development purposes.
- Make sure to re-implement proper security measures, including command whitelisting, secure authentication, directory access controls, input sanitization, and rate limiting before considering any production deployment.
- Always be cautious and understand the implications of executing code and commands on your machine or server.
