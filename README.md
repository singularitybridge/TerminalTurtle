# 🐢 TerminalTurtle

TerminalTurtle is an open-source developer tool that provides secure terminal automation and remote command execution capabilities. It's designed to be easy to use, secure, and flexible for modern development workflows.

## 🚀 Features

- **🔒 Secure Command Execution**: Execute shell commands with output capture and proper security controls
- **📁 File Management**: List, create, read, update, and delete files with ease
- **🛠️ Code Execution**: Write and execute code through a clean API interface
- **🌐 REST API**: Modern RESTful API for all operations
- **⚙️ Easy Configuration**: Simple environment variable setup
- **🗂️ Recursive File Operations**: Comprehensive file system operations
- **🐳 Docker Support**: Ready-to-use Docker and Docker Compose setup
- **🖥️ Per-Client Working Directory**: Maintain separate working directories for each client

## 🏁 Quick Start

[... existing content ...]

## 🔧 Configuration

[... existing content ...]

## 📡 API Usage

### Command Execution

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"command": "echo Hello World"}'
```

### File Operations

```bash
# List files
curl -X POST http://localhost:8080/file-operation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"operation": "list", "path": "./", "recursive": true}'

# Read file
curl -X POST http://localhost:8080/file-operation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"operation": "read", "path": "./README.md"}'

# Write file
curl -X POST http://localhost:8080/file-operation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"operation": "write", "path": "./test.txt", "content": "Hello!"}'
```

### Change Working Directory

```bash
curl -X POST http://localhost:8080/change-directory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"newPath": "path/to/new/directory"}'
```

## 🖥️ Per-Client Working Directory Management

TerminalTurtle now supports per-client working directory management. This feature allows each client to have its own working directory, which persists across multiple command executions.

Key points:
- Each client (identified by their API key) has its own working directory.
- The working directory can be changed using the `/change-directory` endpoint.
- All file operations and command executions for a client will use their specific working directory.
- If a client hasn't set a working directory, the base working directory is used.

Usage:
1. Change the working directory using the `/change-directory` endpoint.
2. Execute commands or perform file operations as usual - they will now use the new working directory.
3. The working directory persists across multiple requests for the same client.

Security note: Clients can only set working directories within the base working directory specified in the server configuration.

[... rest of the existing content ...]
