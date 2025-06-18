import { categorizeIngredient } from './shoppingListGenerator';

// Comprehensive nutrition database for common ingredients
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  unsaturatedFat?: number;
  vitamins?: {
    a?: number; // IU
    c?: number; // mg
    d?: number; // IU
    e?: number; // mg
    k?: number; // mcg
    b1?: number; // mg (thiamine)
    b2?: number; // mg (riboflavin)
    b3?: number; // mg (niacin)
    b6?: number; // mg
    b12?: number; // mcg
    folate?: number; // mcg
  };
  minerals?: {
    calcium?: number; // mg
    iron?: number; // mg
    magnesium?: number; // mg
    phosphorus?: number; // mg
    potassium?: number; // mg
    zinc?: number; // mg
  };
}

export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  standardizedQuantity: number; // in grams
  nutrition: NutritionData;
}

export interface RecipeNutrition extends NutritionData {
  ingredients: ParsedIngredient[];
  servings: number;
  nutritionPerServing: NutritionData;
  macroPercentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
  healthScore: number;
  dietaryLabels: string[];
  allergens: string[];
  glycemicLoad: number;
}

// Nutrition database per 100g
const NUTRITION_DATABASE: Record<string, NutritionData> = {
  // Proteins
  'chicken breast': {
    calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74,
    cholesterol: 85, saturatedFat: 1.0, unsaturatedFat: 2.6,
    vitamins: { b3: 14.8, b6: 0.9, b12: 0.3 },
    minerals: { phosphorus: 228, potassium: 256 }
  },
  'salmon': {
    calories: 208, protein: 22, carbs: 0, fat: 12, fiber: 0, sodium: 59,
    cholesterol: 59, saturatedFat: 3.8, unsaturatedFat: 8.2,
    vitamins: { d: 360, b12: 4.8 },
    minerals: { potassium: 363, phosphorus: 252 }
  },
  'ground beef': {
    calories: 254, protein: 26, carbs: 0, fat: 15, fiber: 0, sodium: 66,
    cholesterol: 78, saturatedFat: 6.2, unsaturatedFat: 8.8,
    vitamins: { b12: 2.6, b3: 5.8 },
    minerals: { iron: 2.7, zinc: 4.8 }
  },
  'eggs': {
    calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124,
    cholesterol: 372, saturatedFat: 3.3, unsaturatedFat: 7.7,
    vitamins: { a: 540, d: 82, b12: 0.9 },
    minerals: { iron: 1.8, phosphorus: 198 }
  },
  'tofu': {
    calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sodium: 7,
    cholesterol: 0, saturatedFat: 0.7, unsaturatedFat: 4.1,
    vitamins: { folate: 15 },
    minerals: { calcium: 350, iron: 5.4, magnesium: 30 }
  },

  // Grains & Carbs
  'rice': {
    calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1,
    vitamins: { b1: 0.07, b3: 1.6 },
    minerals: { magnesium: 25, phosphorus: 68 }
  },
  'pasta': {
    calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sodium: 6,
    vitamins: { folate: 18, b1: 0.09 },
    minerals: { iron: 1.3, magnesium: 18 }
  },
  'quinoa': {
    calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8, sodium: 7,
    vitamins: { folate: 42, e: 0.6 },
    minerals: { iron: 1.5, magnesium: 64, phosphorus: 152 }
  },
  'oats': {
    calories: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, sodium: 2,
    vitamins: { b1: 0.8, folate: 56 },
    minerals: { iron: 4.7, magnesium: 177, zinc: 4.0 }
  },

  // Vegetables
  'broccoli': {
    calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sodium: 33,
    vitamins: { a: 623, c: 89.2, k: 102 },
    minerals: { calcium: 47, iron: 0.7, potassium: 316 }
  },
  'spinach': {
    calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sodium: 79,
    vitamins: { a: 9377, c: 28.1, k: 483, folate: 194 },
    minerals: { calcium: 99, iron: 2.7, magnesium: 79 }
  },
  'bell pepper': {
    calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5, sodium: 4,
    vitamins: { a: 3131, c: 190, b6: 0.3 },
    minerals: { potassium: 211, magnesium: 12 }
  },
  'tomato': {
    calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5,
    vitamins: { a: 833, c: 14, k: 7.9 },
    minerals: { potassium: 237, phosphorus: 24 }
  },
  'onion': {
    calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sodium: 4,
    vitamins: { c: 7.4, b6: 0.1, folate: 19 },
    minerals: { potassium: 146, phosphorus: 29 }
  },
  'carrot': {
    calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sodium: 69,
    vitamins: { a: 16706, c: 5.9, k: 13.2 },
    minerals: { potassium: 320, calcium: 33 }
  },

  // Fruits
  'apple': {
    calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sodium: 1,
    vitamins: { c: 4.6, k: 2.2 },
    minerals: { potassium: 107, phosphorus: 11 }
  },
  'banana': {
    calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sodium: 1,
    vitamins: { c: 8.7, b6: 0.4, folate: 20 },
    minerals: { potassium: 358, magnesium: 27 }
  },
  'orange': {
    calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sodium: 0,
    vitamins: { a: 225, c: 53.2, folate: 40 },
    minerals: { calcium: 40, potassium: 181 }
  },

  // Dairy
  'milk': {
    calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sodium: 44,
    cholesterol: 5, saturatedFat: 0.6, unsaturatedFat: 0.4,
    vitamins: { a: 46, d: 40, b12: 0.4 },
    minerals: { calcium: 113, phosphorus: 84 }
  },
  'cheese': {
    calories: 113, protein: 7, carbs: 1, fat: 9, fiber: 0, sodium: 172,
    cholesterol: 27, saturatedFat: 5.7, unsaturatedFat: 3.3,
    vitamins: { a: 300, b12: 0.2 },
    minerals: { calcium: 200, phosphorus: 158 }
  },
  'yogurt': {
    calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sodium: 36,
    cholesterol: 5, saturatedFat: 0.1, unsaturatedFat: 0.3,
    vitamins: { b12: 0.5, b2: 0.3 },
    minerals: { calcium: 110, phosphorus: 135 }
  },

  // Fats & Oils
  'olive oil': {
    calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 2,
    cholesterol: 0, saturatedFat: 13.8, unsaturatedFat: 86.2,
    vitamins: { e: 14.4, k: 60.2 }
  },
  'butter': {
    calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 11,
    cholesterol: 215, saturatedFat: 51.4, unsaturatedFat: 29.6,
    vitamins: { a: 2499, d: 60, e: 2.3 }
  },

  // Nuts & Seeds
  'almonds': {
    calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, sodium: 1,
    cholesterol: 0, saturatedFat: 3.8, unsaturatedFat: 46.2,
    vitamins: { e: 25.6, b2: 1.0 },
    minerals: { calcium: 269, iron: 3.9, magnesium: 270 }
  },
  'walnuts': {
    calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, sodium: 2,
    cholesterol: 0, saturatedFat: 6.1, unsaturatedFat: 58.9,
    vitamins: { folate: 98 },
    minerals: { magnesium: 158, phosphorus: 346 }
  },

  // Legumes
  'black beans': {
    calories: 132, protein: 8.9, carbs: 23, fat: 0.5, fiber: 8.7, sodium: 2,
    vitamins: { folate: 149, b1: 0.2 },
    minerals: { iron: 2.1, magnesium: 70, potassium: 355 }
  },
  'chickpeas': {
    calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sodium: 7,
    vitamins: { folate: 172, b6: 0.1 },
    minerals: { iron: 2.9, magnesium: 48, potassium: 291 }
  },
};

export class AdvancedNutritionCalculator {
  // Parse ingredient string and extract quantity
  static parseIngredientQuantity(ingredient: string): { name: string; quantity: number; unit: string } {
    // Enhanced parsing for ingredient quantities
    const patterns = [
      // Fractions: 1/2 cup, 1 1/2 cups
      /^(\d+(?:\s+\d+\/\d+|\s*\/\s*\d+)?)\s+(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|oz|ounces?|lb|lbs|pounds?|piece|pieces|clove|cloves)\s+(.+)$/i,
      // No unit: 2 large eggs, 3 onions
      /^(\d+(?:\.\d+)?)\s+(large|medium|small|whole)?\s*(.+)$/i,
      // Simple number: 2 eggs
      /^(\d+(?:\.\d+)?)\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = ingredient.match(pattern);
      if (match) {
        let quantity = this.parseQuantityString(match[1]);
        let unit = 'piece';
        let name = match[match.length - 1].trim();

        // If we have a unit in the pattern
        if (match.length === 4 && match[2].match(/^(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|oz|ounces?|lb|lbs|pounds?|piece|pieces|clove|cloves)$/i)) {
          unit = this.normalizeUnit(match[2]);
        }

        return { name, quantity, unit };
      }
    }

    // Fallback: assume 1 piece
    return { name: ingredient.trim(), quantity: 1, unit: 'piece' };
  }

  static parseQuantityString(quantityStr: string): number {
    // Handle fractions and mixed numbers
    if (quantityStr.includes('/')) {
      const parts = quantityStr.trim().split(/\s+/);
      if (parts.length === 2) {
        // Mixed number: "1 1/2"
        const whole = parseInt(parts[0]);
        const [numerator, denominator] = parts[1].split('/').map(Number);
        return whole + numerator / denominator;
      } else {
        // Simple fraction: "1/2"
        const [numerator, denominator] = quantityStr.split('/').map(Number);
        return numerator / denominator;
      }
    }
    return parseFloat(quantityStr) || 1;
  }

  static normalizeUnit(unit: string): string {
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
      'cloves': 'clove', 'clove': 'clove',
    };
    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }

  // Convert various units to grams for standardized calculation
  static convertToGrams(quantity: number, unit: string, ingredientName: string): number {
    const densityMap: Record<string, number> = {
      // Liquids (ml to g, assuming water density)
      'ml': 1,
      'l': 1000,
      'cup': 240, // 240ml = 240g for water-based
      'tbsp': 15,
      'tsp': 5,
      
      // Solids
      'g': 1,
      'kg': 1000,
      'oz': 28.35,
      'lb': 453.6,
    };

    // Special conversions for specific ingredients
    const ingredientConversions: Record<string, Record<string, number>> = {
      'flour': { 'cup': 120, 'tbsp': 8, 'tsp': 2.5 },
      'sugar': { 'cup': 200, 'tbsp': 12.5, 'tsp': 4 },
      'rice': { 'cup': 185, 'tbsp': 11.5 },
      'oats': { 'cup': 80, 'tbsp': 5 },
      'butter': { 'cup': 226, 'tbsp': 14, 'tsp': 5 },
      'oil': { 'cup': 218, 'tbsp': 14, 'tsp': 4.5 },
    };

    // Check for ingredient-specific conversions first
    const normalizedName = ingredientName.toLowerCase();
    for (const [ingredient, conversions] of Object.entries(ingredientConversions)) {
      if (normalizedName.includes(ingredient)) {
        if (conversions[unit]) {
          return quantity * conversions[unit];
        }
      }
    }

    // Use general density map
    if (densityMap[unit]) {
      return quantity * densityMap[unit];
    }

    // Piece-based estimates
    const pieceWeights: Record<string, number> = {
      'egg': 50,
      'onion': 150,
      'apple': 182,
      'banana': 118,
      'orange': 154,
      'tomato': 123,
      'clove garlic': 3,
      'bell pepper': 119,
      'carrot': 61,
    };

    for (const [item, weight] of Object.entries(pieceWeights)) {
      if (normalizedName.includes(item)) {
        return quantity * weight;
      }
    }

    // Default estimate for pieces
    return quantity * 100; // 100g per piece as fallback
  }

  // Get nutrition data for an ingredient
  static getIngredientNutrition(ingredientName: string): NutritionData {
    const normalizedName = ingredientName.toLowerCase();
    
    // Direct match first
    if (NUTRITION_DATABASE[normalizedName]) {
      return NUTRITION_DATABASE[normalizedName];
    }

    // Partial match
    for (const [dbName, nutrition] of Object.entries(NUTRITION_DATABASE)) {
      if (normalizedName.includes(dbName) || dbName.includes(normalizedName)) {
        return nutrition;
      }
    }

    // Category-based fallback estimates
    const category = categorizeIngredient(ingredientName);
    const categoryDefaults: Record<string, NutritionData> = {
      'Produce': { calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 2 },
      'Meat & Seafood': { calories: 200, protein: 25, carbs: 0, fat: 8, cholesterol: 70 },
      'Dairy': { calories: 80, protein: 6, carbs: 4, fat: 4, cholesterol: 15 },
      'Pantry': { calories: 350, protein: 10, carbs: 70, fat: 2, fiber: 3 },
      'Other': { calories: 100, protein: 2, carbs: 15, fat: 2 },
    };

    return categoryDefaults[category] || categoryDefaults['Other'];
  }

  // Calculate nutrition for a parsed ingredient
  static calculateIngredientNutrition(ingredient: ParsedIngredient): NutritionData {
    const per100g = ingredient.nutrition;
    const multiplier = ingredient.standardizedQuantity / 100;

    const result: NutritionData = {
      calories: Math.round(per100g.calories * multiplier),
      protein: Math.round(per100g.protein * multiplier * 10) / 10,
      carbs: Math.round(per100g.carbs * multiplier * 10) / 10,
      fat: Math.round(per100g.fat * multiplier * 10) / 10,
    };

    // Add optional nutrients if present
    if (per100g.fiber) result.fiber = Math.round(per100g.fiber * multiplier * 10) / 10;
    if (per100g.sugar) result.sugar = Math.round(per100g.sugar * multiplier * 10) / 10;
    if (per100g.sodium) result.sodium = Math.round(per100g.sodium * multiplier * 10) / 10;
    if (per100g.cholesterol) result.cholesterol = Math.round(per100g.cholesterol * multiplier * 10) / 10;

    // Vitamins and minerals
    if (per100g.vitamins) {
      result.vitamins = {};
      Object.entries(per100g.vitamins).forEach(([vitamin, value]) => {
        if (value) result.vitamins![vitamin as keyof typeof result.vitamins] = Math.round(value * multiplier * 100) / 100;
      });
    }

    if (per100g.minerals) {
      result.minerals = {};
      Object.entries(per100g.minerals).forEach(([mineral, value]) => {
        if (value) result.minerals![mineral as keyof typeof result.minerals] = Math.round(value * multiplier * 100) / 100;
      });
    }

    return result;
  }

  // Calculate complete recipe nutrition
  static calculateRecipeNutrition(ingredients: string[], servings: number = 4): RecipeNutrition {
    const parsedIngredients: ParsedIngredient[] = ingredients.map(ingredient => {
      const parsed = this.parseIngredientQuantity(ingredient);
      const standardizedQuantity = this.convertToGrams(parsed.quantity, parsed.unit, parsed.name);
      const baseNutrition = this.getIngredientNutrition(parsed.name);

      return {
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        standardizedQuantity,
        nutrition: baseNutrition,
      };
    });

    // Calculate total nutrition
    const totalNutrition: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    parsedIngredients.forEach(ingredient => {
      const ingredientNutrition = this.calculateIngredientNutrition(ingredient);
      
      totalNutrition.calories += ingredientNutrition.calories;
      totalNutrition.protein += ingredientNutrition.protein;
      totalNutrition.carbs += ingredientNutrition.carbs;
      totalNutrition.fat += ingredientNutrition.fat;
      
      if (ingredientNutrition.fiber) totalNutrition.fiber! += ingredientNutrition.fiber;
      if (ingredientNutrition.sugar) totalNutrition.sugar! += ingredientNutrition.sugar;
      if (ingredientNutrition.sodium) totalNutrition.sodium! += ingredientNutrition.sodium;
      if (ingredientNutrition.cholesterol) totalNutrition.cholesterol! += ingredientNutrition.cholesterol;
    });

    // Calculate per serving
    const nutritionPerServing: NutritionData = {
      calories: Math.round(totalNutrition.calories / servings),
      protein: Math.round(totalNutrition.protein / servings * 10) / 10,
      carbs: Math.round(totalNutrition.carbs / servings * 10) / 10,
      fat: Math.round(totalNutrition.fat / servings * 10) / 10,
      fiber: totalNutrition.fiber ? Math.round(totalNutrition.fiber / servings * 10) / 10 : undefined,
      sugar: totalNutrition.sugar ? Math.round(totalNutrition.sugar / servings * 10) / 10 : undefined,
      sodium: totalNutrition.sodium ? Math.round(totalNutrition.sodium / servings * 10) / 10 : undefined,
      cholesterol: totalNutrition.cholesterol ? Math.round(totalNutrition.cholesterol / servings * 10) / 10 : undefined,
    };

    // Calculate macro percentages
    const totalCaloriesFromMacros = (nutritionPerServing.protein * 4) + (nutritionPerServing.carbs * 4) + (nutritionPerServing.fat * 9);
    const macroPercentages = {
      protein: Math.round((nutritionPerServing.protein * 4 / totalCaloriesFromMacros) * 100),
      carbs: Math.round((nutritionPerServing.carbs * 4 / totalCaloriesFromMacros) * 100),
      fat: Math.round((nutritionPerServing.fat * 9 / totalCaloriesFromMacros) * 100),
    };

    // Calculate health score (0-100)
    const healthScore = this.calculateHealthScore(nutritionPerServing, parsedIngredients);

    // Generate dietary labels
    const dietaryLabels = this.generateDietaryLabels(parsedIngredients, nutritionPerServing);

    // Identify allergens
    const allergens = this.identifyAllergens(parsedIngredients);

    // Calculate glycemic load (simplified)
    const glycemicLoad = this.calculateGlycemicLoad(parsedIngredients, nutritionPerServing);

    return {
      ...totalNutrition,
      ingredients: parsedIngredients,
      servings,
      nutritionPerServing,
      macroPercentages,
      healthScore,
      dietaryLabels,
      allergens,
      glycemicLoad,
    };
  }

  // Calculate health score based on nutrition profile
  static calculateHealthScore(nutrition: NutritionData, ingredients: ParsedIngredient[]): number {
    let score = 50; // Base score

    // Positive factors
    if (nutrition.fiber && nutrition.fiber > 5) score += 10;
    if (nutrition.protein > 15) score += 10;
    if (nutrition.sodium && nutrition.sodium < 600) score += 10;
    
    // Vegetable/fruit content
    const produceCount = ingredients.filter(ing => 
      categorizeIngredient(ing.name) === 'Produce'
    ).length;
    score += Math.min(produceCount * 5, 20);

    // Negative factors
    if (nutrition.sodium && nutrition.sodium > 1000) score -= 15;
    if (nutrition.sugar && nutrition.sugar > 20) score -= 10;
    if (nutrition.cholesterol && nutrition.cholesterol > 100) score -= 10;

    // Calorie density check
    if (nutrition.calories > 600) score -= 10;
    if (nutrition.calories < 200) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  // Generate dietary labels
  static generateDietaryLabels(ingredients: ParsedIngredient[], nutrition: NutritionData): string[] {
    const labels: string[] = [];

    // Check for vegetarian/vegan
    const meatIngredients = ingredients.filter(ing => 
      categorizeIngredient(ing.name) === 'Meat & Seafood'
    );
    const dairyIngredients = ingredients.filter(ing => 
      categorizeIngredient(ing.name) === 'Dairy' || 
      ing.name.toLowerCase().includes('egg')
    );

    if (meatIngredients.length === 0) {
      if (dairyIngredients.length === 0) {
        labels.push('Vegan');
      } else {
        labels.push('Vegetarian');
      }
    }

    // Nutritional labels
    if (nutrition.protein > 20) labels.push('High Protein');
    if (nutrition.fiber && nutrition.fiber > 8) labels.push('High Fiber');
    if (nutrition.sodium && nutrition.sodium < 300) labels.push('Low Sodium');
    if (nutrition.fat < 5) labels.push('Low Fat');
    if (nutrition.calories < 300) labels.push('Low Calorie');

    // Macro-based labels
    const proteinPercentage = (nutrition.protein * 4) / nutrition.calories * 100;
    const carbPercentage = (nutrition.carbs * 4) / nutrition.calories * 100;
    const fatPercentage = (nutrition.fat * 9) / nutrition.calories * 100;

    if (carbPercentage < 20 && fatPercentage > 60) labels.push('Keto Friendly');
    if (proteinPercentage > 30) labels.push('Protein Rich');

    return labels;
  }

  // Identify common allergens
  static identifyAllergens(ingredients: ParsedIngredient[]): string[] {
    const allergens: string[] = [];
    const allergenMap: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'Eggs': ['egg'],
      'Nuts': ['almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'hazelnut'],
      'Gluten': ['wheat', 'flour', 'pasta', 'bread', 'oats'],
      'Soy': ['tofu', 'soy sauce', 'soybean'],
      'Shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster'],
      'Fish': ['salmon', 'tuna', 'cod', 'fish'],
    };

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      Object.entries(allergenMap).forEach(([allergen, keywords]) => {
        if (keywords.some(keyword => name.includes(keyword))) {
          if (!allergens.includes(allergen)) {
            allergens.push(allergen);
          }
        }
      });
    });

    return allergens;
  }

  // Calculate glycemic load (simplified)
  static calculateGlycemicLoad(ingredients: ParsedIngredient[], nutrition: NutritionData): number {
    // Simplified glycemic index values
    const giValues: Record<string, number> = {
      'rice': 70,
      'pasta': 45,
      'bread': 75,
      'potato': 85,
      'oats': 55,
      'quinoa': 53,
      'apple': 36,
      'banana': 51,
      'orange': 45,
    };

    let totalGL = 0;
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      for (const [food, gi] of Object.entries(giValues)) {
        if (name.includes(food)) {
          const carbsFromIngredient = (ingredient.nutrition.carbs * ingredient.standardizedQuantity) / 100;
          totalGL += (gi * carbsFromIngredient) / 100;
          break;
        }
      }
    });

    return Math.round(totalGL);
  }

  // Compare two recipes nutritionally
  static compareRecipes(recipe1: RecipeNutrition, recipe2: RecipeNutrition): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    healthScore: number;
    recommendation: string;
  } {
    const comparison = {
      calories: recipe1.nutritionPerServing.calories - recipe2.nutritionPerServing.calories,
      protein: recipe1.nutritionPerServing.protein - recipe2.nutritionPerServing.protein,
      carbs: recipe1.nutritionPerServing.carbs - recipe2.nutritionPerServing.carbs,
      fat: recipe1.nutritionPerServing.fat - recipe2.nutritionPerServing.fat,
      healthScore: recipe1.healthScore - recipe2.healthScore,
      recommendation: '',
    };

    // Generate recommendation
    if (comparison.healthScore > 10) {
      comparison.recommendation = 'Recipe 1 is significantly healthier';
    } else if (comparison.healthScore < -10) {
      comparison.recommendation = 'Recipe 2 is significantly healthier';
    } else if (comparison.calories < -100) {
      comparison.recommendation = 'Recipe 1 is lower in calories';
    } else if (comparison.calories > 100) {
      comparison.recommendation = 'Recipe 2 is lower in calories';
    } else {
      comparison.recommendation = 'Recipes are nutritionally similar';
    }

    return comparison;
  }
}