#!/bin/bash
set -e

echo "Starting TerminalTurtle with Code Editor..."

# Start the API server in background
cd /app
node dist/main.js &
API_PID=$!

# Configure code-server for no authentication
mkdir -p /root/.config/code-server
cat > /root/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8443
auth: none
cert: false
EOF

# Start code-server in background with explicit port
echo "Starting code-server on port 8443..."
# Use PASSWORD=none for no authentication
PASSWORD=none code-server /data/workspace --bind-addr 0.0.0.0:8443 --auth none &
EDITOR_PID=$!

# Wait for API to be ready
echo "Waiting for API server to be ready..."
for i in {1..30}; do
    if curl -s -f "http://localhost:${TURTLE_API_PORT:-3000}/health" > /dev/null 2>&1; then
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
    
    # Start development server with hot reload support
    cd /data/workspace
    if [ "${DISABLE_HOT_RELOAD}" = "true" ]; then
        echo "Hot reload is disabled, using production start scripts..."
        case $PROJECT_TEMPLATE in
            react)
                echo "Starting React server (no hot reload)..."
                BROWSER=none HOST=0.0.0.0 PORT=${APP_PORT:-3100} npm start &
                ;;
            vite)
                echo "Building and starting Vite server (no hot reload)..."
                npm run build && npm run preview -- --host 0.0.0.0 --port ${APP_PORT:-3100} &
                ;;
            express)
                echo "Starting Express server (no hot reload)..."
                NODE_APP_PORT=${APP_PORT:-3100} npm start &
                ;;
        esac
    else
        echo "Hot reload is enabled (default)..."
        case $PROJECT_TEMPLATE in
            react)
                echo "Starting React dev server with hot reload..."
                BROWSER=none HOST=0.0.0.0 PORT=${APP_PORT:-3100} npm start &
                ;;
            vite)
                echo "Starting Vite dev server with hot reload..."
                npm run dev -- --host 0.0.0.0 --port ${APP_PORT:-3100} &
                ;;
            express)
                echo "Starting Express server with nodemon hot reload..."
                NODE_APP_PORT=${APP_PORT:-3100} npm run dev &
                ;;
        esac
    fi
else
    echo "Workspace already initialized, starting existing project..."
    cd /data/workspace
    
    # Start based on template type with hot reload support
    # Check if hot reload is disabled (defaults to enabled)
    if [ "${DISABLE_HOT_RELOAD}" = "true" ]; then
        echo "Hot reload is disabled, using production start scripts..."
        case $PROJECT_TEMPLATE in
            react)
                BROWSER=none HOST=0.0.0.0 PORT=${APP_PORT:-3100} npm start &
                ;;
            vite)
                npm run build && npm run preview -- --host 0.0.0.0 --port ${APP_PORT:-3100} &
                ;;
            express)
                NODE_APP_PORT=${APP_PORT:-3100} npm start &
                ;;
        esac
    else
        echo "Hot reload is enabled (default)..."
        case $PROJECT_TEMPLATE in
            react)
                BROWSER=none HOST=0.0.0.0 PORT=${APP_PORT:-3100} npm start &
                ;;
            vite)
                npm run dev -- --host 0.0.0.0 --port ${APP_PORT:-3100} &
                ;;
            express)
                NODE_APP_PORT=${APP_PORT:-3100} npm run dev &
                ;;
        esac
    fi
fi

echo "============================================"
echo "TerminalTurtle is ready!"
echo "API Server: http://localhost:${TURTLE_API_PORT:-3000}"
echo "Code Editor: http://localhost:${EDITOR_PORT:-8443}"
echo "============================================"

# Keep the container running
wait $API_PID