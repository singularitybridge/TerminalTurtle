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

2. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   This script will:
   - Create a .env file if it doesn't exist
   - Generate API credentials (AGENT_ID and API_KEY) if they don't exist
   - Update the .env file with the credentials
   - Start the Docker container

3. **Access the application:**
   The application will be available at `http://localhost:8080`

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

3. **Generate credentials:**
   ```bash
   npm run generate-credentials
   ```

4. **Run the application:**
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

# API Credentials
AGENT_ID=                 # Generated automatically by deploy.sh or npm run generate-credentials
API_KEY=                  # Generated automatically by deploy.sh or npm run generate-credentials

# Ngrok Configuration
ENABLE_NGROK=false       # Set to 'true' to enable ngrok tunneling
NGROK_AUTHTOKEN=         # Your ngrok auth token (required if ENABLE_NGROK=true)
```

### API Authentication

The API requires authentication using an API key. The API key is automatically generated and stored in the `.env` file when you run the `deploy.sh` script or use the `npm run generate-credentials` command. You'll need to include this API key in the `Authorization` header of your requests:

```
Authorization: Bearer YOUR_API_KEY
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

# Generate credentials
npm run generate-credentials

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
