#!/bin/bash

# spawn-turtle-v3.sh - Simplified script with better initialization
# Usage: ./spawn-turtle-v3.sh <port> <template> [instance-name]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if port is provided
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Port number and template required${NC}"
    echo "Usage: $0 <port> <template> [instance-name]"
    echo ""
    echo "Available templates:"
    echo "  react    - React with TypeScript"
    echo "  vite     - Vite with React & TypeScript"
    echo "  express  - Express.js with TypeScript (minimal starter)"
    echo ""
    echo "Example: $0 3004 react myapp"
    exit 1
fi

PORT=$1
TEMPLATE=$2
INSTANCE_NAME=${3:-"turtle-$PORT-$TEMPLATE"}
BASE_DIR=$(dirname "$0")

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1000 ] || [ "$PORT" -gt 65535 ]; then
    echo -e "${RED}Error: Invalid port number. Must be between 1000 and 65535${NC}"
    exit 1
fi

# Validate template
case $TEMPLATE in
    react|vite|express)
        ;;
    *)
        echo -e "${RED}Error: Invalid template '$TEMPLATE'${NC}"
        echo "Available templates: react, vite, express"
        exit 1
        ;;
esac

# Calculate other ports based on the main port
API_PORT=$PORT
DEV_SERVER_PORT=$((PORT + 100))
NODE_APP_PORT=$((PORT + 1100))
VITE_PORT=$((PORT + 2173))
EDITOR_PORT=$((PORT + 200))

echo -e "${BLUE}🐢 Spawning TerminalTurtle instance: ${GREEN}$INSTANCE_NAME${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Template:${NC} $TEMPLATE"
echo -e "${BLUE}API Port:${NC} $API_PORT"
echo -e "${BLUE}Dev Server Port:${NC} $DEV_SERVER_PORT"
echo -e "${BLUE}Node App Port:${NC} $NODE_APP_PORT"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create instance directory
INSTANCE_DIR="$BASE_DIR/instances/$INSTANCE_NAME"
mkdir -p "$INSTANCE_DIR"

# Generate unique API key for this instance
API_KEY=$(openssl rand -hex 32)

# Create instance-specific .env file
cat > "$INSTANCE_DIR/.env" << EOF
# TerminalTurtle Instance: $INSTANCE_NAME
# Template: $TEMPLATE
# Generated on $(date)

NODE_ENV=production
PORT=$API_PORT
WORKING_DIRECTORY=/data/workspace
AGENT_NAME=$INSTANCE_NAME
API_KEY=$API_KEY
AGENT_ID=$(uuidgen || cat /proc/sys/kernel/random/uuid || echo "${INSTANCE_NAME}-$(date +%s)")

# AI Agent Configuration (copy from main .env if exists)
OPENAI_API_KEY=${OPENAI_API_KEY:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}

# Port Configuration
DEV_SERVER_PORT=$DEV_SERVER_PORT
REACT_PORT=$DEV_SERVER_PORT
NODE_APP_PORT=$NODE_APP_PORT
VITE_PORT=$VITE_PORT

# Auto-start Configuration
AUTO_START_DEV_SERVER=true
PROJECT_TEMPLATE=$TEMPLATE
EOF

# Copy AI keys from main .env if it exists
if [ -f "$BASE_DIR/.env" ]; then
    # Extract API keys from main .env
    OPENAI_KEY=$(grep "^OPENAI_API_KEY=" "$BASE_DIR/.env" | cut -d'=' -f2-)
    ANTHROPIC_KEY=$(grep "^ANTHROPIC_API_KEY=" "$BASE_DIR/.env" | cut -d'=' -f2-)
    
    # Update the instance .env with the keys
    if [ ! -z "$OPENAI_KEY" ]; then
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" "$INSTANCE_DIR/.env"
    fi
    if [ ! -z "$ANTHROPIC_KEY" ]; then
        sed -i.bak "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$ANTHROPIC_KEY/" "$INSTANCE_DIR/.env"
    fi
    rm -f "$INSTANCE_DIR/.env.bak"
fi

# Copy initialization script based on template
cp "$BASE_DIR/templates/init-$TEMPLATE.sh" "$INSTANCE_DIR/init-project.sh"
chmod +x "$INSTANCE_DIR/init-project.sh"

# Create startup script for the container with editor support
cat > "$INSTANCE_DIR/startup.sh" << 'EOF'
#!/bin/bash
set -e

echo "Starting TerminalTurtle instance..."

# Start the API server in background
cd /app
node dist/main.js &
API_PID=$!

# Start code-server in background
echo "Starting code-server on port 8443..."
mkdir -p /root/.config/code-server
# Start code-server without PORT env var to avoid conflict, with no auth for easy access
env -u PORT code-server /data/workspace --bind-addr 0.0.0.0:8443 --auth none &
EDITOR_PID=$!
echo "Code editor started (no authentication required)"

# Wait for API to be ready
echo "Waiting for API server to be ready..."
for i in {1..30}; do
    if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
        echo "API server is ready!"
        break
    fi
    echo -n "."
    sleep 1
done

# Check if workspace is empty and needs initialization
if [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then
    echo "Initializing project with template: $PROJECT_TEMPLATE"
    
    # Run initialization script
    /app/init-project.sh
    
    # Start development server
    cd /data/workspace
    case $PROJECT_TEMPLATE in
        react)
            echo "Starting React dev server..."
            BROWSER=none HOST=0.0.0.0 PORT=$DEV_SERVER_PORT npm start &
            ;;
        vite)
            echo "Starting Vite dev server..."
            npm run dev -- --host 0.0.0.0 --port $DEV_SERVER_PORT &
            ;;
        express)
            echo "Starting Express server..."
            NODE_APP_PORT=$NODE_APP_PORT npm run dev &
            ;;
    esac
else
    echo "Workspace already initialized, starting existing project..."
    cd /data/workspace
    
    # Start based on template type
    case $PROJECT_TEMPLATE in
        react)
            BROWSER=none HOST=0.0.0.0 PORT=$DEV_SERVER_PORT npm start &
            ;;
        vite)
            npm run dev -- --host 0.0.0.0 --port $DEV_SERVER_PORT &
            ;;
        express)
            NODE_APP_PORT=$NODE_APP_PORT npm run dev &
            ;;
    esac
fi

# Keep the container running
wait $API_PID
EOF

chmod +x "$INSTANCE_DIR/startup.sh"

# Create instance-specific docker-compose file
cat > "$INSTANCE_DIR/docker-compose.yml" << EOF
services:
  $INSTANCE_NAME:
    build: ../..
    image: terminal-turtle-$INSTANCE_NAME:latest
    container_name: $INSTANCE_NAME
    ports:
      - "$API_PORT:$API_PORT"
      - "$DEV_SERVER_PORT:$DEV_SERVER_PORT"
      - "$NODE_APP_PORT:$NODE_APP_PORT"
      - "$((API_PORT + 1433)):8443"
    env_file: .env
    environment:
      - PORT=$API_PORT
    volumes:
      - ./workspace:/data/workspace
      - ./startup.sh:/app/startup.sh:ro
      - ./init-project.sh:/app/init-project.sh:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:$API_PORT/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    labels:
      - "com.devatelier.instance=$INSTANCE_NAME"
      - "com.devatelier.template=$TEMPLATE"
      - "com.devatelier.port=$PORT"
    command: ["/bin/bash", "/app/startup.sh"]
EOF

# Create workspace directory for this instance
mkdir -p "$INSTANCE_DIR/workspace"

# Create a control script for this instance
cat > "$INSTANCE_DIR/turtle-control.sh" << 'EOF'
#!/bin/bash

# Control script for this TerminalTurtle instance

COMMAND=${1:-help}

case $COMMAND in
    start)
        echo "Starting $INSTANCE_NAME..."
        docker-compose up -d
        ;;
    stop)
        echo "Stopping $INSTANCE_NAME..."
        docker-compose down
        ;;
    restart)
        echo "Restarting $INSTANCE_NAME..."
        docker-compose restart
        ;;
    logs)
        docker-compose logs -f
        ;;
    status)
        docker-compose ps
        ;;
    exec)
        shift
        docker-compose exec $INSTANCE_NAME "$@"
        ;;
    destroy)
        echo "Are you sure you want to destroy this instance? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            docker-compose down -v
            cd ..
            rm -rf "$INSTANCE_NAME"
            echo "Instance destroyed."
        fi
        ;;
    help|*)
        echo "Usage: $0 {start|stop|restart|logs|status|exec|destroy}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the instance"
        echo "  stop     - Stop the instance"
        echo "  restart  - Restart the instance"
        echo "  logs     - Show logs (follow mode)"
        echo "  status   - Show container status"
        echo "  exec     - Execute command in container"
        echo "  destroy  - Destroy instance (removes all data)"
        ;;
esac
EOF

chmod +x "$INSTANCE_DIR/turtle-control.sh"

# Save instance information
cat > "$INSTANCE_DIR/instance-info.json" << EOF
{
  "name": "$INSTANCE_NAME",
  "template": "$TEMPLATE",
  "port": $PORT,
  "api_port": $API_PORT,
  "dev_server_port": $DEV_SERVER_PORT,
  "node_app_port": $NODE_APP_PORT,
  "vite_port": $VITE_PORT,
  "api_key": "$API_KEY",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "workspace": "$INSTANCE_DIR/workspace"
}
EOF

# Start the instance
cd "$INSTANCE_DIR"
echo -e "\n${BLUE}Starting instance...${NC}"
docker-compose up -d --build

# Wait for the service to be ready
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
for i in {1..60}; do
    if curl -s -f "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API service is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Display connection information
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 TerminalTurtle instance spawned successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${BLUE}Instance Information:${NC}"
echo -e "  Name: ${GREEN}$INSTANCE_NAME${NC}"
echo -e "  Template: ${GREEN}$TEMPLATE${NC}"
echo -e "  API Control: ${GREEN}http://localhost:$API_PORT${NC} ${BLUE}(for automation/scripting)${NC}"
echo -e "  API Key: ${GREEN}$API_KEY${NC}"
echo -e "  📝 Code Editor: ${GREEN}http://localhost:$((API_PORT + 1433))${NC} ${BLUE}(VS Code Web - Direct Access)${NC}"
echo -e "  📝 Code Editor (Alt): ${GREEN}http://localhost:$API_PORT/editor?key=$API_KEY${NC} ${BLUE}(Through API Proxy)${NC}"

case $TEMPLATE in
    react|vite)
        echo -e "  🌐 Your App URL: ${GREEN}http://localhost:$DEV_SERVER_PORT${NC} ${BLUE}← Open this in your browser!${NC}"
        echo -e ""
        echo -e "${YELLOW}Note: The $TEMPLATE app is being initialized in the background.${NC}"
        echo -e "${YELLOW}It may take 1-2 minutes to be fully ready.${NC}"
        ;;
    express)
        echo -e "  🌐 Your App URL: ${GREEN}http://localhost:$NODE_APP_PORT${NC} ${BLUE}← Open this in your browser!${NC}"
        echo -e ""
        echo -e "${YELLOW}Note: The Express server is being initialized in the background.${NC}"
        ;;
esac

echo -e ""
echo -e "${BLUE}Control this instance:${NC}"
echo -e "  cd $INSTANCE_DIR"
echo -e "  ./turtle-control.sh {start|stop|restart|logs|status}"
echo -e ""
echo -e "${BLUE}Monitor initialization:${NC}"
echo -e "  cd $INSTANCE_DIR && docker-compose logs -f"
echo -e ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"