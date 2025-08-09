import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface AgentCredentials {
  id: string;
  apiKey: string;
  name?: string;
}

const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const generateCredentials = (name?: string): AgentCredentials => {
  const credentials: AgentCredentials = {
    id: uuidv4(),
    apiKey: generateApiKey(),
    name: name || 'terminal-turtle',
  };
  return credentials;
};

const getCredentials = (): AgentCredentials => {
  // For one-turtle-per-container, AGENT_ID is optional
  // If not provided, use container/instance name as ID
  const id = process.env.AGENT_ID || process.env.AGENT_NAME || 'default';
  const apiKey = process.env.TURTLE_API_KEY;
  const name = process.env.AGENT_NAME || 'terminal-turtle';

  if (!apiKey) {
    throw new Error('TURTLE_API_KEY must be provided in environment variables.');
  }

  return { id, apiKey, name };
};

export {
  generateCredentials,
  getCredentials,
  type AgentCredentials,
};
