// --- Models for Recipe, SmartRecipe, MealPlanEntry ---

export type Recipe = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: string[]; // or object[] if you want structured ingredients
  instructions: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  source?: string;
  category?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: string;
};

export type SmartRecipe = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  source?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: string;
};

export type MealPlanEntry = {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  recipeId: string;
  recipeType: 'Recipe' | 'SmartRecipe';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  servings?: number;
  plannedCalories?: number;
};

// --- Unified Schema type for compatibility with amplifyClient ---
export type Schema = {
  Recipe: Recipe;
  SmartRecipe: SmartRecipe;
  MealPlanEntry: MealPlanEntry;
};

// --- No default export or named 'data' export here ---
// If you need to export a 'data' object, define it explicitly elsewhere.
