#!/bin/bash
cd /data/workspace
npm create vite@latest . -- --template react-ts --yes
NODE_ENV=development npm install --include=dev