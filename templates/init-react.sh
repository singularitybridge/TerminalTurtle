#!/bin/bash
cd /data/workspace
npx create-react-app . --template typescript --use-npm
NODE_ENV=development npm install --include=dev