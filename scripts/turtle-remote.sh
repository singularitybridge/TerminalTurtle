#!/bin/bash

# turtle-remote.sh - Remote TerminalTurtle instance management
# This script manages remote TerminalTurtle instances deployed on Coolify/cloud

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_DIR=$(dirname "$0")
REMOTE_CONFIG_DIR="$BASE_DIR/.turtle-remote"
mkdir -p "$REMOTE_CONFIG_DIR"

# Remote instance configuration file
REMOTE_CONFIG="$REMOTE_CONFIG_DIR/instances.json"

# Initialize config file if it doesn't exist
if [ ! -f "$REMOTE_CONFIG" ]; then
    echo '{}' > "$REMOTE_CONFIG"
fi

# Function to save remote instance
save_remote_instance() {
    local name=$1
    local url=$2
    local api_key=$3
    
    # Update the JSON config
    jq --arg name "$name" \
       --arg url "$url" \
       --arg key "$api_key" \
       --arg date "$(date -Iseconds)" \
       '.[$name] = {url: $url, api_key: $key, added: $date}' \
       "$REMOTE_CONFIG" > "$REMOTE_CONFIG.tmp" && mv "$REMOTE_CONFIG.tmp" "$REMOTE_CONFIG"
}

# Function to get remote instance config
get_remote_instance() {
    local name=$1
    jq -r --arg name "$name" '.[$name]' "$REMOTE_CONFIG"
}

# Function to make authenticated API call
api_call() {
    local instance=$1
    local method=$2
    local endpoint=$3
    local data=${4:-}
    
    local config=$(get_remote_instance "$instance")
    if [ "$config" = "null" ]; then
        echo -e "${RED}Error: Remote instance '$instance' not found${NC}"
        echo "Use 'turtle remote add' to add it first"
        return 1
    fi
    
    local url=$(echo "$config" | jq -r '.url')
    local api_key=$(echo "$config" | jq -r '.api_key')
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $api_key" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${url}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $api_key" \
            "${url}${endpoint}"
    fi
}

COMMAND=${1:-help}
shift || true

case $COMMAND in
    add)
        # Add a new remote instance
        if [ $# -lt 3 ]; then
            echo -e "${RED}Error: Instance name, URL and API key required${NC}"
            echo "Usage: turtle remote add <name> <url> <api-key>"
            echo "Example: turtle remote add customer1 https://tt-customer1.coolify.app sk_abc123..."
            exit 1
        fi
        
        NAME=$1
        URL=$2
        API_KEY=$3
        
        # Remove trailing slash from URL
        URL=${URL%/}
        
        # Test connection
        echo -e "${BLUE}Testing connection to $URL...${NC}"
        if curl -s -f -H "Authorization: Bearer $API_KEY" "$URL/health" > /dev/null 2>&1; then
            save_remote_instance "$NAME" "$URL" "$API_KEY"
            echo -e "${GREEN}✓ Remote instance '$NAME' added successfully${NC}"
            echo -e "URL: $URL"
        else
            echo -e "${RED}Failed to connect to remote instance${NC}"
            echo "Please check the URL and API key"
            exit 1
        fi
        ;;
        
    list)
        # List all remote instances
        echo -e "${BLUE}🐢 Remote TerminalTurtle Instances${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if [ "$(jq -r 'keys | length' "$REMOTE_CONFIG")" -eq 0 ]; then
            echo -e "${YELLOW}No remote instances configured${NC}"
            echo "Use 'turtle remote add' to add a remote instance"
        else
            printf "%-20s %-50s %-10s\n" "NAME" "URL" "STATUS"
            echo -e "${BLUE}───────────────────────────────────────────────${NC}"
            
            jq -r 'to_entries | .[] | .key + "|" + .value.url' "$REMOTE_CONFIG" | while IFS='|' read -r name url; do
                # Check if instance is accessible
                if api_call "$name" GET "/health" > /dev/null 2>&1; then
                    status="${GREEN}Online${NC}"
                else
                    status="${RED}Offline${NC}"
                fi
                printf "%-20s %-50s %-10b\n" "$name" "$url" "$status"
            done
        fi
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
        
    exec)
        # Execute command on remote instance
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Instance name and command required${NC}"
            echo "Usage: turtle remote exec <name> <command>"
            echo "Example: turtle remote exec customer1 'npm install express'"
            exit 1
        fi
        
        INSTANCE=$1
        shift
        COMMAND="$*"
        
        # Check if instance exists
        CONFIG=$(get_remote_instance "$INSTANCE")
        if [ "$CONFIG" = "null" ]; then
            echo -e "${RED}Error: Remote instance '$INSTANCE' not found${NC}"
            echo "Use 'turtle remote list' to see available instances"
            exit 1
        fi
        
        echo -e "${BLUE}Executing on remote instance '$INSTANCE': ${NC}$COMMAND"
        
        RESPONSE=$(api_call "$INSTANCE" POST "/execute" "{\"command\": \"$COMMAND\"}")
        
        if [ $? -eq 0 ]; then
            echo "$RESPONSE" | jq -r '.output // .initialOutput // "Command started"'
            
            # Check if it's a long-running task
            TASK_ID=$(echo "$RESPONSE" | jq -r '.taskId // empty')
            if [ -n "$TASK_ID" ]; then
                echo -e "${YELLOW}Long-running task started. Task ID: $TASK_ID${NC}"
                echo "Use 'turtle remote task $INSTANCE $TASK_ID' to check status"
            fi
        else
            echo -e "${RED}Failed to execute command${NC}"
        fi
        ;;
        
    task)
        # Check task status
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Instance name and task ID required${NC}"
            echo "Usage: turtle remote task <name> <task-id>"
            exit 1
        fi
        
        INSTANCE=$1
        TASK_ID=$2
        
        RESPONSE=$(api_call "$INSTANCE" GET "/tasks/$TASK_ID")
        
        if [ $? -eq 0 ]; then
            echo "$RESPONSE" | jq '.'
        else
            echo -e "${RED}Failed to get task status${NC}"
        fi
        ;;
        
    logs)
        # Get logs from remote instance
        if [ $# -lt 1 ]; then
            echo -e "${RED}Error: Instance name required${NC}"
            echo "Usage: turtle remote logs <name> [lines]"
            exit 1
        fi
        
        INSTANCE=$1
        LINES=${2:-50}
        
        echo -e "${BLUE}Recent logs from '$INSTANCE':${NC}"
        
        # Execute tail command to get logs
        api_call "$INSTANCE" POST "/execute" "{\"command\": \"tail -n $LINES /app/app.log 2>/dev/null || echo 'No logs available'\"}" | \
            jq -r '.output // "No output"'
        ;;
        
    files)
        # List files in remote workspace
        if [ $# -lt 1 ]; then
            echo -e "${RED}Error: Instance name required${NC}"
            echo "Usage: turtle remote files <name> [path]"
            exit 1
        fi
        
        INSTANCE=$1
        PATH_TO_LIST=${2:-.}
        
        echo -e "${BLUE}Files in '$INSTANCE' at $PATH_TO_LIST:${NC}"
        
        RESPONSE=$(api_call "$INSTANCE" POST "/file-operation" \
            "{\"operation\": \"list\", \"path\": \"$PATH_TO_LIST\", \"recursive\": false}")
        
        if [ $? -eq 0 ]; then
            echo "$RESPONSE" | jq -r '.result[]? // .result // "No files"'
        else
            echo -e "${RED}Failed to list files${NC}"
        fi
        ;;
        
    remove)
        # Remove a remote instance from config
        if [ $# -lt 1 ]; then
            echo -e "${RED}Error: Instance name required${NC}"
            echo "Usage: turtle remote remove <name>"
            exit 1
        fi
        
        NAME=$1
        
        if [ "$(get_remote_instance "$NAME")" = "null" ]; then
            echo -e "${RED}Error: Remote instance '$NAME' not found${NC}"
            exit 1
        fi
        
        # Remove from config
        jq --arg name "$NAME" 'del(.[$name])' "$REMOTE_CONFIG" > "$REMOTE_CONFIG.tmp" && \
            mv "$REMOTE_CONFIG.tmp" "$REMOTE_CONFIG"
        
        echo -e "${GREEN}✓ Remote instance '$NAME' removed from config${NC}"
        ;;
        
    info)
        # Show info about a remote instance
        if [ $# -lt 1 ]; then
            echo -e "${RED}Error: Instance name required${NC}"
            echo "Usage: turtle remote info <name>"
            exit 1
        fi
        
        INSTANCE=$1
        
        CONFIG=$(get_remote_instance "$INSTANCE")
        if [ "$CONFIG" = "null" ]; then
            echo -e "${RED}Error: Remote instance '$INSTANCE' not found${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🐢 Remote Instance: ${GREEN}$INSTANCE${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        echo "$CONFIG" | jq -r '
            "URL: \(.url)",
            "Added: \(.added)",
            "API Key: \(.api_key[:8])..." 
        '
        
        # Check health
        echo -e "\n${BLUE}Health Check:${NC}"
        if HEALTH=$(api_call "$INSTANCE" GET "/health" 2>/dev/null); then
            echo -e "${GREEN}✓ Instance is online${NC}"
            echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
        else
            echo -e "${RED}✗ Instance is offline or unreachable${NC}"
        fi
        
        # Get tasks
        echo -e "\n${BLUE}Running Tasks:${NC}"
        if TASKS=$(api_call "$INSTANCE" GET "/tasks" 2>/dev/null); then
            TASK_COUNT=$(echo "$TASKS" | jq 'length')
            echo "Total tasks: $TASK_COUNT"
            echo "$TASKS" | jq -r '.[] | "  - [\(.status)] \(.command[:50])..."' 2>/dev/null || echo "  No tasks"
        fi
        
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
        
    help|*)
        echo -e "${BLUE}🐢 TerminalTurtle Remote Management${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Manage remote TerminalTurtle instances deployed on Coolify or cloud platforms"
        echo ""
        echo "Usage: turtle remote <command> [options]"
        echo ""
        echo "Commands:"
        echo "  add <name> <url> <key>    Add a remote instance"
        echo "  list                       List all remote instances"
        echo "  exec <name> <command>      Execute command on remote instance"
        echo "  task <name> <task-id>      Check task status"
        echo "  logs <name> [lines]        View logs from remote instance"
        echo "  files <name> [path]        List files in remote workspace"
        echo "  info <name>                Show instance information"
        echo "  remove <name>              Remove instance from config"
        echo "  help                       Show this help message"
        echo ""
        echo "Examples:"
        echo "  turtle remote add customer1 https://tt.coolify.app sk_abc123..."
        echo "  turtle remote exec customer1 'npm install express'"
        echo "  turtle remote logs customer1 100"
        echo "  turtle remote files customer1 /src"
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ;;
esac