import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../lib/AuthContext';
import { getAmplifyClient } from '../lib/amplify';
import { useAchievements } from '../hooks/useAchievements';
import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];
type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

interface AIMealSuggestionsProps {
  onSelectRecipe: (recipe: Recipe, mealType: MealType, servings?: number) => void;
  selectedDate: Date;
  mealType: MealType;
}

interface AIRecipeSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
}

// Utility to normalize difficulty to schema format
function normalizeDifficulty(difficulty?: string): 'Easy' | 'Medium' | 'Hard' {
  if (!difficulty) return 'Medium';
  const d = difficulty.toLowerCase();
  if (d === 'easy') return 'Easy';
  if (d === 'hard') return 'Hard';
  return 'Medium';
}

export default function AIMealSuggestions({ 
  onSelectRecipe, 
  selectedDate,
  mealType 
}: AIMealSuggestionsProps) {
  const { profile, updateProfile } = useUserProfile();
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIRecipeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [savingRecipeIndex, setSavingRecipeIndex] = useState<number | null>(null);

  // Load custom prompt from profile when component mounts
  useEffect(() => {
    if (profile?.customMealSuggestionsPrompt) {
      setCustomPrompt(profile.customMealSuggestionsPrompt);
    }
  }, [profile?.customMealSuggestionsPrompt]);

  const generateDefaultPrompt = useCallback(() => {
    if (!profile) return 'Profile not available for prompt generation.';
    return `
Generate 3 meal suggestions for ${mealType} based on this user profile:

User Profile:
- Dietary restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${profile.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${profile.dislikedIngredients?.join(', ') || 'None'}
- Preferred cuisines: ${profile.preferredCuisines?.join(', ') || 'Various'}
- Daily calorie target: ${profile.dailyCalorieTarget || 'Not specified'}
- Weight goal: ${profile.weightGoal || 'Not specified'}
- Activity level: ${profile.activityLevel || 'Not specified'}

Requirements:
- Ensure recipes match dietary restrictions and avoid allergies
- Avoid disliked ingredients
- Prefer the user's favorite cuisines when possible
- Aim for the calorie range if specified
- Consider the user's weight goal and activity level
- Make suggestions appropriate for ${mealType}

IMPORTANT: You must return ONLY a valid JSON array. Do not include any explanatory text, markdown formatting, or code blocks. Start your response with [ and end with ].

Return exactly this JSON format with 3 recipes:
[
  {
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "calories": 450,
    "protein": 25,
    "carbs": 45,
    "fat": 15,
    "dietaryTags": ["vegetarian", "gluten-free", "high-protein"],
    "imageUrl": "https://source.unsplash.com/featured/?food,RecipeName"
  }
]
`;
  }, [profile, mealType]);

  const generateSuggestions = useCallback(async () => {
    if (!profile) {
      setError('Profile not available');
      return;
    }

    if (!profile.geminiApiKey) {
      setError('Google Gemini API key required for AI suggestions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = customPrompt || generateDefaultPrompt();
      let geminiModel = 'gemini-2.0-flash';
      if (profile.aiModel === 'gemini_1_5_pro') {
        geminiModel = 'gemini-1.5-pro';
      } else if (profile.aiModel === 'gemini_1_5_flash') {
        geminiModel = 'gemini-1.5-flash';
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${profile.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt.trim()
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseContent) {
        throw new Error('No response from Gemini');
      }

      // Clean and parse the JSON response
      const cleanResponse = responseContent
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^Here's.*?:\s*/i, '')
        .replace(/^Here are.*?:\s*/i, '')
        .trim();

      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const recipes = JSON.parse(jsonMatch[0]);
      setSuggestions(recipes);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  }, [profile, mealType, customPrompt, generateDefaultPrompt]);

  const handleSelectRecipe = async (recipe: AIRecipeSuggestion, index: number) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }

    setSavingRecipeIndex(index);
    setError(null);

    try {
      // Save the AI recipe to the database first
      // Format ingredients and instructions as JSON arrays like existing recipes
      const ingredientsArray = Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.description];
      const instructionsArray = Array.isArray(recipe.instructions) ? recipe.instructions : ['Generated by AI - please add cooking instructions'];
      
      console.log('Attempting to save AI meal suggestion:', {
        name: recipe.name,
        ingredients: JSON.stringify(ingredientsArray),
        instructions: JSON.stringify(instructionsArray),
        imageUrl: '',
        userId: session.user.id,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        servings: 1,
        prepTime: 15,
        cookTime: 30,
        difficulty: normalizeDifficulty(String(recipe.difficulty)),
        category: mealType,
        tags: recipe.dietaryTags || [],
      });
      const client = getAmplifyClient();
      const { data: savedRecipe } = await client.models.Recipe.create({
        name: recipe.name,
        ingredients: JSON.stringify(ingredientsArray),
        instructions: JSON.stringify(instructionsArray),
        imageUrl: '',
        userId: session.user.id,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        servings: 1,
        prepTime: 15, // Default prep time
        cookTime: 30, // Default cook time
        difficulty: normalizeDifficulty(String(recipe.difficulty)),
        category: mealType,
        tags: recipe.dietaryTags || [],
      });
      console.log('AI meal suggestion save succeeded:', savedRecipe);

      if (savedRecipe) {
        // Track achievement for AI recipe usage
        await incrementStat('ai_recipes_added');
        await incrementStat('ai_suggestions_used');
        
        // Now pass the saved recipe to the meal planner
        onSelectRecipe(savedRecipe, mealType, 1);
      } else {
        setError('Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving AI meal suggestion:', error);
      setError(error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Failed to save recipe');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to save recipe: ' + (error && typeof error === 'object' && 'message' in error ? (error as any).message : error));
      } else if (typeof Alert !== 'undefined') {
        Alert.alert('Save Error', error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Failed to save recipe');
      }
    } finally {
      setSavingRecipeIndex(null);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const success = await updateProfile({
        customMealSuggestionsPrompt: customPrompt
      });
      if (success) {
        setShowPromptModal(false);
        generateSuggestions();
      } else {
        Alert.alert('Error', 'Failed to save prompt. Please try again.');
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
      Alert.alert('Error', 'Failed to save prompt. Please try again.');
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleResetPrompt = async () => {
    setSavingPrompt(true);
    try {
      const success = await updateProfile({
        customMealSuggestionsPrompt: ''
      });
      if (success) {
        setCustomPrompt('');
        setShowPromptModal(false);
        generateSuggestions();
      } else {
        Alert.alert('Error', 'Failed to reset prompt. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting prompt:', err);
      Alert.alert('Error', 'Failed to reset prompt. Please try again.');
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={20} color="#3B82F6" />
          <Text style={styles.title}>AI Suggestions</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.promptButton}
            onPress={() => setShowPromptModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={generateSuggestions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Ionicons 
                name="refresh" 
                size={20} 
                color="#3B82F6" 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestion Header with Prompt Edit and Refresh */}
      <View style={styles.suggestionHeader}>
        <TouchableOpacity onPress={() => setShowPromptModal(true)} style={styles.headerIconButton}>
          <Ionicons name="create-outline" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={generateSuggestions} disabled={loading} style={styles.headerIconButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="refresh" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Generating suggestions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : suggestions.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
        >
          {suggestions.map((recipe, index) => (
            <View
              key={index}
              style={styles.suggestionCard}
            >
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeDescription}>{recipe.description}</Text>
                <View style={styles.nutritionInfo}>
                  <Text style={styles.calories}>{recipe.calories} cal</Text>
                  <Text style={styles.macros}>
                    P: {recipe.protein}g • C: {recipe.carbs}g • F: {recipe.fat}g
                  </Text>
                </View>
                <View style={styles.tagsContainer}>
                  {recipe.dietaryTags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  savingRecipeIndex === index && styles.addButtonDisabled
                ]}
                onPress={() => handleSelectRecipe(recipe, index)}
                activeOpacity={0.7}
                disabled={savingRecipeIndex === index}
              >
                {savingRecipeIndex === index ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Ionicons name="add-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity 
          style={styles.emptyState}
          onPress={generateSuggestions}
        >
          <Ionicons name="sparkles-outline" size={24} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>
            Get AI-powered meal suggestions
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showPromptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromptModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize AI Prompt</Text>
              <TouchableOpacity
                onPress={() => setShowPromptModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.promptInput}
              value={customPrompt || generateDefaultPrompt()}
              onChangeText={setCustomPrompt}
              multiline
              placeholder="Enter your custom prompt..."
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={handleResetPrompt}
                disabled={savingPrompt}
              >
                {savingPrompt ? (
                  <ActivityIndicator size="small" color="#4B5563" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset to Default</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePrompt}
                disabled={savingPrompt}
              >
                {savingPrompt ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save & Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  promptButton: {
    padding: 4,
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#EF4444',
  },
  suggestionsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 260,
  },
  recipeInfo: {
    flex: 1,
    marginRight: 8,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  recipeDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  nutritionInfo: {
    marginBottom: 8,
  },
  calories: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  macros: {
    fontSize: 12,
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  addButton: {
    padding: 4,
    marginLeft: 4,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  emptyStateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  resetButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 12,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginLeft: 4,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
}); 