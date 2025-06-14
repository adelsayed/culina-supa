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
 * Examples: "2 cups flour", "1 lb chicken breast", "6 cups vegetable broth", "1/2 cup olive oil"
 */
export const parseIngredient = (ingredient: string): IngredientItem => {
  const originalIngredient = ingredient.trim();
  
  // Handle fractions and convert to decimal
  const convertFractionToDecimal = (str: string): number => {
    // Handle mixed numbers like "1 1/2" or "2 1/4"
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const [, whole, numerator, denominator] = mixedMatch;
      return parseInt(whole) + parseInt(numerator) / parseInt(denominator);
    }
    
    // Handle simple fractions like "1/2" or "3/4"
    const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const [, numerator, denominator] = fractionMatch;
      return parseInt(numerator) / parseInt(denominator);
    }
    
    // Handle ranges like "2-3" or "1-2" - use average
    const rangeMatch = str.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (rangeMatch) {
      const [, min, max] = rangeMatch;
      return (parseFloat(min) + parseFloat(max)) / 2;
    }
    
    // Regular decimal number
    return parseFloat(str) || 1;
  };

  // Enhanced patterns to match various ingredient formats
  const patterns = [
    // Pattern 1: "6 cups vegetable broth" - number + unit + multi-word ingredient
    /^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|\d+-\d+)\s+(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|oz|ounces?|lb|lbs|pounds?|piece|pieces|can|cans|packet|packets|slice|slices|clove|cloves)\s+(.+)$/i,
    
    // Pattern 2: "200g chicken breast" - number + unit (no space) + ingredient
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+-\d+)(g|kg|ml|l|oz|lb)\s+(.+)$/i,
    
    // Pattern 3: "3 large eggs" - number + descriptor + ingredient
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+-\d+)\s+(large|medium|small|fresh|dried|chopped|diced|minced|whole)?\s*(.+)$/i,
    
    // Pattern 4: Just number at start - "2 onions", "4 tomatoes"
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+-\d+)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = originalIngredient.match(pattern);
    if (match) {
      let quantity, unit, name;
      
      if (match.length === 4 && match[2].match(/^(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|oz|ounces?|lb|lbs|pounds?|piece|pieces|can|cans|packet|packets|slice|slices|clove|cloves)$/i)) {
        // Pattern 1: quantity + unit + name
        quantity = convertFractionToDecimal(match[1]);
        unit = normalizeUnit(match[2]);
        name = cleanIngredientName(match[3]);
      } else if (match.length === 4 && match[2].match(/^(g|kg|ml|l|oz|lb)$/i)) {
        // Pattern 2: quantity + unit(no space) + name
        quantity = convertFractionToDecimal(match[1]);
        unit = normalizeUnit(match[2]);
        name = cleanIngredientName(match[3]);
      } else if (match.length === 4) {
        // Pattern 3: quantity + descriptor + name
        quantity = convertFractionToDecimal(match[1]);
        unit = 'piece';
        name = cleanIngredientName([match[2], match[3]].filter(Boolean).join(' '));
      } else {
        // Pattern 4: quantity + name
        quantity = convertFractionToDecimal(match[1]);
        unit = 'piece';
        name = cleanIngredientName(match[2]);
      }

      return {
        name: name,
        quantity: quantity,
        unit: unit,
        category: categorizeIngredient(name),
      };
    }
  }

  // Special handling for "to taste" ingredients
  if (originalIngredient.toLowerCase().includes('to taste')) {
    const nameMatch = originalIngredient.replace(/\s*to\s+taste/i, '').trim();
    return {
      name: nameMatch || originalIngredient,
      quantity: 1,
      unit: 'to taste',
      category: categorizeIngredient(nameMatch || originalIngredient),
    };
  }

  // Fallback for ingredients without clear quantity/unit
  return {
    name: cleanIngredientName(originalIngredient),
    quantity: 1,
    unit: 'piece',
    category: categorizeIngredient(originalIngredient),
  };
};

/**
 * Normalize unit names to standard forms
 */
const normalizeUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'cups': 'cup', 'cup': 'cup',
    'tablespoons': 'tbsp', 'tablespoon': 'tbsp', 'tbsp': 'tbsp',
    'teaspoons': 'tsp', 'teaspoon': 'tsp', 'tsp': 'tsp',
    'grams': 'g', 'g': 'g',
    'kilograms': 'kg', 'kg': 'kg',
    'milliliters': 'ml', 'ml': 'ml',
    'liters': 'l', 'l': 'l',
    'ounces': 'oz', 'oz': 'oz',
    'pounds': 'lb', 'lbs': 'lb', 'lb': 'lb',
    'pieces': 'piece', 'piece': 'piece',
    'cans': 'can', 'can': 'can',
    'packets': 'packet', 'packet': 'packet',
    'slices': 'slice', 'slice': 'slice',
    'cloves': 'clove', 'clove': 'clove',
  };
  
  return unitMap[unit.toLowerCase()] || unit.toLowerCase();
};

/**
 * Clean ingredient name by removing common descriptors and extra whitespace
 */
const cleanIngredientName = (name: string): string => {
  return name
    .replace(/,?\s*(chopped|diced|minced|sliced|grated|fresh|dried|cooked|raw|boneless|skinless)$/gi, '')
    .replace(/\s*,\s*$/, '') // Remove trailing comma
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Categorize ingredients for better shopping list organization
 * Enhanced with UAE/regional ingredients and more comprehensive categories
 */
export const categorizeIngredient = (ingredientName: string): string => {
  const name = ingredientName.toLowerCase();

  // Produce - Fruits & Vegetables
  const produceKeywords = [
    // Fruits
    'apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'grape', 'strawberry', 'blueberry', 'pineapple', 'watermelon', 'melon', 'kiwi', 'peach', 'pear', 'cherry', 'date', 'fig', 'pomegranate', 'avocado',
    // Vegetables
    'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'bell pepper', 'chili', 'spinach', 'broccoli', 'cucumber', 'zucchini', 'eggplant', 'aubergine', 'cabbage', 'cauliflower', 'celery', 'leek', 'mushroom', 'ginger', 'cilantro', 'parsley', 'mint', 'basil', 'dill', 'thyme', 'rosemary', 'oregano',
    // Middle Eastern/UAE specific
    'sumac', 'za\'atar', 'zaatar', 'turnip', 'radish', 'arugula', 'rocket', 'watercress', 'okra', 'molokhia', 'vine leaves', 'grape leaves'
  ];
  
  if (produceKeywords.some(keyword => name.includes(keyword))) {
    return 'Produce';
  }

  // Dairy & Eggs
  const dairyKeywords = [
    'milk', 'cheese', 'yogurt', 'yoghurt', 'labneh', 'butter', 'cream', 'sour cream', 'heavy cream', 'whipping cream', 'egg', 'eggs', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta', 'cottage cheese', 'cream cheese', 'halloumi'
  ];
  
  if (dairyKeywords.some(keyword => name.includes(keyword))) {
    return 'Dairy';
  }

  // Meat & Seafood
  const meatKeywords = [
    'chicken', 'beef', 'lamb', 'mutton', 'goat', 'veal', 'turkey', 'duck', 'pork', 'bacon', 'ham', 'sausage', 'ground beef', 'mince', 'steak', 'breast', 'thigh', 'wing', 'drumstick',
    'fish', 'salmon', 'tuna', 'cod', 'sea bass', 'hammour', 'kingfish', 'shrimp', 'prawns', 'crab', 'lobster', 'squid', 'octopus', 'mussels', 'clams', 'oysters'
  ];
  
  if (meatKeywords.some(keyword => name.includes(keyword))) {
    return 'Meat & Seafood';
  }

  // Pantry - Dry goods, spices, condiments
  const pantryKeywords = [
    // Grains & Carbs
    'flour', 'rice', 'pasta', 'bread', 'quinoa', 'bulgur', 'couscous', 'oats', 'barley', 'lentil', 'chickpea', 'bean', 'pea',
    // Spices & Seasonings
    'salt', 'pepper', 'cumin', 'coriander', 'turmeric', 'paprika', 'cinnamon', 'cardamom', 'clove', 'nutmeg', 'saffron', 'bay leaf', 'allspice', 'baharat', 'ras el hanout', 'harissa',
    // Oils & Vinegars
    'oil', 'olive oil', 'vegetable oil', 'coconut oil', 'vinegar', 'balsamic', 'tahini', 'sesame oil',
    // Sweeteners & Baking
    'sugar', 'honey', 'maple syrup', 'molasses', 'vanilla', 'baking powder', 'baking soda', 'yeast',
    // Condiments & Sauces
    'soy sauce', 'ketchup', 'mustard', 'mayonnaise', 'hot sauce', 'worcestershire', 'fish sauce', 'oyster sauce', 'tomato paste', 'coconut milk', 'stock', 'broth', 'bouillon'
  ];
  
  if (pantryKeywords.some(keyword => name.includes(keyword))) {
    return 'Pantry';
  }

  // Frozen Foods
  if (name.includes('frozen')) {
    return 'Frozen';
  }

  // Beverages
  const beverageKeywords = [
    'water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'sparkling', 'soft drink', 'energy drink'
  ];
  
  if (beverageKeywords.some(keyword => name.includes(keyword))) {
    return 'Beverages';
  }

  // Snacks & Sweets
  const snackKeywords = [
    'chips', 'crackers', 'nuts', 'chocolate', 'candy', 'cookies', 'biscuits', 'ice cream', 'cake', 'pie', 'pastry'
  ];
  
  if (snackKeywords.some(keyword => name.includes(keyword))) {
    return 'Snacks & Sweets';
  }

  // Household/Personal Care
  const householdKeywords = [
    'detergent', 'soap', 'shampoo', 'toothpaste', 'tissue', 'toilet paper', 'aluminum foil', 'plastic wrap', 'bag'
  ];
  
  if (householdKeywords.some(keyword => name.includes(keyword))) {
    return 'Household';
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
    'Beverages',
    'Snacks & Sweets',
    'Household',
    'Other',
  ];
};