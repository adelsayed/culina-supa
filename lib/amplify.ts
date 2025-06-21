import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { supabase } from './supabase';

// Custom auth adapter to bridge Supabase with Amplify
const createSupabaseAuthAdapter = () => {
  return {
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    getCurrentSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    }
  };
};

// Configure Amplify with custom auth
try {
  // Override the auth configuration to work with Supabase
  const customOutputs = {
    ...outputs,
    auth: {
      ...outputs.auth,
      // Disable Cognito auth and use custom adapter
      userPoolId: undefined,
      userPoolClientId: undefined,
      identityPoolId: undefined,
    },
    data: {
      ...outputs.data,
      // Allow public access for now
      default_authorization_type: "API_KEY",
      authorization_types: ["API_KEY"],
    }
  };

  Amplify.configure(customOutputs);
  console.log('Amplify configured successfully with Supabase auth adapter');
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

// Helper function to get current user ID from Supabase
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}