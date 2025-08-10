# Coolify Configuration for TerminalTurtle

## Important Configuration Settings

When deploying TerminalTurtle to Coolify, use these exact settings:

### Domain Configuration
In the "Domains for Terminal Turtle" field, enter:
```
https://turtle-vite.singularitybridge.net:3100,https://api.turtle-vite.singularitybridge.net:3000,https://editor.turtle-vite.singularitybridge.net:8443
```

**IMPORTANT**: No spaces after commas! Spaces will break the proxy routing.

### Port Mappings
- External Port 3000 → Container Port 3000 (API)
- External Port 3100 → Container Port 3100 (App)
- External Port 4433 → Container Port 8443 (Editor)

### Environment Variables
```env
# Required
PROJECT_TEMPLATE=vite
APP_PORT=3100
TURTLE_API_PORT=3000
EDITOR_PORT=8443
AUTO_START_DEV_SERVER=true
TURTLE_API_KEY=your-secure-api-key-here

# Optional AI Integration
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### What Each Service Does
- **Main App** (https://turtle-vite.singularitybridge.net): Your Vite/React application
- **API** (https://api.turtle-vite.singularitybridge.net): TerminalTurtle control API
- **Editor** (https://editor.turtle-vite.singularitybridge.net): VS Code in the browser

### Troubleshooting

#### "No available server" error
- Check that domains have no spaces after commas
- Ensure you've redeployed after configuration changes
- Verify SSL certificates are issued for all subdomains

#### "Host not allowed" error in Vite
- The configuration automatically extracts the first domain from COOLIFY_FQDN
- If issues persist, manually set allowedHosts in vite.config.ts

#### Bad Gateway on editor
- Ensure port mapping is 4433:8443 (external:internal)
- Code-server runs on port 8443 inside the container

### Testing After Deployment
1. Check API health: `curl https://api.turtle-vite.singularitybridge.net/health`
2. Access main app: https://turtle-vite.singularitybridge.net
3. Access editor: https://editor.turtle-vite.singularitybridge.net