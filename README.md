# 🐢 Terminal Turtle

A powerful multi-instance terminal automation and development environment system that spawns isolated Docker containers with integrated VS Code web editors, development servers, and API endpoints.

## 🚀 Quick Start

```bash
# Spawn a new turtle with Vite + React
./turtle spawn 3000 vite my-app

# Spawn another turtle with Express.js
./turtle spawn 3100 express api-server

# List all turtles
./turtle list

# Get info about a specific turtle
./turtle info my-app
```

## 📋 Features

- **🚀 Multi-Instance Support**: Run multiple isolated development environments simultaneously
- **📝 VS Code Web Editor**: Each turtle includes a browser-based VS Code editor
- **📦 Template Support**: Pre-configured templates for Vite, React, and Express projects
- **🔌 Clear Port Management**: Descriptive port names (TURTLE_API_PORT, APP_PORT, EDITOR_PORT)
- **🔒 Secure API Integration**: REST API with TURTLE_API_KEY authentication
- **🐳 Container Isolation**: Each turtle runs in its own Docker container
- **♻️ Hot Reload**: Development servers with automatic reloading
- **🛠️ Terminal Automation**: Execute commands and manage files remotely

## 🏗️ Architecture

Each turtle is a completely isolated environment with:
- Its own Docker image (`terminal-turtle-<name>`)
- Dedicated container with unique ports
- Isolated workspace volume
- Integrated code-server (VS Code in browser)
- Development server (Vite/React/Express)
- REST API for remote control

### Port Mapping Pattern
- **Turtle API**: Base port (e.g., 3000) - Terminal Turtle control API
- **Application**: Base port + 100 (e.g., 3100) - Your app (Vite/React/Express)
- **Code Editor**: Base port + 1433 (e.g., 4433) - VS Code web interface

## 📦 Installation

### Prerequisites
- Docker Desktop installed and running
- Bash shell (macOS/Linux)
- Node.js and npm (for building)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd TerminalTurtle

# Install dependencies
npm install

# Build TypeScript
npm run build

# Generate API credentials (optional - auto-generated on spawn)
npm run generate-credentials
```

## 🎮 Turtle CLI Commands

### Spawn a New Turtle
```bash
./turtle spawn <port> <template> [name]

# Examples:
./turtle spawn 3000 vite my-vite-app
./turtle spawn 3100 react my-react-app
./turtle spawn 3200 express my-api
```

**Templates:**
- `vite` - Vite + React + TypeScript
- `react` - Create React App + TypeScript
- `express` - Express.js + TypeScript

### Manage Turtles
```bash
# List all turtles
./turtle list

# Get detailed info (includes all URLs)
./turtle info <name>

# Start/stop/restart
./turtle start <name>
./turtle stop <name>
./turtle restart <name>

# View logs
./turtle logs <name>

# Destroy a turtle
./turtle kill <name>

# Clean up stopped turtles
./turtle clean
```

### Access Services

After spawning a turtle, you'll get URLs for:
1. **📝 Code Editor**: `http://localhost:<editor-port>` - VS Code in your browser
2. **🌐 Dev Server**: `http://localhost:<dev-port>` - Your running application
3. **🔌 API**: `http://localhost:<api-port>` - REST API for automation

## 🛠️ API Endpoints

Each turtle exposes a REST API for automation:

### Authentication
All API endpoints require Bearer token authentication:
```bash
-H "Authorization: Bearer <api-key>"
```

### Execute Commands
```bash
curl -X POST http://localhost:3000/execute \
  -H "Authorization: Bearer <your-turtle-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"command": "npm install axios"}'
```

### File Operations
```bash
# List files
curl -X POST http://localhost:3000/file-operation \
  -H "Authorization: Bearer <your-turtle-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"operation": "list", "path": "/", "recursive": true}'

# Read file
curl -X POST http://localhost:3000/file-operation \
  -H "Authorization: Bearer <your-turtle-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"operation": "read", "path": "/src/App.tsx"}'

# Write file
curl -X POST http://localhost:3000/file-operation \
  -H "Authorization: Bearer <your-turtle-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"operation": "write", "path": "/src/test.js", "content": "console.log(\"test\");"}'
```

### Task Management
```bash
# List all tasks
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer <your-turtle-api-key>"

# Get task status
curl -X GET http://localhost:3000/tasks/<task-id> \
  -H "Authorization: Bearer <your-turtle-api-key>"

# End a task
curl -X POST http://localhost:3000/tasks/<task-id>/end \
  -H "Authorization: Bearer <your-turtle-api-key>"
```

## 🐚 Advanced Usage

### Connect with Aider (AI Pair Programming)
```bash
./turtle aider <name>
```

### Remote Turtles
```bash
# Add a remote turtle
./turtle remote add prod https://api.example.com your-api-key

# Execute commands remotely
./turtle remote exec prod "npm run build"

# View remote logs
./turtle remote logs prod
```

### Direct Container Access
```bash
# SSH into container
docker exec -it <turtle-name> bash

# Run commands directly
./turtle exec <name> npm test
```

## 📁 Project Structure

```
TerminalTurtle/
├── turtle                  # Main CLI script
├── spawn-turtle-v3.sh      # Turtle spawning logic
├── Dockerfile              # Container image definition
├── src/                    # TypeScript source code
│   ├── server/            # Express API server
│   │   ├── apiServer.ts   # Main server setup
│   │   ├── middleware/    # Auth middleware
│   │   └── handlers/      # Request handlers
│   ├── executor/          # Command execution
│   │   ├── commandExecutor.ts
│   │   ├── taskManager.ts
│   │   └── fileManager.ts
│   └── utils/             # Utilities
│       ├── logging.ts
│       ├── credentials.ts
│       └── clientDirectories.ts
├── templates/              # Project templates
│   ├── init-vite.sh
│   ├── init-react.sh
│   ├── init-express.sh
│   └── startup-with-editor.sh
└── instances/              # Running turtle instances
    └── <turtle-name>/      # Each turtle's directory
        ├── docker-compose.yml
        ├── instance-info.json
        ├── .env
        ├── workspace/      # Project files
        ├── startup.sh      # Container startup
        └── init-project.sh # Template initialization
```

## 🔧 Configuration

### Environment Variables
Each turtle gets its own `.env` file with:
```env
# API Configuration
TURTLE_API_KEY=<auto-generated>
TURTLE_API_PORT=<api-port>
APP_PORT=<app-port>
EDITOR_PORT=<editor-port>
WORKING_DIRECTORY=/data/workspace

# Template Configuration
PROJECT_TEMPLATE=<vite|react|express>
AGENT_NAME=<instance-name>

# Optional: AI Integration
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 🐛 Troubleshooting

### Port Already in Use
Each turtle needs unique ports. If you get a port conflict error, choose different base ports that are at least 100 apart.

### Docker Build Cache Issues
The system uses `--build` flag to ensure fresh builds. If you still have issues:
```bash
# Clear Docker cache
docker system prune --all

# Rebuild specific turtle
cd instances/<turtle-name>
docker-compose build --no-cache
docker-compose up -d
```

### Code Editor Not Loading
1. Ensure port (base + 1433) is not blocked by firewall
2. Check Docker Desktop is running
3. Verify container started correctly: `./turtle logs <name>`
4. Check code-server status: `docker exec <name> ps aux | grep code-server`

### Dev Server Not Starting
For Vite/React projects, initialization takes 1-2 minutes. Monitor progress:
```bash
./turtle logs <name>
# or
cd instances/<name> && docker-compose logs -f
```

## 🔒 Security

- Each turtle runs in an isolated Docker container
- API endpoints require Bearer token authentication
- Working directories are sandboxed
- Path traversal protection enabled
- Command execution timeout (5 minutes default)
- Per-client directory isolation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Setup
```bash
# Install dev dependencies
npm install

# Run TypeScript in watch mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with Node.js, TypeScript, and Express
- Code editor powered by [code-server](https://github.com/coder/code-server)
- Terminal emulation via [node-pty](https://github.com/microsoft/node-pty)
- Container orchestration with Docker

## 📚 Documentation

For more detailed documentation, see:
- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [Contributing Guide](CONTRIBUTING.md)