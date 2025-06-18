import { amplifyClient } from '../lib/amplify';

export const testAmplifyConnection = async (userId: string) => {
  console.log('🔍 AMPLIFY DIAGNOSTIC TEST');
  console.log('========================');
  
  try {
    console.log('1. Testing Amplify Client...');
    console.log('Client exists:', !!amplifyClient);
    console.log('Client models:', !!amplifyClient.models);
    
    if (amplifyClient.models) {
      console.log('Available models:', Object.keys(amplifyClient.models));
    }
    
    console.log('2. Testing Recipe Model Access...');
    
    // Test if we can list recipes
    try {
      console.log('Attempting to list recipes...');
      const result = await (amplifyClient.models as any).Recipe.list();
      console.log('✅ Recipe.list() SUCCESS');
      console.log('Total recipes found:', result.data?.length || 0);
      console.log('Sample data:', result.data?.slice(0, 2));
      
      return {
        success: true,
        totalRecipes: result.data?.length || 0,
        recipes: result.data || [],
        models: Object.keys(amplifyClient.models || {})
      };
    } catch (recipeError) {
      console.error('❌ Recipe.list() FAILED:', recipeError);
      return {
        success: false,
        error: recipeError,
        models: Object.keys(amplifyClient.models || {})
      };
    }
    
  } catch (error) {
    console.error('❌ AMPLIFY CONNECTION FAILED:', error);
    return {
      success: false,
      error: error,
      amplifyClientExists: !!amplifyClient
    };
  }
};