import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

// Configure Amplify once
try {
  Amplify.configure(outputs);
  console.log('Amplify configured successfully');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

// Create and export the client
export const amplifyClient = generateClient<Schema>();

// Export a function to check if Amplify is ready
export const isAmplifyReady = () => {
  try {
    return !!amplifyClient;
  } catch (error) {
    console.error('Amplify client not ready:', error);
    return false;
  }
};

// Get guest credentials for storage operations
export async function getGuestCredentials() {
  try {
    const session = await fetchAuthSession();
    return session;
  } catch (error) {
    console.error('Error getting guest credentials:', error);
    return null;
  }
}