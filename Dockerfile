# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set default environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    WORKING_DIRECTORY=/data/workspace \
    AGENT_NAME=default-agent

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create and set permissions for workspace directory
RUN mkdir -p /data/workspace && \
    chown -R node:node /data/workspace

# Set ownership of /app to node
RUN chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main.js"]
