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
  const id = process.env.AGENT_ID;
  const apiKey = process.env.API_KEY;
  const name = process.env.AGENT_NAME || 'terminal-turtle';

  if (!id || !apiKey) {
    throw new Error('AGENT_ID and API_KEY must be provided in environment variables.');
  }

  return { id, apiKey, name };
};

export {
  generateCredentials,
  getCredentials,
  type AgentCredentials,
};
