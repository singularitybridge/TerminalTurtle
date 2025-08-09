# 🚀 Deploying Terminal Turtle to Coolify/Hetzner

This guide explains how to deploy a Terminal Turtle instance as a Coolify application.

## Prerequisites

- Coolify instance running on Hetzner (or any VPS)
- GitHub repository with Terminal Turtle code
- Domain name (optional, for custom domain)

## Deployment Steps

### 1. Create New Application in Coolify

1. Log into your Coolify dashboard
2. Click **"+ New"** → **"Docker Compose"**
3. Select your server and destination

### 2. Configure Source

**Option A: From GitHub (Recommended)**
1. Connect your GitHub repository
2. Set branch to `main`
3. Set build path to `/`

**Option B: Direct Docker Compose**
1. Copy the contents of `deploy/docker-compose.coolify.yml`
2. Paste into Coolify's compose editor

### 3. Set Environment Variables

In Coolify's environment variables section, add:

```env
# REQUIRED - Generate secure key
API_KEY=<generate-secure-key-here>

# Template Selection (choose one: vite, react, express)
PROJECT_TEMPLATE=vite

# Port Configuration
PORT=3000
DEV_PORT=3100
NODE_PORT=4100
EDITOR_PORT=4433

# Instance Name
AGENT_NAME=my-project

# Optional AI Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Configure Networking

In Coolify's networking settings:

1. **Expose Ports:**
   - `3000` → API Server
   - `3100` → Development Server (Vite/React)
   - `4433` → Code Editor (VS Code)
   - `4100` → Node App (Express only)

2. **Domain Mapping (Optional):**
   ```
   api.yourdomain.com → 3000
   app.yourdomain.com → 3100
   editor.yourdomain.com → 4433
   ```

### 5. Deploy

1. Click **"Deploy"**
2. Wait for build and deployment (3-5 minutes)
3. Check logs for initialization progress

### 6. Access Your Turtle

Once deployed, access your services:

- **API:** `https://[your-coolify-domain]:3000`
- **App:** `https://[your-coolify-domain]:3100`
- **Editor:** `https://[your-coolify-domain]:4433`

Or with custom domains:
- **API:** `https://api.yourdomain.com`
- **App:** `https://app.yourdomain.com`
- **Editor:** `https://editor.yourdomain.com`

## Template-Specific Configurations

### Vite Template
```env
PROJECT_TEMPLATE=vite
DEV_PORT=3100  # Vite dev server
```
- Creates a Vite + React + TypeScript app
- Hot module replacement enabled
- Access at port 3100

### React Template
```env
PROJECT_TEMPLATE=react
DEV_PORT=3100  # React dev server
```
- Creates a Create React App with TypeScript
- Live reloading enabled
- Access at port 3100

### Express Template
```env
PROJECT_TEMPLATE=express
NODE_PORT=4100  # Express server
```
- Creates a basic Express.js server
- Auto-restarts with nodemon
- Access at port 4100

## Using the Deployed Turtle

### Via Web Browser

1. **Code Editor:** Navigate to `https://editor.yourdomain.com`
   - Full VS Code experience in browser
   - Edit files directly
   - Integrated terminal

2. **Dev Server:** Navigate to `https://app.yourdomain.com`
   - See your running application
   - Hot reload on file changes

### Via API

```bash
# Execute commands
curl -X POST https://api.yourdomain.com/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command": "npm install axios"}'

# File operations
curl -X POST https://api.yourdomain.com/file-operation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"operation": "list", "path": "/"}'
```

### Via Remote Management

After deployment, add to your local turtle remote:

```bash
# Add remote turtle
./turtle remote add production https://api.yourdomain.com YOUR_API_KEY

# Execute commands remotely
./turtle remote exec production "npm install"

# View logs
./turtle remote logs production
```

## SSL/HTTPS Configuration

Coolify handles SSL automatically if you:
1. Enable **"Auto-generate SSL"** in settings
2. Configure proper domain names
3. Ensure ports 80/443 are open

## Persistent Storage

The workspace is persisted in a Docker volume. To backup:

1. In Coolify, go to **Volumes**
2. Find `workspace` volume
3. Use Coolify's backup feature or:

```bash
# SSH into server
docker run --rm -v [app-name]_workspace:/data -v $(pwd):/backup alpine tar czf /backup/workspace-backup.tar.gz -C /data .
```

## Monitoring

1. **Coolify Dashboard:**
   - View logs
   - Monitor resource usage
   - Check health status

2. **Health Check Endpoint:**
   ```bash
   curl https://api.yourdomain.com/health
   ```

## Troubleshooting

### Container Won't Start
- Check API_KEY is set
- Verify PORT environment variables
- Check Coolify logs for errors

### Code Editor Not Accessible
- Ensure port 4433 is exposed
- Check firewall rules
- Verify code-server started (check logs)

### Dev Server Not Running
- Template might take 2-3 minutes to initialize
- Check logs for npm install progress
- Verify PROJECT_TEMPLATE is set correctly

### Permission Issues
- Workspace volume should be writable
- Check Docker user permissions
- May need to adjust Dockerfile USER directive

## Security Recommendations

1. **Use Strong API Key:**
   ```bash
   openssl rand -hex 32
   ```

2. **Restrict Access:**
   - Use Coolify's built-in authentication
   - Add IP whitelisting if needed
   - Use VPN for sensitive projects

3. **Regular Updates:**
   - Keep Coolify updated
   - Rebuild image for security patches
   - Monitor for vulnerabilities

## Advanced Configuration

### Custom Startup Script

Create a custom startup script in your repo:

```bash
# deploy/custom-startup.sh
#!/bin/bash
# Your custom initialization
npm install -g your-tools
# Start services
exec node dist/main.js
```

Then reference in docker-compose:
```yaml
command: ["/bin/bash", "/app/deploy/custom-startup.sh"]
```

### Multiple Instances

To deploy multiple turtles on same Coolify:
1. Create separate applications
2. Use different port ranges (3000, 3200, 3400, etc.)
3. Set unique AGENT_NAME for each

## Support

- Check container logs in Coolify
- Use health endpoint for status
- Remote debug via turtle CLI
- File issues on GitHub