import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../amplify_outputs.json';
import { dummyRecipes } from '../data/dummyRecipes';
import type { Schema } from '../amplify/data/resource';

// Configure Amplify
Amplify.configure(outputs);

// Create the Amplify data client AND explicitly set its auth mode
const client = generateClient<Schema>({
  authMode: 'apiKey'
});

async function main() {
  console.log('Seeding database...');

  // Seed Recipes
  for (const recipe of dummyRecipes) {
    try {
      const existing = await client.models.Recipe.list({
        filter: { name: { eq: recipe.name } }
      });

      if (existing.data.length > 0) {
        console.log(`Recipe "${recipe.name}" already exists. Skipping.`);
        continue;
      }

      console.log(`Creating recipe: ${recipe.name}`);
      await client.models.Recipe.create({
        // We need a placeholder userId since our schema requires it.
        // In a real app, this would be the actual user's ID.
        userId: 'system-seeded',
        name: recipe.name,
        description: `A delicious ${recipe.name.toLowerCase()}.`,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        imageUrl: recipe.imageUrl,
        // Provide default values for fields not in dummy data
        tags: ['classic', 'seeded'],
        category: 'Uncategorized',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        difficulty: 'Medium',
        source: 'Culina Seed',
      });
    } catch (error) {
      console.error(`Failed to seed recipe ${recipe.name}:`, error);
    }
  }

  console.log('Seeding complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 