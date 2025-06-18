import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../lib/AuthContext';
import { amplifyClient } from '../lib/amplify';
import { 
  generateEnhancedRecipePrompt,
  generateQuickMealPrompt,
  generateSeasonalPrompt,
  generateCuisineSpecificPrompt,
  generateHealthFocusedPrompt,
  calculateRecipeNutrition
} from '../utils/enhancedAIPrompts';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/DesignSystem';
import { useAchievements } from '../hooks/useAchievements';

interface EnhancedRecipe {
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

type RecipeType = 'general' | 'quick-breakfast' | 'quick-lunch' | 'quick-dinner' | 'seasonal' | 'cuisine' | 'health';

interface RecipeOption {
  id: RecipeType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  category: string;
}

const recipeOptions: RecipeOption[] = [
  {
    id: 'general',
    title: 'Personalized Recipes',
    subtitle: 'Based on your profile and preferences',
    icon: 'person',
    color: Colors.primary,
    category: 'Personal'
  },
  {
    id: 'quick-breakfast',
    title: 'Quick Breakfast',
    subtitle: '15 minutes or less',
    icon: 'cafe',
    color: Colors.warning,
    category: 'Quick Meals'
  },
  {
    id: 'quick-lunch',
    title: 'Quick Lunch',
    subtitle: '20 minutes or less',
    icon: 'fast-food',
    color: Colors.secondary,
    category: 'Quick Meals'
  },
  {
    id: 'quick-dinner',
    title: 'Quick Dinner',
    subtitle: '30 minutes or less',
    icon: 'restaurant',
    color: Colors.accent,
    category: 'Quick Meals'
  },
  {
    id: 'seasonal',
    title: 'Seasonal Recipes',
    subtitle: 'Fresh, in-season ingredients',
    icon: 'leaf',
    color: '#10B981',
    category: 'Seasonal'
  },
  {
    id: 'health',
    title: 'Health-Focused',
    subtitle: 'Optimized for your goals',
    icon: 'fitness',
    color: '#EF4444',
    category: 'Health'
  }
];

export default function EnhancedAIRecipes() {
  const { profile } = useUserProfile();
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<EnhancedRecipe[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<EnhancedRecipe | null>(null);

  // Memoize recipe options to prevent re-renders
  const memoizedRecipeOptions = useMemo(() => recipeOptions, []);

  const generateRecipes = useCallback(async (type: RecipeType) => {
    if (!profile?.geminiApiKey) {
      setError('Google Gemini API key required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let prompt = '';
      
      // Generate appropriate prompt based on type
      switch (type) {
        case 'quick-breakfast':
          prompt = generateQuickMealPrompt(profile, 'breakfast');
          break;
        case 'quick-lunch':
          prompt = generateQuickMealPrompt(profile, 'lunch');
          break;
        case 'quick-dinner':
          prompt = generateQuickMealPrompt(profile, 'dinner');
          break;
        case 'seasonal':
          const currentSeason = getCurrentSeason();
          prompt = generateSeasonalPrompt(profile, currentSeason);
          break;
        case 'cuisine':
          const favCuisine = profile.preferredCuisines?.[0] || 'Italian';
          prompt = generateCuisineSpecificPrompt(profile, favCuisine);
          break;
        case 'health':
          const healthGoal = profile.weightGoal || 'heart-healthy';
          prompt = generateHealthFocusedPrompt(profile, healthGoal);
          break;
        default:
          prompt = generateEnhancedRecipePrompt(profile);
      }

      // Call Gemini API
      const modelName = profile.aiModel === 'gemini_1_5_pro' ? 'gemini-1.5-pro' : 
                       profile.aiModel === 'gemini_1_5_flash' ? 'gemini-1.5-flash' : 
                       'gemini-2.0-flash';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${profile.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000, // Increased for more detailed recipes
          }
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        
        if (response.status === 429) {
          throw new Error('⏳ Rate limit reached. Please wait a few minutes before trying again.');
        } else if (response.status === 401) {
          throw new Error('🔑 Invalid API key. Please check your Gemini API key in Profile settings.');
        } else if (response.status === 403) {
          throw new Error('🚫 API access denied. Please check your Gemini API key permissions.');
        } else {
          throw new Error(`API Error: ${response.status} - ${errorText.slice(0, 100)}`);
        }
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      console.log('API response data:', data);

      if (!content) {
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('🛡️ Content was filtered for safety. Try adjusting your recipe request.');
        }
        throw new Error('❌ No response from AI. Please try again.');
      }

      // Parse and validate the enhanced recipe format
      let cleanedContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^Here's.*?:\s*/i, '')
        .replace(/^Here are.*?:\s*/i, '')
        .trim();

      console.log('Raw AI response:', content);
      console.log('Cleaned content:', cleanedContent);

      let recipes: EnhancedRecipe[];
      
      // Enhanced JSON parsing with multiple fallback strategies
      const parseRecipeJSON = (text: string): EnhancedRecipe[] => {
        // Strategy 1: Direct parse
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          throw new Error('Response is not an array');
        } catch (e) {
          console.log('Direct parse failed:', e);
        }

        // Strategy 2: Extract JSON array
        let jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          // Strategy 3: Look for JSON in code blocks
          const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/i);
          if (codeBlockMatch) {
            jsonMatch = [codeBlockMatch[1]];
          }
        }

        if (!jsonMatch) {
          // Strategy 4: Look for multiple objects and create array
          const objectMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
          if (objectMatches && objectMatches.length > 0) {
            const arrayString = '[' + objectMatches.join(',') + ']';
            try {
              return JSON.parse(arrayString);
            } catch (e) {
              console.log('Object array construction failed:', e);
            }
          }
          
          throw new Error('Could not find valid JSON in AI response. Please try again.');
        }

        try {
          let extracted = jsonMatch[0];
          console.log('Extracted JSON:', extracted);
          
          // Clean up common JSON issues
          extracted = extracted
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/,\s*}/g, '}') // Remove trailing commas in objects
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/"\s*:\s*"([^"]*)"([^,}\]]*)/g, '": "$1$2"') // Fix broken string values
            .trim();
          
          return JSON.parse(extracted);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Failed content:', jsonMatch[0]);
          throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      };

      try {
        recipes = parseRecipeJSON(cleanedContent);
        console.log('Successfully parsed recipes:', recipes.length);
      } catch (parseError) {
        console.error('All parsing strategies failed:', parseError);
        throw new Error('AI returned invalid format. Please try again - sometimes the AI needs a second attempt to generate properly formatted recipes.');
      }

      // Validate and enhance recipes
      const validatedRecipes = recipes.map(recipe => validateAndEnhanceRecipe(recipe));
      
      setGeneratedRecipes(validatedRecipes);
      
      // Track achievement
      await incrementStat('ai_suggestions_used');

    } catch (err: any) {
      console.error('Enhanced AI recipe generation error:', err);
      setError(err.message || 'Failed to generate recipes');
    } finally {
      setLoading(false);
    }
  }, [profile?.geminiApiKey, profile?.aiModel, incrementStat]);

  const validateAndEnhanceRecipe = (recipe: any): EnhancedRecipe => {
    // Log the raw recipe for debugging
    console.log('Validating recipe:', recipe);
    
    // Check if recipe name exists and is not empty
    if (!recipe.name || recipe.name.trim() === '') {
      console.warn('Recipe missing name:', recipe);
    }
    
    // Ensure all required fields exist with defaults
    return {
      name: recipe.name && recipe.name.trim() ? recipe.name.trim() : 'Delicious Recipe',
      description: recipe.description && recipe.description.trim() ? recipe.description.trim() : 'A wonderful homemade dish',
      cuisine: recipe.cuisine || 'International',
      servings: recipe.servings || 4,
      prepTime: recipe.prepTime || 15,
      cookTime: recipe.cookTime || 20,
      totalTime: recipe.totalTime || (recipe.prepTime || 15) + (recipe.cookTime || 20),
      difficulty: recipe.difficulty || 'Medium',
      calories: recipe.calories || 400,
      protein: recipe.protein || 20,
      carbs: recipe.carbs || 40,
      fat: recipe.fat || 15,
      ingredients: recipe.ingredients?.map((ing: any, index: number) => ({
        name: ing.name && ing.name.trim() ? ing.name.trim() : `Ingredient ${index + 1}`,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'unit',
        notes: ing.notes
      })) || [],
      instructions: recipe.instructions?.map((inst: any, index: number) => ({
        step: inst.step || index + 1,
        instruction: inst.instruction && inst.instruction.trim() ? inst.instruction.trim() : `Step ${index + 1}`,
        time: inst.time,
        temperature: inst.temperature,
        tips: inst.tips
      })) || [],
      tags: recipe.tags || [],
      tips: recipe.tips || [],
      nutritionNotes: recipe.nutritionNotes
    };
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const handleSaveRecipe = async (recipe: EnhancedRecipe) => {
    if (!session?.user?.id) {
      setError('Please sign in to save recipes');
      return;
    }

    try {
      // Convert enhanced recipe to app format
      const recipeData = {
        name: recipe.name,
        ingredients: JSON.stringify(recipe.ingredients.map(ing =>
          `${ing.quantity} ${ing.unit} ${ing.name}${ing.notes ? ` (${ing.notes})` : ''}`
        )),
        instructions: JSON.stringify(recipe.instructions.map(inst => inst.instruction)),
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
        category: recipe.cuisine,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        userId: session.user.id,
        imageUrl: `https://source.unsplash.com/400x300/?${encodeURIComponent(recipe.name)},food`
      };

      await amplifyClient.models.Recipe.create(recipeData);
      
      // Track achievements
      await incrementStat('recipes_created');
      await incrementStat('ai_recipes_added');
      
      // Show success message or navigate
      setShowRecipeModal(false);
      router.push('/(tabs)/recipes');
      
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe');
    }
  };

  if (!profile?.geminiApiKey) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🚀 Enhanced AI Recipes</Text>
        <Text style={styles.setupText}>
          Set up your Google Gemini API key in Profile → AI Settings to access restaurant-quality AI recipe generation!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Enhanced AI Recipes</Text>
        <Text style={styles.subtitle}>
          Restaurant-quality recipes with precise instructions and nutrition
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {memoizedRecipeOptions.map((option) => (
          <TouchableOpacity
            key={`recipe-option-${option.id}`}
            style={[styles.optionCard, { borderLeftColor: option.color }]}
            onPress={() => generateRecipes(option.id)}
            disabled={loading}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
              <Ionicons name={option.icon as any} size={24} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionCategory}>{option.category}</Text>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <View style={styles.optionAction}>
              {loading ? (
                <View style={styles.loadingSpinner} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {generatedRecipes.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Generated Recipes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {generatedRecipes.map((recipe, index) => (
              <TouchableOpacity
                key={`generated-recipe-${index}-${recipe.name}`}
                style={styles.recipeCard}
                onPress={() => {
                  setSelectedRecipe(recipe);
                  setShowRecipeModal(true);
                }}
              >
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {recipe.description}
                </Text>
                <View style={styles.recipeMetrics}>
                  <View style={styles.metric}>
                    <Ionicons name="time" size={12} color={Colors.primary} />
                    <Text style={styles.metricText}>{recipe.totalTime}m</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="flame" size={12} color={Colors.warning} />
                    <Text style={styles.metricText}>{recipe.calories}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="restaurant" size={12} color={Colors.secondary} />
                    <Text style={styles.metricText}>{recipe.servings}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Enhanced Recipe Detail Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Recipe Details</Text>
            {selectedRecipe && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveRecipe(selectedRecipe)}
              >
                <Ionicons name="bookmark" size={16} color={Colors.surface} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedRecipe && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.recipeTitle}>{selectedRecipe.name}</Text>
              <Text style={styles.recipeSubtitle}>{selectedRecipe.description}</Text>

              {/* Enhanced Nutrition Info */}
              <View style={styles.nutritionCard}>
                <Text style={styles.sectionTitle}>Nutrition per serving</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedRecipe.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedRecipe.protein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedRecipe.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedRecipe.fat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Recipe Meta */}
              <View style={styles.metaCard}>
                <View style={styles.metaItem}>
                  <Ionicons name="people" size={16} color={Colors.primary} />
                  <Text style={styles.metaText}>{selectedRecipe.servings} servings</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color={Colors.secondary} />
                  <Text style={styles.metaText}>{selectedRecipe.prepTime}m prep</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flame" size={16} color={Colors.warning} />
                  <Text style={styles.metaText}>{selectedRecipe.cookTime}m cook</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="bar-chart" size={16} color={Colors.accent} />
                  <Text style={styles.metaText}>{selectedRecipe.difficulty}</Text>
                </View>
              </View>

              {/* Enhanced Ingredients */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientQuantity}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    {ingredient.notes && (
                      <Text style={styles.ingredientNotes}>({ingredient.notes})</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Enhanced Instructions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepNumber}>{instruction.step}</Text>
                      {instruction.time && (
                        <View style={styles.stepTiming}>
                          <Ionicons name="timer" size={12} color={Colors.primary} />
                          <Text style={styles.stepTime}>{instruction.time}m</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.instructionText}>{instruction.instruction}</Text>
                    {instruction.tips && (
                      <Text style={styles.instructionTips}>💡 {instruction.tips}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Tips */}
              {selectedRecipe.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pro Tips</Text>
                  {selectedRecipe.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons name="bulb" size={16} color={Colors.warning} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    ...Shadows.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed,
  },
  setupText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    paddingVertical: Spacing['2xl'],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
  optionsContainer: {
    maxHeight: 300,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionCategory: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  optionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  optionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  optionAction: {
    marginLeft: Spacing.sm,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
  },
  resultsContainer: {
    marginTop: Spacing.xl,
  },
  resultsTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  recipeCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  recipeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  recipeDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeights.normal,
  },
  recipeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  modalContent: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  recipeTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  recipeSubtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeights.relaxed,
  },
  nutritionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  metaCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ingredientQuantity: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    minWidth: 60,
  },
  ingredientName: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  ingredientNotes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  instructionItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: Colors.surface,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  stepTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  instructionText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.relaxed,
    marginBottom: Spacing.sm,
  },
  instructionTips: {
    fontSize: Typography.sizes.sm,
    color: Colors.secondary,
    fontStyle: 'italic',
    backgroundColor: `${Colors.secondary}10`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
});