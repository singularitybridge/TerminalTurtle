#!/bin/bash
set -e

echo "Starting TerminalTurtle with Code Editor..."

# Start the API server in background
cd /app
node dist/main.js &
API_PID=$!

# Generate password for code-server if not set
if [ -z "$EDITOR_PASSWORD" ]; then
    EDITOR_PASSWORD=$(openssl rand -hex 16)
    echo "Generated editor password: $EDITOR_PASSWORD"
fi

# Update code-server config with password
mkdir -p /root/.config/code-server
cat > /root/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8443
auth: password
password: $EDITOR_PASSWORD
cert: false
EOF

# Start code-server in background with explicit port
echo "Starting code-server on port 8443..."
# Unset PORT to avoid conflict with main app
env -u PORT code-server /data/workspace --bind-addr 0.0.0.0:8443 --auth none &
EDITOR_PID=$!

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

echo "============================================"
echo "TerminalTurtle is ready!"
echo "API Server: http://localhost:$PORT"
echo "Code Editor: http://localhost:$PORT/editor?key=YOUR_API_KEY"
echo "Editor Password: $EDITOR_PASSWORD"
echo "============================================"

# Keep the container running
wait $API_PID