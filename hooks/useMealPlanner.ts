import { useState, useEffect, useCallback } from 'react';
import { isAmplifyReady, amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
import {
  getWeekStartDate,
  getWeekDates,
  formatDateForAPI
} from '../utils/dateUtils';
import {
  calculateDailyNutrition,
  type NutritionData
} from '../utils/nutritionCalculator';

// Types
type Recipe = Schema['Recipe'];
type MealPlanEntry = Schema['MealPlanEntry'];
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';

// FlexibleRecipe to handle both regular and AI recipes
type FlexibleRecipe = {
  id: string;
  userId: string;
  name: string;
  ingredients: string[] | string;
  instructions: string[] | string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  source?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  nutrition?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  } | null;
};

export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipe?: FlexibleRecipe;
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
  nutrition: NutritionData;
}

export interface WeekMealPlan {
  weekStartDate: Date;
  days: DayMealPlan[];
  weeklyNutrition: NutritionData;
}

export const useMealPlanner = (initialWeekStart?: Date) => {
  const { session } = useAuth();
  const [weekStartDate, setWeekStartDate] = useState(
    initialWeekStart || getWeekStartDate(new Date())
  );
  const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanEntryWithRecipe[]>([]);
  const [recipes, setRecipes] = useState<FlexibleRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load meal plan entries
  const loadMealPlanEntries = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Debug: Checking amplifyClient:', !!amplifyClient);
      console.log('🔍 Debug: Checking amplifyClient.models:', !!amplifyClient?.models);
      
      if (!amplifyClient || !amplifyClient.models) {
        console.log('⚠️ Amplify models not available, using empty meal plan');
        setMealPlanEntries([]);
        setRecipes([]);
        setError('Amplify backend not configured - meal planning temporarily unavailable');
        return;
      }

      // Check if specific models exist
      const models = amplifyClient.models as any;
      if (!models.MealPlanEntry || !models.Recipe) {
        console.log('⚠️ Required models not found, using empty meal plan');
        setMealPlanEntries([]);
        setRecipes([]);
        setError('Database models not available - meal planning temporarily unavailable');
        return;
      }

      const weekDates = getWeekDates(weekStartDate);
      const startDate = formatDateForAPI(weekDates[0]);
      const endDate = formatDateForAPI(weekDates[6]);

      console.log('🔍 Debug: Loading meal plan entries...');
      
      // Load meal plan entries for the week
      const { data: entries } = await models.MealPlanEntry.list({
        filter: {
          userId: { eq: session.user.id },
          date: { between: [startDate, endDate] }
        }
      });

      console.log('🔍 Debug: Meal plan entries loaded:', entries?.length || 0);

      // Load recipes
      const { data: userRecipes } = await models.Recipe.list({
        filter: { userId: { eq: session.user.id } }
      });

      console.log('🔍 Debug: User recipes loaded:', userRecipes?.length || 0);

      // Load smart recipes (optional, might not exist)
      let smartRecipes = [];
      try {
        if (models.SmartRecipe) {
          const { data } = await models.SmartRecipe.list({
            filter: { userId: { eq: session.user.id } }
          });
          smartRecipes = data || [];
        }
      } catch (smartError) {
        console.log('SmartRecipe model not available, skipping...');
      }

      console.log('🔍 Debug: Smart recipes loaded:', smartRecipes.length);

      setRecipes(userRecipes || []);

      // Combine entries with their recipes
      const entriesWithRecipes = (entries || []).map((entry: any) => {
        let recipe;
        if (entry.recipeType === 'Recipe') {
          recipe = userRecipes?.find((r: any) => r.id === entry.recipeId);
        } else if (entry.recipeType === 'SmartRecipe') {
          recipe = smartRecipes?.find((r: any) => r.id === entry.recipeId);
        }
        return { ...entry, recipe };
      });

      setMealPlanEntries(entriesWithRecipes);
      console.log('🔍 Debug: Meal plan loading completed successfully');
    } catch (err) {
      console.error('❌ Error loading meal plan:', err);
      setError('Unable to load meal plan - backend not configured');
      setMealPlanEntries([]);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, weekStartDate]);

  // Add entry
  const addMealPlanEntry = useCallback(async (
    date: Date,
    mealType: MealType,
    recipe: FlexibleRecipe,
    servings: number = 1
  ) => {
    if (!session?.user?.id) return false;

    // Check if backend is available
    if (!amplifyClient?.models || !(amplifyClient.models as any).MealPlanEntry) {
      setError('Meal planning not available - backend not configured');
      return false;
    }

    try {
      const plannedCalories = recipe.nutrition?.calories
        ? recipe.nutrition.calories * servings
        : undefined;

      const { data: newEntry } = await (amplifyClient.models as any).MealPlanEntry.create({
        userId: session.user.id,
        date: formatDateForAPI(date),
        mealType,
        recipeId: recipe.id,
        recipeType: recipe.source === 'AI' ? 'SmartRecipe' : 'Recipe',
        servings,
        plannedCalories,
      });

      if (newEntry) {
        setMealPlanEntries(prev => [...prev, { ...newEntry, recipe }]);
        return true;
      }
    } catch (err) {
      console.error('Error adding meal plan entry:', err);
      setError('Failed to add meal to plan - backend not available');
    }
    return false;
  }, [session?.user?.id]);

  // Remove entry
  const removeMealPlanEntry = useCallback(async (entryId: string) => {
    // Check if backend is available
    if (!amplifyClient?.models || !(amplifyClient.models as any).MealPlanEntry) {
      setError('Meal planning not available - backend not configured');
      return false;
    }

    try {
      await (amplifyClient.models as any).MealPlanEntry.delete({ id: entryId });
      setMealPlanEntries(prev => prev.filter(entry => (entry as any).id !== entryId));
      return true;
    } catch (err) {
      console.error('Error removing meal plan entry:', err);
      setError('Failed to remove meal from plan - backend not available');
      return false;
    }
  }, []);

  // Update entry
  const updateMealPlanEntry = useCallback(async (
    entryId: string,
    updates: Partial<MealPlanEntry>
  ) => {
    // Check if backend is available
    if (!amplifyClient?.models || !(amplifyClient.models as any).MealPlanEntry) {
      setError('Meal planning not available - backend not configured');
      return false;
    }

    try {
      const { data: updatedEntry } = await (amplifyClient.models as any).MealPlanEntry.update({
        id: entryId,
        ...updates,
      });

      if (updatedEntry) {
        setMealPlanEntries(prev => prev.map(entry =>
          (entry as any).id === entryId ? { ...entry, ...updatedEntry } : entry
        ));
        return true;
      }
    } catch (err) {
      console.error('Error updating meal plan entry:', err);
      setError('Failed to update meal - backend not available');
    }
    return false;
  }, []);

  // Get meals for date
  const getMealsForDate = useCallback((date: Date): DayMealPlan => {
    const dateStr = formatDateForAPI(date);
    const dayEntries = mealPlanEntries.filter(entry => (entry as any).date === dateStr);

    const meals = {
      breakfast: dayEntries.filter(entry => (entry as any).mealType === 'breakfast'),
      snack1: dayEntries.filter(entry => (entry as any).mealType === 'snack1' as MealType),
      lunch: dayEntries.filter(entry => (entry as any).mealType === 'lunch'),
      snack2: dayEntries.filter(entry => (entry as any).mealType === 'snack2' as MealType),
      dinner: dayEntries.filter(entry => (entry as any).mealType === 'dinner'),
    };

    const dayRecipes = dayEntries
      .filter(entry => entry.recipe)
      .map(entry => entry.recipe!);
    
    // Safe nutrition calculation
    const nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    try {
      const calculatedNutrition = calculateDailyNutrition(dayEntries as any, dayRecipes);
      Object.assign(nutrition, calculatedNutrition);
    } catch (err) {
      console.warn('Error calculating nutrition:', err);
    }

    return { date, meals, nutrition };
  }, [mealPlanEntries]);

  // Get week plan
  const getWeekMealPlan = useCallback((): WeekMealPlan => {
    const weekDates = getWeekDates(weekStartDate);
    const days = weekDates.map(date => getMealsForDate(date));

    const weeklyNutrition = days.reduce(
      (total, day) => ({
        calories: total.calories + day.nutrition.calories,
        protein: total.protein + day.nutrition.protein,
        carbs: total.carbs + day.nutrition.carbs,
        fat: total.fat + day.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return { weekStartDate, days, weeklyNutrition };
  }, [weekStartDate, getMealsForDate]);

  // Navigate to week
  const navigateToWeek = useCallback((newWeekStart: Date) => {
    setWeekStartDate(newWeekStart);
  }, []);

  // Load data when week changes
  useEffect(() => {
    loadMealPlanEntries();
  }, [loadMealPlanEntries]);

  return {
    weekMealPlan: getWeekMealPlan(),
    loading,
    error,
    recipes,
    addMealPlanEntry,
    removeMealPlanEntry,
    updateMealPlanEntry,
    navigateToWeek,
    getMealsForDate,
    refreshData: loadMealPlanEntries,
  };
};