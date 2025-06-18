import { amplifyClient } from '../lib/amplify';
import { italianRecipes } from '../data/recipes/italian';

export const seedItalianRecipes = async (userId: string) => {
  console.log('Starting to seed Italian recipes...');
  
  try {
    // Check if recipes already exist to avoid duplicates
    const existingRecipes = await (amplifyClient.models as any).Recipe.list({
      filter: { userId: { eq: userId } }
    });
    
    const existingNames = existingRecipes.data.map((r: any) => r.name);
    const newRecipes = italianRecipes.filter(recipe => !existingNames.includes(recipe.name));
    
    console.log(`Found ${existingRecipes.data.length} existing recipes`);
    console.log(`Will add ${newRecipes.length} new Italian recipes`);
    
    // Seed new recipes
    for (const recipe of newRecipes) {
      try {
        await (amplifyClient.models as any).Recipe.create({
          name: recipe.name,
          ingredients: JSON.stringify(recipe.ingredients),
          instructions: JSON.stringify(recipe.instructions),
          imageUrl: recipe.imageUrl,
          userId: userId,
        });
        console.log(`✅ Added: ${recipe.name}`);
      } catch (error) {
        console.error(`❌ Failed to add ${recipe.name}:`, error);
      }
    }
    
    console.log('🎉 Italian recipe seeding completed!');
    return { success: true, added: newRecipes.length };
    
  } catch (error) {
    console.error('Error seeding Italian recipes:', error);
    return { success: false, error };
  }
};