import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../../utils/logging';
import { getCredentials } from '../../utils/credentials';

// Authenticate editor access using API key or session cookie
export const authenticateEditor = (req: Request, res: Response, next: NextFunction): void => {
  // TEMPORARY: Allow all requests without authentication for testing
  logger.info('Editor access (auth disabled)', { 
    path: req.url,
    method: req.method,
    isWebSocket: req.headers.upgrade === 'websocket'
  });
  next();
  return;
  
  // Original auth code commented out for now
  /*
  // Allow WebSocket upgrade requests with proper authentication
  if (req.headers.upgrade === 'websocket') {
    logger.info('WebSocket upgrade request to editor', { 
      path: req.url,
      hasCookie: !!req.headers.cookie
    });
    // For WebSocket requests, always pass through - code-server will handle its own auth
    // The proxy middleware will handle the upgrade properly
    next();
    return;
  }
  
  // ... rest of auth code ...
  */
};

// Create proxy to code-server
export const createEditorProxy = () => {
  const options: Options = {
    target: 'http://localhost:8443',
    ws: true, // Enable WebSocket support for terminal
    changeOrigin: true,
    selfHandleResponse: false, // Let proxy handle response normally
    secure: false, // Allow self-signed certificates
    pathRewrite: (path: string, req: any) => {
      // Remove /editor prefix and preserve the rest
      const newPath = path.replace(/^\/editor/, '') || '/';
      logger.debug('Path rewrite', { original: path, new: newPath });
      return newPath;
    },
    on: {
      error: (err: Error, req: IncomingMessage, res: any) => {
        logger.error('Editor proxy error', { error: err.message });
        if (res && res.writeHead && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Editor not available',
            message: 'Code-server is not running or not accessible'
          }));
        }
      },
      proxyReqWs: (proxyReq: any, req: any, socket: any, head: any) => {
        // Log WebSocket upgrade
        logger.info('WebSocket upgrade request', { 
          url: req.url,
          headers: req.headers.upgrade 
        });
      },
      proxyReq: (proxyReq: any, req: IncomingMessage, res: ServerResponse) => {
        // Log editor access
        const request = req as any;
        logger.info('Editor access', { 
          method: request.method,
          path: request.url,
          ip: request.ip || request.connection.remoteAddress
        });
      },
      proxyRes: (proxyRes: any, req: IncomingMessage, res: any) => {
        const request = req as any;
        
        // Set authentication cookie if needed
        if (request.shouldSetCookie) {
          const cookies = proxyRes.headers['set-cookie'] || [];
          cookies.push('authenticated=true; Path=/editor; HttpOnly');
          proxyRes.headers['set-cookie'] = cookies;
        }
        
        // Fix redirects to include /editor prefix
        if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
          let location = proxyRes.headers.location;
          if (location) {
            // Handle different redirect patterns
            if (location === './' || location === '.') {
              // Redirect to editor root
              location = '/editor/';
            } else if (location === './login') {
              // Login redirect - keep relative to /editor
              location = '/editor/login';
            } else if (location.startsWith('./?')) {
              // Root with query params (after login)
              location = '/editor/' + location.substring(2);
            } else if (location.startsWith('./')) {
              // Other relative redirects
              location = '/editor/' + location.substring(2);
            } else if (location.startsWith('../')) {
              // Parent directory redirect
              location = '/editor/' + location.substring(3);
            } else if (location.startsWith('/') && !location.startsWith('/editor')) {
              // Absolute path redirect
              location = '/editor' + location;
            } else if (!location.startsWith('http') && !location.startsWith('/editor')) {
              // Other relative paths
              location = '/editor/' + location;
            }
            
            proxyRes.headers.location = location;
          }
        }
      }
    }
  };
  
  return createProxyMiddleware(options);
};