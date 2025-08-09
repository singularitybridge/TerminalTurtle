#!/bin/bash
cd /data/workspace
npm create vite@latest . -- --template react-ts --yes
NODE_ENV=development npm install --include=dev

# Create vite.config.js with proper host configuration for production deployments
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.APP_PORT || '3100'),
    strictPort: true,
    // Allow all hosts in production deployment
    hmr: {
      host: 'localhost'
    }
  }
})
EOF