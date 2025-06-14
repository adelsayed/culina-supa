import type { Schema } from '../amplify/data/resource';

// Re-export Amplify types
export type Recipe = Schema['Recipe']['type'];
export type MealPlanEntry = Schema['MealPlanEntry']['type'];
export type ShoppingListItem = Schema['ShoppingListItem']['type'];

// Meal planning specific types
export type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Enhanced types for UI components
export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipe?: Recipe;
}

export interface DayMealPlan {
  date: Date;
  meals: {
    breakfast: MealPlanEntryWithRecipe[];
    snack1: MealPlanEntryWithRecipe[];
    lunch: MealPlanEntryWithRecipe[];
    snack2: MealPlanEntryWithRecipe[];
    dinner: MealPlanEntryWithRecipe[];
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface WeekMealPlan {
  weekStartDate: Date;
  days: DayMealPlan[];
  weeklyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  averageDaily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Nutrition tracking types
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionGoals extends NutritionData {
  userId: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle';
}

export interface NutritionProgress {
  actual: NutritionData;
  goals: NutritionData;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Shopping list types
export interface ShoppingListItemWithDetails extends ShoppingListItem {
  recipe?: Recipe;
  mealPlanEntry?: MealPlanEntry;
}

export interface GroupedShoppingList {
  [category: string]: ShoppingListItemWithDetails[];
}

export interface ShoppingListProgress {
  completed: number;
  total: number;
  percentage: number;
}

// Recipe filtering and search types
export interface RecipeFilters {
  category?: string;
  difficulty?: Difficulty;
  maxPrepTime?: number;
  maxCookTime?: number;
  maxCalories?: number;
  tags?: string[];
  searchQuery?: string;
}

export interface RecipeSearchResult {
  recipes: Recipe[];
  totalCount: number;
  hasMore: boolean;
}

// Meal planning actions
export interface CreateMealPlanEntryInput {
  userId: string;
  date: string; // ISO date string
  mealType: MealType;
  recipeId: string;
  servings?: number;
  notes?: string;
}

export interface UpdateMealPlanEntryInput {
  id: string;
  servings?: number;
  notes?: string;
}

// Calendar view types
export type CalendarView = 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedDate?: Date;
}

// Meal planning preferences
export interface MealPlanningPreferences {
  userId: string;
  defaultServings: number;
  preferredMealTimes: {
    breakfast: string;
    snack1: string;
    lunch: string;
    snack2: string;
    dinner: string;
  };
  dietaryRestrictions: string[];
  favoriteCategories: string[];
  autoGenerateShoppingList: boolean;
  weekStartsOn: 'sunday' | 'monday';
}

// Error types
export interface MealPlanningError {
  type: 'RECIPE_NOT_FOUND' | 'INVALID_DATE' | 'DUPLICATE_MEAL' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  details?: any;
}

// API response types
export interface MealPlanResponse {
  success: boolean;
  data?: MealPlanEntry;
  error?: MealPlanningError;
}

export interface ShoppingListResponse {
  success: boolean;
  data?: ShoppingListItem[];
  error?: MealPlanningError;
}

// Component prop types
export interface MealSlotProps {
  date: Date;
  mealType: MealType;
  entries: MealPlanEntryWithRecipe[];
  onAddRecipe: (recipeId: string, servings?: number) => void;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: UpdateMealPlanEntryInput) => void;
  isEditable?: boolean;
}

export interface CalendarDayProps {
  date: Date;
  dayMealPlan: DayMealPlan;
  isSelected?: boolean;
  isToday?: boolean;
  onDateSelect: (date: Date) => void;
  onMealPlanUpdate: (updates: DayMealPlan) => void;
}

export interface NutritionSummaryProps {
  nutrition: NutritionData;
  goals?: NutritionData;
  showProgress?: boolean;
  compact?: boolean;
}

// Hook return types
export interface UseMealPlannerReturn {
  // State
  weekMealPlan: WeekMealPlan | null;
  loading: boolean;
  error: MealPlanningError | null;
  
  // Actions
  addMealPlanEntry: (input: CreateMealPlanEntryInput) => Promise<MealPlanResponse>;
  updateMealPlanEntry: (input: UpdateMealPlanEntryInput) => Promise<MealPlanResponse>;
  removeMealPlanEntry: (entryId: string) => Promise<boolean>;
  
  // Navigation
  navigateToWeek: (date: Date) => void;
  navigateToNextWeek: () => void;
  navigateToPrevWeek: () => void;
  
  // Utilities
  getMealsForDate: (date: Date) => DayMealPlan | null;
  getDailyNutrition: (date: Date) => NutritionData;
  generateShoppingList: () => Promise<ShoppingListResponse>;
}

export interface UseShoppingListReturn {
  // State
  shoppingList: GroupedShoppingList;
  loading: boolean;
  error: MealPlanningError | null;
  progress: ShoppingListProgress;
  
  // Actions
  toggleItemCompleted: (itemId: string) => Promise<boolean>;
  addCustomItem: (item: Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCompleted: () => Promise<boolean>;
  
  // Utilities
  regenerateFromMealPlan: (weekStartDate: Date) => Promise<ShoppingListResponse>;
  exportList: () => string;
}