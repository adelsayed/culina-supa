import { dummyRecipes } from '../data/dummyRecipes';
import { amplifyClient } from '../lib/amplify';

async function migrateRecipes() {
  console.log('Starting recipe migration...');

  for (const recipe of dummyRecipes) {
    try {
      // Convert arrays to JSON strings since our Amplify schema stores them as strings
      const result = await amplifyClient.models.Recipe.create({
        name: recipe.name,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        imageUrl: recipe.imageUrl,
        userId: 'system', // You might want to set this to a specific value
      });
      console.log(`Migrated recipe: ${recipe.name}`);
    } catch (error) {
      console.error(`Failed to migrate recipe ${recipe.name}:`, error);
    }
  }

  console.log('Recipe migration complete!');
}

migrateRecipes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
