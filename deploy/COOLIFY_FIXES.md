# Coolify Deployment Fixes

## Issues Identified and Fixed

### 1. Docker Build Context
**Problem**: docker-compose.coolify.yml had build context set to `.` which failed when run from deploy directory.
**Fix**: Changed build context to `../` to reference parent directory where Dockerfile exists.

### 2. Vite Config Generation
**Problem**: Vite config wasn't being created properly, causing "This host is not allowed" error.
**Fix**: Added proper vite.config.ts generation with host '0.0.0.0' in startup script.

### 3. Code-Server Port
**Problem**: Code-server was running on port 8080 instead of 8443.
**Fix**: Updated Dockerfile to configure code-server to bind to port 8443 by default.

### 4. Vite Dev Server
**Problem**: Vite dev server wasn't starting after project creation.
**Fix**: Ensured npm install and npm run dev execute after project creation.

## Required Changes Summary

1. **deploy/docker-compose.coolify.yml**:
   - Build context: `../` instead of `.`
   - Proper vite.config.ts generation with escaped quotes
   - Code-server startup with correct port binding

2. **Dockerfile**:
   - Default code-server config to use port 8443:
   ```yaml
   bind-addr: 0.0.0.0:8443
   auth: none
   cert: false
   ```

3. **Environment Variables**:
   - Use distinct ports to avoid conflicts:
     - TURTLE_API_PORT: 3000
     - APP_PORT: 3100  
     - EDITOR_PORT: 4433 (external) → 8443 (internal)

## Testing Locally

To test the Coolify deployment locally:

```bash
cd deploy
docker compose --env-file .env.test -f docker-compose.coolify.yml up -d --build
```

Then verify services:
- API: http://localhost:7000/health
- App: http://localhost:7100
- Editor: http://localhost:8433 (mapped from internal 8443)

## Deployment to Coolify

1. Push these changes to your repository
2. In Coolify, trigger a rebuild
3. Ensure domains are configured correctly:
   - Main domain → port 3100 (APP_PORT)
   - api.domain → port 3000 (TURTLE_API_PORT)  
   - editor.domain → port 8443 (internal, mapped from EDITOR_PORT)

## Verified Working

✅ Terminal Turtle API starts on correct port
✅ Vite dev server starts automatically 
✅ Code-server accessible on port 8443
✅ All services accessible via their configured ports