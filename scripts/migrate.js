require('ts-node').register();

const { dummyRecipes } = require('../data/dummyRecipes');
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('../amplify_outputs.json');

// Initialize Amplify
console.log('Configuring Amplify...');
Amplify.configure(outputs);

const amplifyClient = generateClient();

async function migrateRecipes() {
  console.log('Starting recipe migration...', { 
    recipesCount: dummyRecipes.length,
    firstRecipe: dummyRecipes[0].name 
  });

  for (const recipe of dummyRecipes) {
    try {
      console.log(`Attempting to migrate recipe: ${recipe.name}`);
      const data = {
        name: recipe.name,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        imageUrl: recipe.imageUrl,
        userId: 'system',
      };
      console.log('Recipe data:', data);
      
      const result = await amplifyClient.models.Recipe.create(data);
      console.log(`Successfully migrated recipe: ${recipe.name}`, result);
    } catch (error) {
      console.error(`Failed to migrate recipe ${recipe.name}:`, error);
      console.error('Error details:', error.message);
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
