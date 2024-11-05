# Build stage
FROM node:20-slim AS builder

WORKDIR /app

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

# Install curl and ngrok in a single layer for efficiency
RUN apt-get update && \
    apt-get install -y curl wget unzip && \
    wget -q -O /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-stable-linux-amd64.zip && \
    unzip /tmp/ngrok.zip -d /usr/local/bin && \
    rm /tmp/ngrok.zip && \
    rm -rf /var/lib/apt/lists/*

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

# Create and set permissions for workspace directory
RUN mkdir -p /data/workspace && \
    chown -R node:node /data/workspace

# Set ownership of /app to node user
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Document the port being exposed
EXPOSE 8080

# Health check to ensure service is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]

# Build-time metadata
LABEL org.opencontainers.image.title="TerminalTurtle" \
      org.opencontainers.image.description="A developer-friendly tool for secure terminal automation" \
      org.opencontainers.image.source="https://github.com/singularitybridge/TerminalTurtle" \
      org.opencontainers.image.licenses="MIT"
