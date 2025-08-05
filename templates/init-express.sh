#!/bin/bash
cd /data/workspace

# Initialize package.json
npm init -y

# Install dependencies
npm install express typescript @types/node @types/express ts-node nodemon

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOF

# Create src directory
mkdir -p src

# Create index.ts
cat > src/index.ts << 'EOF'
import express from 'express';

const app = express();
const port = parseInt(process.env.NODE_APP_PORT || '4000', 10);

app.get('/', (req, res) => {
  res.send('Express TypeScript Server Running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
EOF

# Update package.json with scripts
npm pkg set scripts.dev="nodemon --watch src --ext ts --exec ts-node src/index.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/index.js"