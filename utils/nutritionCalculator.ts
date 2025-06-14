import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];
type MealPlanEntry = Schema['MealPlanEntry']['type'];

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutrition extends NutritionData {
  meals: {
    breakfast: NutritionData;
    snack1: NutritionData;
    lunch: NutritionData;
    snack2: NutritionData;
    dinner: NutritionData;
  };
}

/**
 * Calculate nutrition for a single recipe with serving adjustment
 */
export const calculateRecipeNutrition = (
  recipe: Recipe,
  servings: number = 1
): NutritionData => {
  const baseServings = recipe.servings || 1;
  const multiplier = servings / baseServings;

  return {
    calories: (recipe.calories || 0) * multiplier,
    protein: (recipe.protein || 0) * multiplier,
    carbs: (recipe.carbs || 0) * multiplier,
    fat: (recipe.fat || 0) * multiplier,
  };
};

/**
 * Calculate total nutrition for multiple recipes
 */
export const calculateTotalNutrition = (
  nutritionData: NutritionData[]
): NutritionData => {
  return nutritionData.reduce(
    (total, nutrition) => ({
      calories: total.calories + nutrition.calories,
      protein: total.protein + nutrition.protein,
      carbs: total.carbs + nutrition.carbs,
      fat: total.fat + nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

/**
 * Calculate daily nutrition from meal plan entries and recipes
 */
export const calculateDailyNutrition = (
  mealPlanEntries: MealPlanEntry[],
  recipes: Recipe[]
): DailyNutrition => {
  const recipeMap = new Map(recipes.map(recipe => [recipe.id, recipe]));
  
  const mealNutrition = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack1: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack2: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };

  mealPlanEntries.forEach(entry => {
    const recipe = recipeMap.get(entry.recipeId);
    if (recipe && entry.mealType) {
      const nutrition = calculateRecipeNutrition(recipe, entry.servings || 1);
      const mealType = entry.mealType as keyof typeof mealNutrition;
      
      mealNutrition[mealType].calories += nutrition.calories;
      mealNutrition[mealType].protein += nutrition.protein;
      mealNutrition[mealType].carbs += nutrition.carbs;
      mealNutrition[mealType].fat += nutrition.fat;
    }
  });

  const totalNutrition = calculateTotalNutrition(Object.values(mealNutrition));

  return {
    ...totalNutrition,
    meals: mealNutrition,
  };
};

/**
 * Calculate weekly nutrition summary
 */
export const calculateWeeklyNutrition = (
  dailyNutritionData: DailyNutrition[]
): NutritionData & { averageDaily: NutritionData } => {
  const weeklyTotal = calculateTotalNutrition(dailyNutritionData);
  const days = dailyNutritionData.length || 1;

  return {
    ...weeklyTotal,
    averageDaily: {
      calories: weeklyTotal.calories / days,
      protein: weeklyTotal.protein / days,
      carbs: weeklyTotal.carbs / days,
      fat: weeklyTotal.fat / days,
    },
  };
};

/**
 * Get nutrition goals based on user preferences (placeholder for future)
 */
export const getNutritionGoals = (): NutritionData => {
  // This would eventually come from user profile/settings
  return {
    calories: 2000,
    protein: 150, // grams
    carbs: 250,   // grams
    fat: 67,      // grams
  };
};

/**
 * Calculate nutrition progress towards goals
 */
export const calculateNutritionProgress = (
  actual: NutritionData,
  goals: NutritionData = getNutritionGoals()
) => {
  return {
    calories: {
      actual: actual.calories,
      goal: goals.calories,
      percentage: (actual.calories / goals.calories) * 100,
      remaining: goals.calories - actual.calories,
    },
    protein: {
      actual: actual.protein,
      goal: goals.protein,
      percentage: (actual.protein / goals.protein) * 100,
      remaining: goals.protein - actual.protein,
    },
    carbs: {
      actual: actual.carbs,
      goal: goals.carbs,
      percentage: (actual.carbs / goals.carbs) * 100,
      remaining: goals.carbs - actual.carbs,
    },
    fat: {
      actual: actual.fat,
      goal: goals.fat,
      percentage: (actual.fat / goals.fat) * 100,
      remaining: goals.fat - actual.fat,
    },
  };
};