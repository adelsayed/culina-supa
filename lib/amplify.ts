import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { supabase } from './supabase';
import { dummyRecipes } from '../data/dummyRecipes';

// Mock Amplify client for development - provides dummy data
const createMockAmplifyClient = () => {
  // Convert dummy recipes to the expected format with unique IDs
  const mockRecipes = dummyRecipes.map((recipe, index) => ({
    id: `mock-recipe-${index + 1}`,
    userId: 'mock-user-id',
    name: recipe.name,
    description: `A delicious ${recipe.name.toLowerCase()} recipe`,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl,
    tags: ['mock', 'sample'],
    source: 'Mock Data',
    category: 'Main Course',
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    difficulty: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Counter for new recipes to ensure unique IDs
  let recipeCounter = mockRecipes.length + 1;

  return {
    models: {
      Recipe: {
        list: async (params?: any) => {
          console.log('Mock Recipe.list called with:', params);
          // Filter by userId if provided
          let filteredRecipes = mockRecipes;
          if (params?.filter?.userId?.eq) {
            filteredRecipes = mockRecipes.filter(recipe => recipe.userId === params.filter.userId.eq);
          }
          return { data: filteredRecipes };
        },
        create: async (data: any) => {
          console.log('Mock Recipe.create called with:', data);
          const newRecipe = {
            id: `mock-recipe-${recipeCounter++}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          mockRecipes.push(newRecipe);
          return { data: newRecipe };
        },
        update: async (data: any) => {
          console.log('Mock Recipe.update called with:', data);
          const index = mockRecipes.findIndex(recipe => recipe.id === data.id);
          if (index !== -1) {
            mockRecipes[index] = { ...mockRecipes[index], ...data, updatedAt: new Date().toISOString() };
            return { data: mockRecipes[index] };
          }
          return { data: null };
        },
        delete: async (data: any) => {
          console.log('Mock Recipe.delete called with:', data);
          const index = mockRecipes.findIndex(recipe => recipe.id === data.id);
          if (index !== -1) {
            const deletedRecipe = mockRecipes.splice(index, 1)[0];
            return { data: deletedRecipe };
          }
          return { data: null };
        },
        observeQuery: (params?: any) => ({
          subscribe: (observer: any) => {
            console.log('Mock Recipe.observeQuery called with:', params);
            // Filter by userId if provided
            let filteredRecipes = mockRecipes;
            if (params?.filter?.userId?.eq) {
              filteredRecipes = mockRecipes.filter(recipe => recipe.userId === params.filter.userId.eq);
            }
            // Immediately return the data
            observer.next({ items: filteredRecipes });
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
  console.log('Using mock Amplify client to provide dummy data');
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