#!/bin/bash

# Update and upgrade the system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install other dependencies
sudo apt-get install -y curl wget unzip

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/yourusername/TerminalTurtle.git
cd TerminalTurtle

# Install project dependencies
npm ci

# Build TypeScript code
npm run build

# Set up environment variables (you may want to use a .env file instead)
export NODE_ENV=production
export PORT=8080
export WORKING_DIRECTORY=/data/workspace
export AGENT_NAME=terminal-turtle

# Create and set permissions for workspace directory
sudo mkdir -p /data/workspace
sudo chown -R $USER:$USER /data/workspace

# Install ngrok
wget -q -O /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-stable-linux-amd64.zip
sudo unzip /tmp/ngrok.zip -d /usr/local/bin
rm /tmp/ngrok.zip

# Start the application with PM2
pm2 start dist/main.js --name terminal-turtle

# Save the PM2 process list and set it to start on boot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

echo "Deployment complete. The application is now running with PM2."
