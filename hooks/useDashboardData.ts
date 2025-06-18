import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { amplifyClient } from '../lib/amplify';
import { useMealPlanner } from './useMealPlanner';
import { useUserProfile } from './useUserProfile';
import { getWeekStartDate } from '../utils/dateUtils';

interface MealSlot {
  id?: string;
  name?: string;
  calories?: number;
  imageUrl?: string;
  isEmpty: boolean;
}

interface NutritionStats {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

interface DashboardData {
  todaysMeals: {
    breakfast: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
  };
  nutritionStats: NutritionStats;
  streak: number;
  recipesCount: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const { session } = useAuth();
  const { profile, getMacroTargets, getHealthMetrics } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipesCount, setRecipesCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // Get today's meal plan data
  const today = new Date();
  const weekStart = getWeekStartDate(today);
  const { weekMealPlan } = useMealPlanner(weekStart);

  // Find today's meals
  const todaysMealPlan = weekMealPlan.days.find(day => 
    day.date.toDateString() === today.toDateString()
  );

  // Format meal slots
  const formatMealSlot = (meals: any[]): MealSlot => {
    if (!meals || meals.length === 0) {
      return { isEmpty: true };
    }
    
    const meal = meals[0]; // Take first meal if multiple
    return {
      id: meal.recipe?.id,
      name: meal.recipe?.name,
      calories: meal.recipe?.calories ? Math.round(meal.recipe.calories * (meal.servings || 1)) : undefined,
      imageUrl: meal.recipe?.imageUrl,
      isEmpty: false,
    };
  };

  const todaysMeals = {
    breakfast: formatMealSlot(todaysMealPlan?.meals.breakfast || []),
    lunch: formatMealSlot(todaysMealPlan?.meals.lunch || []),
    dinner: formatMealSlot(todaysMealPlan?.meals.dinner || []),
  };

  // Calculate nutrition stats with real user targets
  const macroTargets = getMacroTargets();
  const healthMetrics = getHealthMetrics();
  
  const nutritionStats: NutritionStats = {
    calories: {
      current: Math.round(todaysMealPlan?.nutrition.calories || 0),
      target: profile?.dailyCalorieTarget || healthMetrics?.bmr || 2000,
    },
    protein: {
      current: Math.round(todaysMealPlan?.nutrition.protein || 0),
      target: Math.round(macroTargets?.protein || profile?.proteinTarget || 150),
    },
    carbs: {
      current: Math.round(todaysMealPlan?.nutrition.carbs || 0),
      target: Math.round(macroTargets?.carbs || profile?.carbsTarget || 250),
    },
    fat: {
      current: Math.round(todaysMealPlan?.nutrition.fat || 0),
      target: Math.round(macroTargets?.fat || profile?.fatTarget || 65),
    },
  };

  // Load additional dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Load recipes count
      const { data: recipes } = await amplifyClient.models.Recipe.list({
        filter: { userId: { eq: session.user.id } }
      });
      setRecipesCount(recipes?.length || 0);

      // Calculate streak (simplified - would need more complex logic in real app)
      // For now, just set a mock streak
      setStreak(5);

      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    todaysMeals,
    nutritionStats,
    streak,
    recipesCount,
    loading,
    error,
  };
}