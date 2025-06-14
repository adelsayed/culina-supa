import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];
type MealPlanEntry = Schema['MealPlanEntry']['type'];
type ShoppingListItem = Schema['ShoppingListItem']['type'];

export interface IngredientItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface ConsolidatedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  category: string;
  recipeIds: string[];
  mealPlanEntryIds: string[];
}

/**
 * Parse ingredient string to extract quantity, unit, and name
 * Examples: "2 cups flour", "1 lb chicken breast", "3 large eggs"
 */
export const parseIngredient = (ingredient: string): IngredientItem => {
  // Basic regex to extract quantity, unit, and ingredient name
  const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)$/;
  const match = ingredient.trim().match(regex);

  if (match) {
    const [, quantity, unit, name] = match;
    return {
      name: name.trim(),
      quantity: parseFloat(quantity),
      unit: unit.trim() || 'piece',
      category: categorizeIngredient(name.trim()),
    };
  }

  // Fallback for ingredients without clear quantity/unit
  return {
    name: ingredient.trim(),
    quantity: 1,
    unit: 'piece',
    category: categorizeIngredient(ingredient.trim()),
  };
};

/**
 * Categorize ingredients for better shopping list organization
 */
export const categorizeIngredient = (ingredientName: string): string => {
  const name = ingredientName.toLowerCase();

  // Produce
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('lettuce') || name.includes('tomato') || name.includes('onion') ||
      name.includes('carrot') || name.includes('potato') || name.includes('pepper') ||
      name.includes('spinach') || name.includes('broccoli') || name.includes('cucumber')) {
    return 'Produce';
  }

  // Dairy
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
      name.includes('butter') || name.includes('cream') || name.includes('egg')) {
    return 'Dairy';
  }

  // Meat & Seafood
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
      name.includes('fish') || name.includes('salmon') || name.includes('shrimp') ||
      name.includes('turkey') || name.includes('lamb')) {
    return 'Meat & Seafood';
  }

  // Pantry
  if (name.includes('flour') || name.includes('sugar') || name.includes('salt') ||
      name.includes('pepper') || name.includes('oil') || name.includes('vinegar') ||
      name.includes('rice') || name.includes('pasta') || name.includes('bread')) {
    return 'Pantry';
  }

  // Frozen
  if (name.includes('frozen')) {
    return 'Frozen';
  }

  // Default category
  return 'Other';
};

/**
 * Consolidate duplicate ingredients from multiple recipes
 */
export const consolidateIngredients = (
  ingredients: (IngredientItem & { recipeId: string; mealPlanEntryId: string })[]
): ConsolidatedIngredient[] => {
  const consolidated = new Map<string, ConsolidatedIngredient>();

  ingredients.forEach(ingredient => {
    const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.totalQuantity += ingredient.quantity;
      existing.recipeIds.push(ingredient.recipeId);
      existing.mealPlanEntryIds.push(ingredient.mealPlanEntryId);
    } else {
      consolidated.set(key, {
        name: ingredient.name,
        totalQuantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        recipeIds: [ingredient.recipeId],
        mealPlanEntryIds: [ingredient.mealPlanEntryId],
      });
    }
  });

  return Array.from(consolidated.values());
};

/**
 * Generate shopping list from meal plan entries
 */
export const generateShoppingList = (
  mealPlanEntries: MealPlanEntry[],
  recipes: Recipe[],
  weekStartDate: Date,
  userId: string
): Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const recipeMap = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const allIngredients: (IngredientItem & { recipeId: string; mealPlanEntryId: string })[] = [];

  // Extract ingredients from all meal plan entries
  mealPlanEntries.forEach(entry => {
    const recipe = recipeMap.get(entry.recipeId);
    if (recipe && recipe.ingredients) {
      try {
        const ingredients = JSON.parse(recipe.ingredients) as string[];
        const servingMultiplier = (entry.servings || 1) / (recipe.servings || 1);

        ingredients.forEach(ingredientStr => {
          const ingredient = parseIngredient(ingredientStr);
          allIngredients.push({
            ...ingredient,
            quantity: ingredient.quantity * servingMultiplier,
            recipeId: recipe.id,
            mealPlanEntryId: entry.id,
          });
        });
      } catch (error) {
        console.error('Error parsing ingredients for recipe:', recipe.id, error);
      }
    }
  });

  // Consolidate duplicate ingredients
  const consolidatedIngredients = consolidateIngredients(allIngredients);

  // Convert to shopping list items
  return consolidatedIngredients.map(ingredient => ({
    userId,
    weekStartDate: weekStartDate.toISOString().split('T')[0], // Convert to date string
    itemName: ingredient.name,
    quantity: ingredient.totalQuantity.toString(),
    unit: ingredient.unit,
    category: ingredient.category,
    isCompleted: false,
    recipeId: ingredient.recipeIds[0], // Primary recipe (could be enhanced to show all)
    mealPlanEntryId: ingredient.mealPlanEntryIds[0], // Primary meal plan entry
  }));
};

/**
 * Group shopping list items by category for better organization
 */
export const groupShoppingListByCategory = (
  shoppingList: ShoppingListItem[]
): Record<string, ShoppingListItem[]> => {
  return shoppingList.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingListItem[]>);
};

/**
 * Calculate shopping list completion percentage
 */
export const calculateShoppingListProgress = (
  shoppingList: ShoppingListItem[]
): { completed: number; total: number; percentage: number } => {
  const completed = shoppingList.filter(item => item.isCompleted).length;
  const total = shoppingList.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return { completed, total, percentage };
};

/**
 * Get suggested shopping order based on typical store layout
 */
export const getSuggestedShoppingOrder = (): string[] => {
  return [
    'Produce',
    'Dairy',
    'Meat & Seafood',
    'Frozen',
    'Pantry',
    'Other',
  ];
};