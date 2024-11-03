import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from './logging';

interface AgentCredentials {
  id: string;
  apiKey: string;
  name?: string;
}

const CREDENTIALS_FILE = path.join(process.cwd(), '.agent-credentials');

const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const loadCredentials = (): AgentCredentials | null => {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Error loading agent credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  return null;
};

const saveCredentials = (credentials: AgentCredentials): void => {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
      mode: 0o600, // Read/write for owner only
    });
  } catch (error) {
    logger.error('Error saving agent credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

const setupAgent = (name?: string): AgentCredentials => {
  const existingCredentials = loadCredentials();
  if (existingCredentials) {
    logger.info('Agent already configured');
    return existingCredentials;
  }

  const credentials: AgentCredentials = {
    id: uuidv4(),
    apiKey: generateApiKey(),
    name,
  };

  saveCredentials(credentials);
  logger.info('Agent credentials generated and saved successfully');
  
  return credentials;
};

const getCredentials = (): AgentCredentials => {
  const credentials = loadCredentials();
  if (!credentials) {
    throw new Error('Agent not configured. Please run setup first.');
  }
  return credentials;
};

export {
  setupAgent,
  getCredentials,
  type AgentCredentials,
};
