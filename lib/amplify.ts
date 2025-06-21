import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { supabase } from './supabase';

// Mock Amplify client for development - bypasses authentication issues
const createMockAmplifyClient = () => {
  return {
    models: {
      Recipe: {
        list: async () => ({ data: [] }),
        create: async (data: any) => ({ data }),
        update: async (data: any) => ({ data }),
        delete: async (data: any) => ({ data }),
        observeQuery: () => ({
          subscribe: (observer: any) => {
            // Mock subscription that immediately returns empty data
            observer.next({ items: [] });
            return { unsubscribe: () => {} };
          }
        })
      },
      SmartRecipe: {
        list: async () => ({ data: [] }),
        create: async (data: any) => ({ data }),
        update: async (data: any) => ({ data }),
        delete: async (data: any) => ({ data }),
        observeQuery: () => ({
          subscribe: (observer: any) => {
            observer.next({ items: [] });
            return { unsubscribe: () => {} };
          }
        })
      },
      MealPlanEntry: {
        list: async () => ({ data: [] }),
        create: async (data: any) => ({ data }),
        update: async (data: any) => ({ data }),
        delete: async (data: any) => ({ data }),
        observeQuery: () => ({
          subscribe: (observer: any) => {
            observer.next({ items: [] });
            return { unsubscribe: () => {} };
          }
        })
      },
      ShoppingListItem: {
        list: async () => ({ data: [] }),
        create: async (data: any) => ({ data }),
        update: async (data: any) => ({ data }),
        delete: async (data: any) => ({ data }),
        observeQuery: () => ({
          subscribe: (observer: any) => {
            observer.next({ items: [] });
            return { unsubscribe: () => {} };
          }
        })
      },
      UserProfile: {
        list: async () => ({ data: [] }),
        create: async (data: any) => ({ data }),
        update: async (data: any) => ({ data }),
        delete: async (data: any) => ({ data }),
        observeQuery: () => ({
          subscribe: (observer: any) => {
            observer.next({ items: [] });
            return { unsubscribe: () => {} };
          }
        })
      }
    }
  };
};

// Configure Amplify with mock client for now
try {
  console.log('Using mock Amplify client to bypass authentication issues');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

// Create and export the mock client
export const amplifyClient = createMockAmplifyClient() as any;

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