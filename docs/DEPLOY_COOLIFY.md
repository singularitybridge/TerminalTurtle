# Deploying TerminalTurtle to Coolify

This guide explains how to deploy TerminalTurtle to Coolify for production use with AI agents.

## Overview

Each TerminalTurtle instance on Coolify represents a dedicated development environment for one customer/company. The same Docker image works everywhere - locally, on Coolify, or any other platform.

## Deployment Steps

### 1. Create New Application in Coolify

1. Go to your Coolify dashboard
2. Click "New Application"
3. Select "Docker Image" as source
4. Configure the application:
   - **Name**: `tt-customerid` (e.g., `tt-acmecorp`)
   - **Image**: `ghcr.io/terminal-turtle/terminal-turtle:latest`
   - **Port**: `3000` (API port)

### 2. Configure Environment Variables

Copy these environment variables to Coolify's environment section:

```env
# Required
NODE_ENV=production
PORT=3000
WORKING_DIRECTORY=/data/workspace
API_KEY=<generate-secure-32-char-key>
AGENT_NAME=tt-customer-name
CUSTOMER_ID=customer-name

# Development server configuration
DEV_SERVER_PORT=3100
NODE_APP_PORT=4100
AUTO_START_DEV_SERVER=true
PROJECT_TEMPLATE=react

# Optional AI keys (if customer provides their own)
ANTHROPIC_API_KEY=<customer-api-key>
```

### 3. Configure Persistent Storage

1. In Coolify, go to "Storages" tab
2. Add new storage:
   - **Name**: `workspace`
   - **Mount Path**: `/data/workspace`
   - **Size**: 10GB (adjust per customer needs)

### 4. Configure Networking

#### For Single Port (API only):
- Coolify will automatically assign a subdomain
- Example: `tt-customer.coolify.yourdomain.com`

#### For Multiple Ports (API + Live Preview):
If you need to expose both API and preview ports:

1. **Primary Domain** (API):
   - `api-customer.yourdomain.com` → Port 3000

2. **Preview Domain** (Live App):
   - `preview-customer.yourdomain.com` → Port 3100
   - Configure additional domain in Coolify's domain settings

### 5. Deploy

1. Click "Deploy" in Coolify
2. Wait for health check to pass
3. Test the API endpoint: `https://api-customer.yourdomain.com/health`

## Integration with AI Agent Hub

Once deployed, configure the AI agent integration:

1. **API URL**: `https://api-customer.yourdomain.com`
2. **API Key**: The key you set in environment variables
3. **Working Directory**: Will be automatically created at `/data/workspace`

## Managing Multiple Customers

### Deployment Strategy

```
Customer A:
├── App Name: tt-customera
├── Domain: api-customera.yourdomain.com
├── Preview: preview-customera.yourdomain.com
└── Storage: 10GB persistent volume

Customer B:
├── App Name: tt-customerb
├── Domain: api-customerb.yourdomain.com
├── Preview: preview-customerb.yourdomain.com
└── Storage: 10GB persistent volume
```

### Scaling Approach

1. **Start Simple**: One Coolify app per customer
2. **Multiple Projects**: Later, allow project switching within same instance
3. **Auto-provisioning**: Use Coolify API to automate deployments

## Remote Management via Turtle CLI

The turtle CLI can manage remote instances:

```bash
# List remote instances
turtle remote list

# Connect to remote instance
turtle remote connect customer-name https://api-customer.yourdomain.com <api-key>

# Execute commands on remote
turtle remote exec customer-name "npm install express"

# View remote logs
turtle remote logs customer-name
```

## Monitoring & Maintenance

### Health Checks
- Coolify monitors `/health` endpoint
- Auto-restart on failure
- Email alerts on downtime

### Logs
- View in Coolify dashboard
- Or via API: `GET /logs`

### Updates
1. Update Docker image tag in Coolify
2. Click "Redeploy"
3. Zero-downtime deployment with health checks

## Cost Optimization

### Resource Limits
Set per customer tier:
- **Basic**: 1 CPU, 2GB RAM
- **Premium**: 2 CPU, 4GB RAM
- **Enterprise**: Custom

### Storage Management
- Start with 10GB
- Monitor usage via `/file-operation` API
- Expand as needed

## Security Considerations

1. **Unique API Keys**: Generate per customer
2. **Network Isolation**: Each container is isolated
3. **Resource Limits**: Prevent runaway processes
4. **Regular Updates**: Keep Docker image updated
5. **Backup Strategy**: Daily snapshots of workspace volumes

## Troubleshooting

### Container Won't Start
- Check environment variables
- Verify API_KEY is set
- Check Coolify logs

### Can't Access Preview Port
- Ensure domain is configured for port 3100
- Check if dev server is running: `GET /tasks`

### Storage Issues
- Check volume mount in Coolify
- Verify `/data/workspace` permissions
- Monitor disk usage

## Next Steps

1. Deploy first customer instance
2. Test with AI agent integration
3. Monitor performance
4. Optimize resource allocation
5. Automate provisioning