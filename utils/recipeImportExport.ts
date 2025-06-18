import { Platform, Alert } from 'react-native';
import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe'];

export interface ImportedRecipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  imageUrl?: string;
  source?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Recipe parsing utilities
export class RecipeParser {
  static parseJSONLD(html: string): ImportedRecipe | null {
    try {
      // Look for JSON-LD structured data
      const jsonLdMatch = html.match(/<script[^>]*type=["|']application\/ld\+json["|'][^>]*>(.*?)<\/script>/gi);
      
      if (!jsonLdMatch) return null;

      for (const match of jsonLdMatch) {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonContent);
        
        // Handle array of items
        const recipeData = Array.isArray(data) ? data.find(item => item['@type'] === 'Recipe') : data;
        
        if (recipeData && recipeData['@type'] === 'Recipe') {
          return this.parseStructuredRecipe(recipeData);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
      return null;
    }
  }

  static parseStructuredRecipe(data: any): ImportedRecipe {
    const recipe: ImportedRecipe = {
      name: data.name || 'Imported Recipe',
      ingredients: this.extractIngredients(data.recipeIngredient || []),
      instructions: this.extractInstructions(data.recipeInstructions || []),
      servings: this.parseServings(data.recipeYield),
      category: data.recipeCategory || 'Main Course',
      imageUrl: this.extractImage(data.image),
      source: data.author?.name || data.publisher?.name || 'Web Import',
    };

    // Parse times
    if (data.prepTime) {
      recipe.prepTime = this.parseDuration(data.prepTime);
    }
    if (data.cookTime) {
      recipe.cookTime = this.parseDuration(data.cookTime);
    }

    // Parse nutrition
    if (data.nutrition) {
      recipe.nutrition = this.parseNutrition(data.nutrition);
    }

    return recipe;
  }

  static extractIngredients(ingredients: any[]): string[] {
    return ingredients.map(ingredient => {
      if (typeof ingredient === 'string') {
        return ingredient.trim();
      } else if (ingredient.text) {
        return ingredient.text.trim();
      }
      return ingredient.toString().trim();
    }).filter(ing => ing.length > 0);
  }

  static extractInstructions(instructions: any[]): string[] {
    return instructions.map(instruction => {
      if (typeof instruction === 'string') {
        return instruction.trim();
      } else if (instruction.text) {
        return instruction.text.trim();
      } else if (instruction.name) {
        return instruction.name.trim();
      }
      return instruction.toString().trim();
    }).filter(inst => inst.length > 0);
  }

  static extractImage(image: any): string | undefined {
    if (!image) return undefined;
    
    if (typeof image === 'string') return image;
    if (Array.isArray(image) && image.length > 0) {
      return typeof image[0] === 'string' ? image[0] : image[0].url;
    }
    if (image.url) return image.url;
    
    return undefined;
  }

  static parseServings(recipeYield: any): number {
    if (!recipeYield) return 4;
    
    if (typeof recipeYield === 'number') return recipeYield;
    if (typeof recipeYield === 'string') {
      const match = recipeYield.match(/\d+/);
      return match ? parseInt(match[0]) : 4;
    }
    if (Array.isArray(recipeYield) && recipeYield.length > 0) {
      return this.parseServings(recipeYield[0]);
    }
    
    return 4;
  }

  static parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT15M) or simple text (15 minutes)
    if (duration.startsWith('PT')) {
      const hours = duration.match(/(\d+)H/);
      const minutes = duration.match(/(\d+)M/);
      return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
    }
    
    // Parse text duration
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  }

  static parseNutrition(nutrition: any): ImportedRecipe['nutrition'] {
    return {
      calories: this.parseNutritionValue(nutrition.calories),
      protein: this.parseNutritionValue(nutrition.proteinContent),
      carbs: this.parseNutritionValue(nutrition.carbohydrateContent),
      fat: this.parseNutritionValue(nutrition.fatContent),
    };
  }

  static parseNutritionValue(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    return 0;
  }

  // Fallback HTML parsing for sites without structured data
  static parseHTMLRecipe(html: string, url: string): ImportedRecipe | null {
    try {
      // This is a simplified HTML parser
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const name = titleMatch ? titleMatch[1].replace(/\s*\|\s*.*$/, '').trim() : 'Imported Recipe';

      // Look for common recipe patterns
      const ingredientPatterns = [
        /<ul[^>]*class[^>]*ingredient[^>]*>(.*?)<\/ul>/gis,
        /<ol[^>]*class[^>]*ingredient[^>]*>(.*?)<\/ol>/gis,
        /<div[^>]*class[^>]*ingredient[^>]*>(.*?)<\/div>/gis,
      ];

      const instructionPatterns = [
        /<ol[^>]*class[^>]*instruction[^>]*>(.*?)<\/ol>/gis,
        /<ul[^>]*class[^>]*instruction[^>]*>(.*?)<\/ul>/gis,
        /<div[^>]*class[^>]*instruction[^>]*>(.*?)<\/div>/gis,
      ];

      let ingredients: string[] = [];
      let instructions: string[] = [];

      // Extract ingredients
      for (const pattern of ingredientPatterns) {
        const matches = html.match(pattern);
        if (matches) {
          ingredients = this.extractListItems(matches[0]);
          if (ingredients.length > 0) break;
        }
      }

      // Extract instructions
      for (const pattern of instructionPatterns) {
        const matches = html.match(pattern);
        if (matches) {
          instructions = this.extractListItems(matches[0]);
          if (instructions.length > 0) break;
        }
      }

      if (ingredients.length === 0 && instructions.length === 0) {
        return null;
      }

      return {
        name,
        ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
        instructions: instructions.length > 0 ? instructions : ['No instructions found'],
        source: new URL(url).hostname,
      };
    } catch (error) {
      console.error('Error parsing HTML recipe:', error);
      return null;
    }
  }

  static extractListItems(html: string): string[] {
    const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gis);
    if (!liMatches) return [];

    return liMatches
      .map(li => li.replace(/<[^>]*>/g, '').trim())
      .filter(text => text.length > 0 && !text.match(/^\d+\.\s*$/));
  }
}

// Recipe Import Service
export class RecipeImportService {
  static async importFromURL(url: string): Promise<ImportedRecipe | null> {
    try {
      console.log('Importing recipe from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CulinaApp/1.0; Recipe Importer)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Try JSON-LD first
      let recipe = RecipeParser.parseJSONLD(html);
      
      // Fallback to HTML parsing
      if (!recipe) {
        recipe = RecipeParser.parseHTMLRecipe(html, url);
      }

      if (recipe) {
        recipe.source = new URL(url).hostname;
      }

      return recipe;
    } catch (error: any) {
      console.error('Error importing recipe from URL:', error);
      throw new Error(`Failed to import recipe: ${error.message || 'Unknown error'}`);
    }
  }

  static async importFromJSON(jsonString: string): Promise<ImportedRecipe[]> {
    try {
      const data = JSON.parse(jsonString);
      
      // Handle single recipe or array of recipes
      const recipes = Array.isArray(data) ? data : [data];
      
      return recipes.map(recipeData => ({
        name: recipeData.name || 'Imported Recipe',
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
        instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
        prepTime: recipeData.prepTime || 0,
        cookTime: recipeData.cookTime || 0,
        servings: recipeData.servings || 4,
        difficulty: recipeData.difficulty || 'medium',
        category: recipeData.category || 'Main Course',
        nutrition: recipeData.nutrition || undefined,
      }));
    } catch (error) {
      console.error('Error parsing JSON recipe:', error);
      throw new Error('Invalid recipe JSON format');
    }
  }

  static async saveImportedRecipe(recipe: ImportedRecipe, userId: string): Promise<string | null> {
    try {
      const { data: newRecipe } = await (amplifyClient.models as any).Recipe.create({
        userId,
        name: recipe.name,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'medium',
        category: recipe.category || 'Main Course',
        calories: recipe.nutrition?.calories || 0,
        protein: recipe.nutrition?.protein || 0,
        carbs: recipe.nutrition?.carbs || 0,
        fat: recipe.nutrition?.fat || 0,
        imageUrl: recipe.imageUrl || null,
        tags: recipe.source ? [recipe.source, 'imported'] : ['imported'],
      });

      return newRecipe?.id || null;
    } catch (error) {
      console.error('Error saving imported recipe:', error);
      throw new Error('Failed to save imported recipe');
    }
  }
}

// Recipe Export Service
export class RecipeExportService {
  static async exportRecipesToJSON(recipes: Recipe[]): Promise<string> {
    const exportData = recipes.map(recipe => ({
      name: recipe.name || 'Untitled Recipe',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : JSON.parse(recipe.instructions || '[]'),
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      category: recipe.category,
      nutrition: {
        calories: recipe.nutrition?.calories,
        protein: recipe.nutrition?.protein,
        carbs: recipe.nutrition?.carbs,
        fat: recipe.nutrition?.fat,
      },
      tags: recipe.tags,
      createdAt: recipe.createdAt,
    }));

    return JSON.stringify(exportData, null, 2);
  }

  static async exportRecipesToFile(recipes: Recipe[], filename?: string): Promise<void> {
    try {
      const jsonData = await this.exportRecipesToJSON(recipes);
      const fileName = filename || `culina-recipes-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For mobile, we'll show the JSON in an alert for now
        Alert.alert(
          'Recipe Export',
          'Your recipes have been exported. Copy the JSON data below:',
          [
            { text: 'OK' },
            { text: 'Copy', onPress: () => console.log('JSON:', jsonData) }
          ]
        );
      }
    } catch (error) {
      console.error('Error exporting recipes:', error);
      throw new Error('Failed to export recipes');
    }
  }

  static async exportRecipeAsText(recipe: Recipe): Promise<string> {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]');
    const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : JSON.parse(recipe.instructions || '[]');
    
    return `
${(recipe.name || 'Untitled Recipe').toUpperCase()}

Prep Time: ${recipe.prepTime || 0} minutes
Cook Time: ${recipe.cookTime || 0} minutes
Servings: ${recipe.servings || 4}
Difficulty: ${recipe.difficulty || 'Medium'}

INGREDIENTS:
${ingredients.map((ing: string, index: number) => `${index + 1}. ${ing}`).join('\n')}

INSTRUCTIONS:
${instructions.map((inst: string, index: number) => `${index + 1}. ${inst}`).join('\n\n')}

NUTRITION (per serving):
Calories: ${recipe.nutrition?.calories || 0}
Protein: ${recipe.nutrition?.protein || 0}g
Carbs: ${recipe.nutrition?.carbs || 0}g
Fat: ${recipe.nutrition?.fat || 0}g

---
Exported from Culina App
${new Date().toLocaleDateString()}
    `.trim();
  }

  static async shareRecipeAsText(recipe: Recipe): Promise<void> {
    try {
      const recipeText = await this.exportRecipeAsText(recipe);
      
      if (Platform.OS === 'web') {
        // Web sharing via clipboard or download
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(recipeText);
          Alert.alert('Success', 'Recipe copied to clipboard!');
        } else {
          // Fallback: download as text file
          const blob = new Blob([recipeText], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(recipe.name || 'recipe').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // For mobile, show in alert for now
        Alert.alert(
          'Recipe Export',
          'Recipe text ready to share:\n\n' + recipeText.substring(0, 200) + '...',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      throw new Error('Failed to share recipe');
    }
  }
}

// Simple text recipe parser
export class TextRecipeParser {
  static parseTextRecipe(content: string): ImportedRecipe[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('Empty recipe file');
    }

    const recipe: ImportedRecipe = {
      name: lines[0] || 'Imported Recipe',
      ingredients: [],
      instructions: [],
    };

    let currentSection = 'description';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (line.includes('ingredient')) {
        currentSection = 'ingredients';
        continue;
      }
      if (line.includes('instruction') || line.includes('direction') || line.includes('method')) {
        currentSection = 'instructions';
        continue;
      }
      
      switch (currentSection) {
        case 'ingredients':
          if (lines[i].trim().length > 0) {
            recipe.ingredients.push(lines[i].replace(/^\d+\.\s*/, '').trim());
          }
          break;
        case 'instructions':
          if (lines[i].trim().length > 0) {
            recipe.instructions.push(lines[i].replace(/^\d+\.\s*/, '').trim());
          }
          break;
      }
    }

    return [recipe];
  }
}