import { useState, useEffect, useCallback } from 'react';
import { amplifyClient } from '../lib/amplify';
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

type Recipe = Schema['Recipe']['type'];
type MealPlanEntry = Schema['MealPlanEntry']['type'];
type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load meal plan entries for the current week
  const loadMealPlanEntries = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const weekDates = getWeekDates(weekStartDate);
      const startDate = formatDateForAPI(weekDates[0]);
      const endDate = formatDateForAPI(weekDates[6]);

      // Load meal plan entries for the week
      const { data: entries } = await amplifyClient.models.MealPlanEntry.list({
        filter: {
          userId: { eq: session.user.id },
          date: { between: [startDate, endDate] }
        }
      });

      // Load all recipes for the user
      const { data: userRecipes } = await amplifyClient.models.Recipe.list({
        filter: { userId: { eq: session.user.id } }
      });

      setRecipes(userRecipes || []);

      // Combine entries with their recipes
      const entriesWithRecipes: MealPlanEntryWithRecipe[] = (entries || []).map(entry => ({
        ...entry,
        recipe: userRecipes?.find(recipe => recipe.id === entry.recipeId)
      }));

      setMealPlanEntries(entriesWithRecipes);
    } catch (err) {
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, weekStartDate]);

  // Add a meal plan entry
  const addMealPlanEntry = useCallback(async (
    date: Date,
    mealType: MealType,
    recipe: Recipe,
    servings: number = 1
  ) => {
    if (!session?.user?.id) return false;

    try {
      const plannedCalories = recipe.calories ? recipe.calories * servings : undefined;

      const { data: newEntry } = await amplifyClient.models.MealPlanEntry.create({
        userId: session.user.id,
        date: formatDateForAPI(date),
        mealType,
        recipeId: recipe.id,
        servings,
        plannedCalories,
      });

      if (newEntry) {
        const entryWithRecipe: MealPlanEntryWithRecipe = {
          ...newEntry,
          recipe
        };
        setMealPlanEntries(prev => [...prev, entryWithRecipe]);
        return true;
      }
    } catch (err) {
      console.error('Error adding meal plan entry:', err);
      setError('Failed to add meal to plan');
    }
    return false;
  }, [session?.user?.id]);

  // Remove a meal plan entry
  const removeMealPlanEntry = useCallback(async (entryId: string) => {
    try {
      await amplifyClient.models.MealPlanEntry.delete({ id: entryId });
      setMealPlanEntries(prev => prev.filter(entry => entry.id !== entryId));
      return true;
    } catch (err) {
      console.error('Error removing meal plan entry:', err);
      setError('Failed to remove meal from plan');
      return false;
    }
  }, []);

  // Update a meal plan entry
  const updateMealPlanEntry = useCallback(async (
    entryId: string,
    updates: { servings?: number; notes?: string }
  ) => {
    try {
      const { data: updatedEntry } = await amplifyClient.models.MealPlanEntry.update({
        id: entryId,
        ...updates
      });

      if (updatedEntry) {
        setMealPlanEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, ...updatedEntry }
            : entry
        ));
        return true;
      }
    } catch (err) {
      console.error('Error updating meal plan entry:', err);
      setError('Failed to update meal');
    }
    return false;
  }, []);

  // Get meals for a specific date
  const getMealsForDate = useCallback((date: Date): DayMealPlan => {
    const dateStr = formatDateForAPI(date);
    const dayEntries = mealPlanEntries.filter(entry => entry.date === dateStr);

    const meals = {
      breakfast: dayEntries.filter(entry => entry.mealType === 'breakfast'),
      snack1: dayEntries.filter(entry => entry.mealType === 'snack1'),
      lunch: dayEntries.filter(entry => entry.mealType === 'lunch'),
      snack2: dayEntries.filter(entry => entry.mealType === 'snack2'),
      dinner: dayEntries.filter(entry => entry.mealType === 'dinner'),
    };

    // Calculate nutrition for the day
    const dayRecipes = dayEntries
      .filter(entry => entry.recipe)
      .map(entry => entry.recipe!);
    
    const nutrition = calculateDailyNutrition(dayEntries, dayRecipes);

    return {
      date,
      meals,
      nutrition,
    };
  }, [mealPlanEntries]);

  // Get week meal plan
  const getWeekMealPlan = useCallback((): WeekMealPlan => {
    const weekDates = getWeekDates(weekStartDate);
    const days = weekDates.map(date => getMealsForDate(date));

    // Calculate weekly nutrition totals
    const weeklyNutrition = days.reduce(
      (total, day) => ({
        calories: total.calories + day.nutrition.calories,
        protein: total.protein + day.nutrition.protein,
        carbs: total.carbs + day.nutrition.carbs,
        fat: total.fat + day.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      weekStartDate,
      days,
      weeklyNutrition,
    };
  }, [weekStartDate, getMealsForDate]);

  // Navigate to different week
  const navigateToWeek = useCallback((newWeekStart: Date) => {
    setWeekStartDate(newWeekStart);
  }, []);

  // Load data when week changes
  useEffect(() => {
    loadMealPlanEntries();
  }, [loadMealPlanEntries]);

  return {
    // State
    weekMealPlan: getWeekMealPlan(),
    loading,
    error,
    recipes,

    // Actions
    addMealPlanEntry,
    removeMealPlanEntry,
    updateMealPlanEntry,
    
    // Navigation
    navigateToWeek,
    
    // Utilities
    getMealsForDate,
    refreshData: loadMealPlanEntries,
  };
};