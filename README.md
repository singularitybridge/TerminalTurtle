# 🐢 TerminalTurtle

TerminalTurtle is an open-source developer tool that provides secure terminal automation and remote command execution capabilities. It's designed to be easy to use, secure, and flexible for modern development workflows.

## 🚀 Features

- **🔒 Secure Command Execution**: Execute shell commands with output capture and proper security controls
- **📁 File Management**: List, create, read, update, and delete files with ease
- **🛠️ Code Execution**: Write and execute code through a clean API interface
- **🌐 REST API**: Modern RESTful API for all operations
- **🔗 Optional Public URL**: Configure ngrok integration through environment variables
- **⚙️ Easy Configuration**: Simple environment variable setup
- **🗂️ Recursive File Operations**: Comprehensive file system operations
- **🐳 Docker Support**: Ready-to-use Docker and Docker Compose setup

## 🏁 Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/singularitybridge/TerminalTurtle.git
   cd TerminalTurtle
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings:
   # - Set ENABLE_NGROK=true/false as needed
   # - Add NGROK_AUTHTOKEN if using ngrok
   ```

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

### Local Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/singularitybridge/TerminalTurtle.git
   cd TerminalTurtle
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run the application:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Key environment variables:

```env
# Core Settings
NODE_ENV=development      # 'development' or 'production'
PORT=8080                 # Server port
WORKING_DIRECTORY=/data/workspace
AGENT_NAME=terminal-turtle

# Ngrok Configuration
ENABLE_NGROK=false       # Set to 'true' to enable ngrok tunneling
NGROK_AUTHTOKEN=         # Your ngrok auth token (required if ENABLE_NGROK=true)

# Optional Settings
LOG_LEVEL=info
MAX_FILE_SIZE=10485760   # 10MB in bytes
COMMAND_TIMEOUT=30000    # 30 seconds
```

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

## 🧪 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

While TerminalTurtle provides various security features, please:
- Review and customize security settings before production use
- Keep your API keys secure
- Regularly update dependencies
- Follow security best practices when exposing the service

## 🌟 Support

- 📫 Report issues on [GitHub Issues](https://github.com/singularitybridge/TerminalTurtle/issues)
- 💡 Request features through [GitHub Issues](https://github.com/singularitybridge/TerminalTurtle/issues)
- ⭐ Star us on GitHub if you find this project useful!

---

Built with ❤️ by the SingularityBridge community
