#!/bin/bash

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from .env.example"
fi

# Generate credentials if they don't exist
if [[ -z "$AGENT_ID" || -z "$API_KEY" ]]; then
    echo "Generating API credentials..."
    credentials=$(npm run generate-credentials --silent)
    
    AGENT_ID=$(echo $credentials | jq -r '.id')
    API_KEY=$(echo $credentials | jq -r '.apiKey')
    
    # Update .env file with new credentials
    sed -i '' "s/^AGENT_ID=.*/AGENT_ID=$AGENT_ID/" .env
    sed -i '' "s/^API_KEY=.*/API_KEY=$API_KEY/" .env
    
    echo "Credentials generated and added to .env"
else
    echo "Using existing credentials from .env"
fi

# Start the Docker container
echo "Starting Docker container..."
docker-compose up -d

echo "Deployment complete!"
