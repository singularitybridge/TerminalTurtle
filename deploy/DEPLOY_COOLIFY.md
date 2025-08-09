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
TURTLE_API_KEY=<generate-secure-key-here>

# Template Selection (choose one: vite, react, express)
PROJECT_TEMPLATE=vite

# Port Configuration
# IMPORTANT: Avoid ports 80, 443, 6001, 6002 (used by Coolify)
# Recommended: Use ports 3000-9999
TURTLE_API_PORT=3000  # Terminal Turtle control API
APP_PORT=3100         # Your application (Vite/React/Express)
EDITOR_PORT=4433      # VS Code web editor

# Instance Name
AGENT_NAME=my-project

# Optional AI Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Configure Networking

**IMPORTANT**: Coolify needs to know which ports to route to which domains.

#### Method 1: Multiple Domains in One Field
In Coolify's **Domains** field, add all domains separated by commas with port mappings:
```
https://yourdomain.com:3100,https://api.yourdomain.com:3000,https://editor.yourdomain.com:4433
```

**Example for your setup:**
```
https://turtle-vite.singularitybridge.net:3100,https://api.turtle-vite.singularitybridge.net:3000,https://editor.turtle-vite.singularitybridge.net:4433
```

#### Method 2: Configure Main Port
In Coolify's **Settings**:
1. Set the main **Port** to `3100` (your app)
2. The main domain will route to your app
3. For API and Editor access, you'll need to use the methods below

#### Method 3: Using Wildcard Domain (Recommended)

**Step 1: DNS Setup**
Add wildcard A record in your DNS provider:
```
Type: A
Host: *.turtle-vite  (or just * if turtle-vite is the root)
Value: <Your Server IP>
Proxy: Disabled (DNS Only if using Cloudflare)
```

**Step 2: Coolify Server Configuration**
1. Go to Coolify → **Servers** → Select your server
2. In **General** tab, find **Wildcard Domain**
3. Enter: `https://turtle-vite.singularitybridge.net`

**Step 3: Application Configuration**

**Option A: In Coolify Domains Field**
Enter all domains (note editor uses port 8443, not 4433):
```
https://turtle-vite.singularitybridge.net,https://api.turtle-vite.singularitybridge.net:3000,https://editor.turtle-vite.singularitybridge.net:8443
```

**Option B: Using Environment Variables (Recommended)**
Add these to Coolify's environment variables:
```
APP_DOMAIN=https://turtle-vite.singularitybridge.net
API_DOMAIN=https://api.turtle-vite.singularitybridge.net
EDITOR_DOMAIN=https://editor.turtle-vite.singularitybridge.net
```

The docker-compose.coolify.yml will automatically map these domains to the correct ports.

**Note**: 
- Port numbers in domains tell Coolify's proxy where to route
- Visitors won't see port numbers in their browser
- Direct port access (like `https://domain:3100`) won't work - use Coolify's proxy

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
APP_PORT=3100  # Vite dev server
```
- Creates a Vite + React + TypeScript app
- Hot module replacement enabled
- Access at APP_PORT

### React Template
```env
PROJECT_TEMPLATE=react
APP_PORT=3100  # React dev server
```
- Creates a Create React App with TypeScript
- Live reloading enabled
- Access at APP_PORT

### Express Template
```env
PROJECT_TEMPLATE=express
APP_PORT=3100  # Express server
```
- Creates a basic Express.js server
- Auto-restarts with nodemon
- Access at APP_PORT

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
  -H "Authorization: Bearer YOUR_TURTLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"command": "npm install axios"}'

# File operations
curl -X POST https://api.yourdomain.com/file-operation \
  -H "Authorization: Bearer YOUR_TURTLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"operation": "list", "path": "/"}'
```

### Via Remote Management

After deployment, add to your local turtle remote:

```bash
# Add remote turtle
./turtle remote add production https://api.yourdomain.com YOUR_TURTLE_API_KEY

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

### SSL Certificate Error (TRAEFIK DEFAULT CERT)
**Problem**: Subdomains show "Your connection is not private" with TRAEFIK DEFAULT CERT.

**Solution**:
1. **Verify DNS**: Ensure all subdomains have A records pointing to your server:
   ```bash
   nslookup api.turtle-vite.singularitybridge.net
   nslookup editor.turtle-vite.singularitybridge.net
   ```
   
2. **Fix Port Mappings**: 
   - Editor must use port `8443` (internal), not `4433`
   - In Domains field: `https://editor.turtle-vite.singularitybridge.net:8443`

3. **Revalidate**: 
   - Go to Coolify → **Servers** → **General** → **Revalidate Server**
   - Redeploy the application
   - Wait 2-3 minutes for Let's Encrypt to issue certificates

4. **Check Cloudflare** (if using):
   - Ensure proxy is **OFF** (DNS Only/Gray Cloud)
   - SSL/TLS mode should be "Full" or "Full (Strict)"

### Main Domain Shows API Instead of App
**Problem**: Your domain shows `{"status":"healthy"}` or API responses instead of your app.

**Solution**: 
1. In Coolify, go to your application's **Settings**
2. Under **Networking**, change the **Port** from `3000` to `3100`
3. Or add the label `coolify.port=3100` in docker-compose
4. Redeploy the application

### Can't Access App on HTTPS with Port
**Problem**: `https://domain.com:3100` gives SSL error.

**Solution**: Don't use port numbers with HTTPS. Coolify's proxy handles SSL. Either:
- Use the main domain (after configuring it to port 3100)
- Set up subdomains for each service

### Port Already Allocated Error
- **Common Issue**: "Bind for 0.0.0.0:XX failed: port is already allocated"
- **Solution**: Avoid these commonly used ports:
  - Port 80, 443 (HTTP/HTTPS - used by Coolify proxy)
  - Port 6001, 6002 (Coolify internal services)
  - Port 8000 (Common development port)
- **Recommended Ports**: 3000-3999, 4000-4999, 5000-5999, 7000-9999
- In Coolify, you can let it auto-assign ports by leaving them blank

### Container Won't Start
- Check TURTLE_API_KEY is set
- Verify PORT environment variables are not conflicting
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

1. **Use Strong TURTLE_API_KEY:**
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
3. Set unique AGENT_NAME for each (optional, for identification)

## Support

- Check container logs in Coolify
- Use health endpoint for status
- Remote debug via turtle CLI
- File issues on GitHub