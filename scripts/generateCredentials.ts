import { generateCredentials } from '../src/utils/credentials';

const credentials = generateCredentials();

console.log(`# Add the following lines to your .env file`);
console.log(`AGENT_ID=${credentials.id}`);
console.log(`API_KEY=${credentials.apiKey}`);
