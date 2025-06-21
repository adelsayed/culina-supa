// Type definitions for TypeScript - simplified approach to fix auth issues
export type Recipe = {
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

export type ShoppingListItem = {
  id: string;
  userId: string;
  weekStartDate: string;
  itemName: string;
  quantity?: string;
  unit?: string;
  category?: string;
  isCompleted: boolean;
  recipeId?: string;
  mealPlanEntryId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  userId: string;
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  weightGoal?: 'maintain' | 'lose' | 'gain';
  targetWeight?: number;
  dailyCalorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  dietaryRestrictions?: string[];
  allergies?: string[];
  dislikedIngredients?: string[];
  preferredCuisines?: string[];
  geminiApiKey?: string;
  customRecipePrompt?: string;
  customMealSuggestionsPrompt?: string;
  smartFeaturesEnabled: boolean;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// Unified Schema type for compatibility with amplifyClient
export type Schema = {
  Recipe: Recipe;
  SmartRecipe: SmartRecipe;
  MealPlanEntry: MealPlanEntry;
  ShoppingListItem: ShoppingListItem;
  UserProfile: UserProfile;
};

// --- No default export or named 'data' export here ---
// If you need to export a 'data' object, define it explicitly elsewhere.
