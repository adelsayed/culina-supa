import { Amplify } from 'aws-amplify';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Client, generateClient } from 'aws-amplify/data';

let client: Client<Schema> | null = null;

export async function initializeAmplify() {
  if (client) {
    return; // Already initialized
  }
  
  console.log('Initializing Amplify...');
  // Configure Amplify with the outputs from the backend deployment
  Amplify.configure(outputs);

  // NOTE: We are NOT dynamically importing anymore, as that was part of the
  // failed proxy experiment. The configuration delay in _layout.tsx is the
  // primary fix for the race condition.
  client = generateClient<Schema>({
    authMode: 'apiKey'
  });
  
  console.log('Amplify configured and client generated successfully.');
}

export function getAmplifyClient(): Client<Schema> {
  if (!client) {
    throw new Error(
      'Amplify client has not been initialized. Call initializeAmplify() first.'
    );
  }
  return client;
}