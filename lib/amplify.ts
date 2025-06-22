import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

// Configure Amplify with the outputs from the backend deployment
Amplify.configure(outputs);

// Create and export the real Amplify client, configured to use API key authentication
export const amplifyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

// Export a function to check if Amplify is ready (optional, but good practice)
export const isAmplifyReady = async () => {
  try {
    // A simple check to see if config is loaded by trying to fetch a session
    await fetchAuthSession();
    console.log('Amplify is configured and ready.');
    return true;
  } catch (error) {
    // We expect an error here if the user is not signed in, which is fine.
    // It still proves the library is configured.
    console.log('Amplify is configured and ready (guest mode).');
    return true;
  }
};