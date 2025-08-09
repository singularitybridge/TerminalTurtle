# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 build-essential git && \
    rm -rf /var/lib/apt/lists/*

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

# Install code-server for web-based VS Code
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    mkdir -p /root/.config/code-server && \
    # Create default config
    echo 'bind-addr: 0.0.0.0:8443\n\
auth: password\n\
password: changeme\n\
cert: false' > /root/.config/code-server/config.yaml

# Set default environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    WORKING_DIRECTORY=/data/workspace \
    AGENT_NAME=terminal-turtle

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create workspace directory
RUN mkdir -p /data/workspace

# Document the ports being exposed
EXPOSE 8080 3000 4000 5173

# Health check to ensure service is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]

# Build-time metadata
LABEL org.opencontainers.image.title="Terminal Turtle" \
      org.opencontainers.image.description="Secure terminal automation tool" \
      org.opencontainers.image.source="https://github.com/yourusername/terminal-turtle"
