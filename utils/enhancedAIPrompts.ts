import { useUserProfile } from '../hooks/useUserProfile';

interface RecipeStructure {
  name: string;
  description: string;
  cuisine: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
  instructions: {
    step: number;
    instruction: string;
    time?: number;
    temperature?: number;
    tips?: string;
  }[];
  tags: string[];
  tips: string[];
  nutritionNotes?: string;
}

export const generateEnhancedRecipePrompt = (userProfile: any): string => {
  const dietaryInfo = userProfile ? {
    restrictions: userProfile.dietaryRestrictions?.join(', ') || 'None',
    allergies: userProfile.allergies?.join(', ') || 'None',
    dislikes: userProfile.dislikedIngredients?.join(', ') || 'None',
    cuisines: userProfile.preferredCuisines?.join(', ') || 'Various',
    calorieTarget: userProfile.dailyCalorieTarget || 2000,
    weightGoal: userProfile.weightGoal || 'maintenance',
    activityLevel: userProfile.activityLevel || 'moderate'
  } : {
    restrictions: 'None',
    allergies: 'None', 
    dislikes: 'None',
    cuisines: 'Various',
    calorieTarget: 2000,
    weightGoal: 'maintenance',
    activityLevel: 'moderate'
  };

  return `
You are a professional chef and nutritionist creating restaurant-quality recipes. Generate 3 detailed, practical recipes that follow this EXACT JSON structure.

USER PROFILE:
- Dietary restrictions: ${dietaryInfo.restrictions}
- Allergies: ${dietaryInfo.allergies}
- Disliked ingredients: ${dietaryInfo.dislikes}
- Preferred cuisines: ${dietaryInfo.cuisines}
- Daily calorie target: ${dietaryInfo.calorieTarget}
- Weight goal: ${dietaryInfo.weightGoal}
- Activity level: ${dietaryInfo.activityLevel}

RECIPE REQUIREMENTS:
1. Each recipe should be 400-600 calories per serving
2. Include accurate nutrition information (protein, carbs, fat)
3. Use precise measurements and cooking times
4. Provide detailed, step-by-step instructions
5. Include professional cooking tips
6. Ensure recipes are practical for home cooking
7. Respect all dietary restrictions and allergies
8. Prefer user's favorite cuisines when possible

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no code blocks. Start with [ and end with ].

IMPORTANT: Each recipe MUST have a specific, creative name like "Garlic Herb Chicken Skillet", "Mediterranean Quinoa Bowl", or "Spicy Thai Basil Stir-Fry". Do NOT use generic names.

JSON STRUCTURE (exactly 3 recipes):
[
  {
    "name": "Garlic Herb Chicken Skillet",
    "description": "Tender chicken with aromatic herbs and vegetables",
    "cuisine": "American",
    "servings": 4,
    "prepTime": 15,
    "cookTime": 25,
    "totalTime": 40,
    "difficulty": "Easy",
    "calories": 485,
    "protein": 28,
    "carbs": 45,
    "fat": 18,
    "ingredients": [
      {"name": "chicken breast", "quantity": 1, "unit": "lb", "notes": "diced"},
      {"name": "jasmine rice", "quantity": 1, "unit": "cup", "notes": ""},
      {"name": "yellow onion", "quantity": 1, "unit": "medium", "notes": "diced"},
      {"name": "olive oil", "quantity": 2, "unit": "tbsp", "notes": ""}
    ],
    "instructions": [
      {"step": 1, "instruction": "Heat olive oil in large skillet over medium heat", "time": 2, "tips": "Heat until shimmering"},
      {"step": 2, "instruction": "Add diced chicken and cook until golden brown", "time": 8, "tips": "Don't overcrowd the pan"},
      {"step": 3, "instruction": "Add onion and rice, stir to combine", "time": 5, "tips": "Season with salt and pepper"}
    ],
    "tags": ["quick", "healthy"],
    "tips": ["Let rest 5 minutes before serving", "Can prep ingredients ahead"],
    "nutritionNotes": "High protein, balanced meal"
  },
  {
    "name": "Mediterranean Quinoa Bowl",
    "description": "Fresh quinoa with vegetables and herbs",
    "cuisine": "Mediterranean",
    "servings": 4,
    "prepTime": 10,
    "cookTime": 20,
    "totalTime": 30,
    "difficulty": "Easy",
    "calories": 420,
    "protein": 15,
    "carbs": 55,
    "fat": 12,
    "ingredients": [
      {"name": "quinoa", "quantity": 1, "unit": "cup", "notes": "rinsed"},
      {"name": "cucumber", "quantity": 1, "unit": "large", "notes": "diced"},
      {"name": "cherry tomatoes", "quantity": 1, "unit": "cup", "notes": "halved"},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "notes": ""}
    ],
    "instructions": [
      {"step": 1, "instruction": "Cook quinoa according to package directions", "time": 15, "tips": "Use vegetable broth for extra flavor"},
      {"step": 2, "instruction": "Dice cucumber and halve cherry tomatoes", "time": 5, "tips": "Keep vegetables crisp"},
      {"step": 3, "instruction": "Mix quinoa with vegetables and olive oil", "time": 2, "tips": "Season with herbs and lemon"}
    ],
    "tags": ["vegetarian", "healthy", "meal-prep"],
    "tips": ["Stores well in refrigerator for 3 days", "Add feta cheese for extra protein"],
    "nutritionNotes": "Complete protein from quinoa, rich in fiber"
  }
]

Generate 3 complete recipes with SPECIFIC, CREATIVE NAMES following this exact structure.

Generate 3 complete recipes following this exact structure. Focus on:
- Accurate cooking times and temperatures
- Proper ingredient measurements
- Detailed step-by-step instructions
- Professional cooking techniques
- Nutritional accuracy
- Home cook accessibility
`;
};

export const generateQuickMealPrompt = (userProfile: any, mealType: 'breakfast' | 'lunch' | 'dinner'): string => {
  const mealSpecs = {
    breakfast: {
      timeLimit: 15,
      calorieRange: '300-500',
      focus: 'energy and protein to start the day'
    },
    lunch: {
      timeLimit: 20,
      calorieRange: '400-600', 
      focus: 'sustained energy and satisfaction'
    },
    dinner: {
      timeLimit: 30,
      calorieRange: '500-700',
      focus: 'comfort and nutritional completeness'
    }
  };

  const spec = mealSpecs[mealType];
  
  return `
Generate 2 quick ${mealType} recipes that can be prepared in ${spec.timeLimit} minutes or less.

SPECIFICATIONS:
- Prep + cook time: Maximum ${spec.timeLimit} minutes
- Calories per serving: ${spec.calorieRange}
- Focus: ${spec.focus}
- Skill level: Easy to Medium
- Equipment: Basic home kitchen tools only

USER PREFERENCES:
${userProfile ? `
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Preferred cuisines: ${userProfile.preferredCuisines?.join(', ') || 'Various'}
` : '- No specific restrictions'}

Return exactly 2 recipes in the enhanced JSON format with:
- Precise timing for each step
- One-pot or minimal cleanup methods preferred
- Ingredient substitution suggestions in tips
- Make-ahead options where applicable

CRITICAL: Return ONLY valid JSON array starting with [ and ending with ].
`;
};

export const generateSeasonalPrompt = (userProfile: any, season: string): string => {
  const seasonalIngredients = {
    spring: 'asparagus, peas, radishes, spring onions, strawberries, artichokes, fresh herbs',
    summer: 'tomatoes, zucchini, corn, berries, stone fruits, basil, peppers',
    fall: 'squash, apples, pumpkin, brussels sprouts, root vegetables, cranberries',
    winter: 'citrus fruits, hearty greens, cabbage, potatoes, winter squash, dried beans'
  };

  return `
Generate 3 seasonal ${season} recipes featuring fresh, in-season ingredients.

SEASONAL FOCUS:
- Primary ingredients: ${seasonalIngredients[season as keyof typeof seasonalIngredients]}
- Cooking methods appropriate for ${season} weather
- Comfort level suited for the season
- Fresh, peak-flavor ingredients

USER PROFILE:
${userProfile ? `
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Preferred cuisines: ${userProfile.preferredCuisines?.join(', ') || 'Various'}
- Calorie target: ${userProfile.dailyCalorieTarget || 2000} per day
` : '- No specific restrictions'}

REQUIREMENTS:
- Feature at least 2 seasonal ingredients per recipe
- Include storage and freshness tips
- Suggest seasonal ingredient substitutions
- Optimize for ${season} meal preferences

Return exactly 3 recipes in the enhanced JSON format.
CRITICAL: Return ONLY valid JSON array starting with [ and ending with ].
`;
};

export const generateCuisineSpecificPrompt = (userProfile: any, cuisine: string): string => {
  return `
Generate 3 authentic ${cuisine} recipes with traditional techniques and ingredients.

CUISINE FOCUS: ${cuisine}
- Use traditional cooking methods and ingredients
- Include cultural context and cooking tips
- Suggest authentic ingredient sources when needed
- Respect traditional flavor profiles and presentations

USER CONSIDERATIONS:
${userProfile ? `
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Cooking skill level: Beginner to Intermediate
` : '- No specific restrictions'}

RECIPE REQUIREMENTS:
- Authentic ingredient names and measurements
- Traditional cooking techniques explained clearly
- Cultural serving suggestions
- Ingredient substitutions for hard-to-find items
- Equipment alternatives for specialized tools

Include in tips section:
- Cultural background of the dish
- Traditional serving occasions
- Authentic accompaniments
- Storage and reheating instructions

Return exactly 3 recipes in the enhanced JSON format.
CRITICAL: Return ONLY valid JSON array starting with [ and ending with ].
`;
};

export const generateHealthFocusedPrompt = (userProfile: any, healthGoal: string): string => {
  const healthSpecs = {
    'weight-loss': {
      calories: '300-450',
      focus: 'high protein, high fiber, low calorie density',
      techniques: 'grilling, steaming, roasting with minimal oil'
    },
    'muscle-gain': {
      calories: '500-700', 
      focus: 'high protein (25-35g per serving), complex carbs',
      techniques: 'protein-rich cooking methods, post-workout timing'
    },
    'heart-healthy': {
      calories: '400-600',
      focus: 'omega-3 fats, low sodium, whole grains, vegetables',
      techniques: 'minimal processing, healthy fats, herbs for flavor'
    },
    'diabetes-friendly': {
      calories: '400-500',
      focus: 'low glycemic index, balanced macros, fiber-rich',
      techniques: 'portion control, complex carbs, lean proteins'
    }
  };

  const spec = healthSpecs[healthGoal as keyof typeof healthSpecs] || healthSpecs['heart-healthy'];

  return `
Generate 3 ${healthGoal} recipes optimized for health and nutrition.

HEALTH FOCUS: ${healthGoal}
- Calorie range: ${spec.calories} per serving
- Nutritional focus: ${spec.focus}
- Cooking techniques: ${spec.techniques}

USER PROFILE:
${userProfile ? `
- Current dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Weight goal: ${userProfile.weightGoal || 'maintenance'}
- Activity level: ${userProfile.activityLevel || 'moderate'}
` : '- No specific restrictions'}

NUTRITIONAL REQUIREMENTS:
- Accurate macro calculations
- Micronutrient considerations
- Portion size optimization
- Satiety factors
- Blood sugar impact (if relevant)

Include in nutritionNotes:
- Specific health benefits
- Timing recommendations (if applicable)
- Portion control guidance
- Meal prep suitability

Return exactly 3 recipes in the enhanced JSON format with accurate nutrition data.
CRITICAL: Return ONLY valid JSON array starting with [ and ending with ].
`;
};

// Nutrition calculation helper
export const calculateRecipeNutrition = (ingredients: any[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} => {
  // This is a simplified nutrition calculator
  // In a real app, you'd integrate with a nutrition database API
  
  const nutritionDatabase: Record<string, { cal: number; prot: number; carb: number; fat: number }> = {
    // Per 100g values - simplified database
    'chicken breast': { cal: 165, prot: 31, carb: 0, fat: 3.6 },
    'rice': { cal: 130, prot: 2.7, carb: 28, fat: 0.3 },
    'olive oil': { cal: 884, prot: 0, carb: 0, fat: 100 },
    'onion': { cal: 40, prot: 1.1, carb: 9.3, fat: 0.1 },
    'garlic': { cal: 149, prot: 6.4, carb: 33, fat: 0.5 },
    // Add more ingredients as needed
  };

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  ingredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase();
    const match = Object.keys(nutritionDatabase).find(k => key.includes(k));
    
    if (match) {
      const nutrition = nutritionDatabase[match];
      const weight = convertToGrams(ingredient.quantity, ingredient.unit);
      const factor = weight / 100; // Convert to per 100g basis
      
      totalCalories += nutrition.cal * factor;
      totalProtein += nutrition.prot * factor;
      totalCarbs += nutrition.carb * factor;
      totalFat += nutrition.fat * factor;
    }
  });

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
  };
};

const convertToGrams = (quantity: number, unit: string): number => {
  const conversions: Record<string, number> = {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'lb': 453.592,
    'pound': 453.592,
    'oz': 28.3495,
    'ounce': 28.3495,
    'cup': 240, // Approximate for liquids
    'tbsp': 15,
    'tablespoon': 15,
    'tsp': 5,
    'teaspoon': 5,
    'ml': 1, // For liquids, assuming density ~1
    'liter': 1000,
    // Add more conversions as needed
  };

  const normalizedUnit = unit.toLowerCase().replace(/s$/, ''); // Remove plural 's'
  return quantity * (conversions[normalizedUnit] || 100); // Default to 100g if unknown
};