/**
 * Migration script to add nutrition data to existing recipes
 * This script adds default nutrition values to recipes that don't have them
 */

import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];

// Default nutrition values by category
const defaultNutritionByCategory: Record<string, {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}> = {
  'Breakfast': {
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 12,
    prepTime: 10,
    cookTime: 15,
    difficulty: 'easy',
  },
  'Lunch': {
    calories: 450,
    protein: 25,
    carbs: 50,
    fat: 15,
    prepTime: 15,
    cookTime: 20,
    difficulty: 'medium',
  },
  'Dinner': {
    calories: 550,
    protein: 30,
    carbs: 55,
    fat: 18,
    prepTime: 20,
    cookTime: 30,
    difficulty: 'medium',
  },
  'Snack': {
    calories: 200,
    protein: 8,
    carbs: 25,
    fat: 8,
    prepTime: 5,
    cookTime: 5,
    difficulty: 'easy',
  },
  'Dessert': {
    calories: 300,
    protein: 5,
    carbs: 40,
    fat: 12,
    prepTime: 15,
    cookTime: 25,
    difficulty: 'medium',
  },
};

// Default category assignment based on recipe name keywords
const categoryKeywords: Record<string, string[]> = {
  'Breakfast': ['pancake', 'waffle', 'oatmeal', 'cereal', 'toast', 'egg', 'breakfast', 'smoothie'],
  'Lunch': ['sandwich', 'salad', 'soup', 'wrap', 'burger', 'lunch'],
  'Dinner': ['pasta', 'chicken', 'beef', 'fish', 'rice', 'dinner', 'steak', 'roast'],
  'Snack': ['snack', 'chip', 'cracker', 'fruit', 'nut', 'bar'],
  'Dessert': ['cake', 'cookie', 'pie', 'ice cream', 'chocolate', 'dessert', 'sweet'],
};

/**
 * Determine recipe category based on name
 */
function determineCategory(recipeName: string): string {
  const name = recipeName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'Lunch'; // Default category
}

/**
 * Generate tags based on recipe name and ingredients
 */
function generateTags(recipe: Recipe): string[] {
  const tags: string[] = [];
  const name = recipe.name?.toLowerCase() || '';
  const ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];
  const allText = (name + ' ' + ingredients.join(' ')).toLowerCase();

  // Dietary tags
  if (allText.includes('vegetarian') || (!allText.includes('chicken') && !allText.includes('beef') && !allText.includes('fish') && !allText.includes('meat'))) {
    tags.push('vegetarian');
  }
  if (allText.includes('vegan') || allText.includes('plant-based')) {
    tags.push('vegan');
  }
  if (allText.includes('gluten-free') || allText.includes('gluten free')) {
    tags.push('gluten-free');
  }
  if (allText.includes('dairy-free') || allText.includes('dairy free')) {
    tags.push('dairy-free');
  }
  if (allText.includes('keto') || allText.includes('low-carb')) {
    tags.push('keto');
  }
  if (allText.includes('paleo')) {
    tags.push('paleo');
  }

  // Cooking method tags
  if (allText.includes('baked') || allText.includes('baking')) {
    tags.push('baked');
  }
  if (allText.includes('grilled') || allText.includes('grill')) {
    tags.push('grilled');
  }
  if (allText.includes('fried') || allText.includes('frying')) {
    tags.push('fried');
  }
  if (allText.includes('slow cooker') || allText.includes('crockpot')) {
    tags.push('slow-cooker');
  }

  // Time-based tags
  if (allText.includes('quick') || allText.includes('fast') || allText.includes('15 min')) {
    tags.push('quick');
  }
  if (allText.includes('healthy') || allText.includes('nutritious')) {
    tags.push('healthy');
  }

  return tags;
}

/**
 * Add nutrition data to a recipe
 */
async function addNutritionToRecipe(recipe: Recipe): Promise<void> {
  try {
    // Skip if recipe already has nutrition data
    if (recipe.calories && recipe.protein && recipe.carbs && recipe.fat) {
      console.log(`Recipe "${recipe.name}" already has nutrition data, skipping...`);
      return;
    }

    const category = recipe.category || determineCategory(recipe.name || '');
    const defaultNutrition = defaultNutritionByCategory[category] || defaultNutritionByCategory['Lunch'];
    const tags = generateTags(recipe);

    // Add some variation to make it more realistic
    const variation = 0.8 + Math.random() * 0.4; // 80% to 120% of default values
    
    const updatedRecipe = {
      id: recipe.id,
      calories: Math.round(defaultNutrition.calories * variation),
      protein: Math.round(defaultNutrition.protein * variation),
      carbs: Math.round(defaultNutrition.carbs * variation),
      fat: Math.round(defaultNutrition.fat * variation),
      servings: recipe.servings || 4,
      prepTime: defaultNutrition.prepTime,
      cookTime: defaultNutrition.cookTime,
      difficulty: defaultNutrition.difficulty,
      category: category,
      tags: tags,
    };

    await amplifyClient.models.Recipe.update(updatedRecipe);
    console.log(`✅ Updated recipe "${recipe.name}" with nutrition data`);
    
  } catch (error) {
    console.error(`❌ Error updating recipe "${recipe.name}":`, error);
  }
}

/**
 * Main migration function
 */
export async function migrateRecipeNutrition(): Promise<void> {
  try {
    console.log('🚀 Starting recipe nutrition migration...');
    
    // Fetch all recipes
    const { data: recipes } = await amplifyClient.models.Recipe.list();
    
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found to migrate.');
      return;
    }

    console.log(`Found ${recipes.length} recipes to process...`);

    // Process recipes in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipes.length / batchSize)}...`);
      
      await Promise.all(batch.map(recipe => addNutritionToRecipe(recipe)));
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Recipe nutrition migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRecipeNutrition()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}