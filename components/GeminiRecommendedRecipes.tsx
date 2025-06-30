import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Modal, SafeAreaView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAIRecipeCache } from '../hooks/useAIRecipeCache';
import { useAuth } from '../lib/AuthContext';
import { useAchievements } from '../hooks/useAchievements';

interface AIRecipeRecommendation {
  name: string;
  description: string;
  cuisine: string;
  calories: number;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
}

export default function GeminiRecommendedRecipes() {
  const { profile, updateProfile } = useUserProfile();
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<AIRecipeRecommendation | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Use AI recipe cache
  const {
    cachedRecipes,
    cacheTimestamp,
    loading,
    error,
    setLoading,
    setError,
    saveToCache,
    clearCache,
    isCacheValid,
    getCacheAge,
    hasCachedData
  } = useAIRecipeCache(session?.user?.id || null);

  // Use cached recipes as recommendations
  const [recommendations, setRecommendations] = useState<AIRecipeRecommendation[]>(cachedRecipes);

  // State for the prompt text being edited in the modal
  const [editedPromptText, setEditedPromptText] = useState('');
  // State for the active prompt text (default or user-modified)
  const [activePromptText, setActivePromptText] = useState('');

  // Helper function to generate the default prompt text based on the profile
  const generateDefaultPromptText = (userProfile: typeof profile): string => {
    if (!userProfile) return 'Profile not available for prompt generation.';
    return `
Generate 3 high-quality, trending recipe recommendations based on this user profile:

User Profile:
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${userProfile.dislikedIngredients?.join(', ') || 'None'}
- Preferred cuisines: ${userProfile.preferredCuisines?.join(', ') || 'Various'}
- Daily calorie target: ${userProfile.dailyCalorieTarget || 'Not specified'}
- Weight goal: ${userProfile.weightGoal || 'Not specified'}
- Activity level: ${userProfile.activityLevel || 'Not specified'}

Requirements:
- Include trending recipes from the internet and social media
- Each recipe MUST have a SPECIFIC, CREATIVE name (e.g., "Mediterranean Herb-Crusted Salmon", "Spicy Korean Beef Bowl")
- Consider seasonal ingredients and current food trends
- Ensure recipes match dietary restrictions and avoid allergies
- Aim for the calorie range if specified
- Prefer the user's favorite cuisines when possible
- Include detailed ingredients with quantities
- Provide step-by-step instructions

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no code blocks. Start with [ and end with ].

Return exactly this JSON format with 3 recipes:
[
  {
    "name": "Mediterranean Herb-Crusted Salmon",
    "description": "Flaky salmon with aromatic herbs and lemon",
    "cuisine": "Mediterranean",
    "calories": 450,
    "cookTime": "25 minutes",
    "difficulty": "Easy",
    "ingredients": ["1 lb salmon fillet", "2 tbsp olive oil", "1 lemon (juiced)", "2 cloves garlic (minced)", "1 tsp dried herbs"],
    "instructions": ["Preheat oven to 400°F", "Season salmon with herbs and garlic", "Drizzle with olive oil and lemon", "Bake for 15-20 minutes until flaky"],
    "imageUrl": "https://source.unsplash.com/featured/?salmon,herbs"
  }
]

Generate 3 complete recipes with SPECIFIC, CREATIVE NAMES and detailed ingredients/instructions.
`;
  };
  
  // Initialize activePromptText from saved custom prompt or default when profile changes
  useEffect(() => {
    if (profile) {
      // Use saved custom prompt if available, otherwise use default
      const promptText = profile.customRecipePrompt || generateDefaultPromptText(profile);
      setActivePromptText(promptText);
      setEditedPromptText(promptText);
      console.log('Initialized prompt text:', promptText); // Debug log
    }
  }, [profile]);

  const getRecipeImageUrl = (recipeName: string) => {
    // Generate a placeholder image URL based on recipe name
    const encodedName = encodeURIComponent(recipeName.substring(0, 20));
    return `https://via.placeholder.com/280x160/4CAF50/FFFFFF?text=${encodedName}`;
  };

  const handleViewRecipe = (recipe: AIRecipeRecommendation) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleAddToMyRecipes = async (recipe: AIRecipeRecommendation) => {
    // Track achievement for AI recipe usage
    await incrementStat('ai_suggestions_used');
    
    // Transform AI recipe format to app recipe format
    // Ensure all values are strings for URL parameters
    const recipeData = {
      title: String(recipe.name || ''),
      description: String(recipe.description || ''),
      category: String(recipe.cuisine || ''),
      cookTime: String(recipe.cookTime || ''),
      difficulty: String(recipe.difficulty || '').toLowerCase(),
      ingredients: recipe.ingredients ? recipe.ingredients.join('\n') : '',
      instructions: recipe.instructions ? recipe.instructions.join('\n') : '',
      nutritionalInfo: `Calories: ${String(recipe.calories || 0)}`,
      servings: '4', // Default serving size
    };

    // Navigate to add recipe screen with pre-filled data
    router.push({
      pathname: '/recipes/add',
      params: recipeData
    });
  };

  // AI generation function with caching
  const generateRecommendations = useCallback(async () => {
    if (!profile) {
      setError('Profile not available');
      return;
    }

    if (!profile.geminiApiKey) {
      setError('Google Gemini API key required for AI recommendations');
      return;
    }

    setLoading(true);
    setError(null);

    let responseContent: string | undefined;

    try {
      // Use the activePromptText for the API call
      const promptForApi = activePromptText;

      // Google Gemini API call
      let geminiModel = 'gemini-2.0-flash';
      if (profile.aiModel === 'gemini_1_5_pro') {
        geminiModel = 'gemini-1.5-pro';
      } else if (profile.aiModel === 'gemini_1_5_flash') {
        geminiModel = 'gemini-1.5-flash';
      } else if (profile.aiModel === 'gemini_2_0_flash') {
        geminiModel = 'gemini-2.0-flash';
      }
      
      console.log('Making Gemini API request with model:', geminiModel);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${profile.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptForApi.trim()
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        })
      });

      console.log('Gemini response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.log('Gemini error response:', errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Raw AI response content:', responseContent);

      if (!responseContent) {
        throw new Error('No response from Gemini');
      }

      // Pre-process the response to remove common issues
      responseContent = responseContent
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^Here's.*?:\s*/i, '')
        .replace(/^Here are.*?:\s*/i, '')
        .trim();

      console.log('Preprocessed response:', responseContent);

      // Extract JSON from the response
      const cleanAndParseJSON = (text: string) => {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.log('Direct JSON parse failed, attempting to extract and clean array...');
          
          let jsonMatch = text.match(/\[[\s\S]*\]/);
          
          if (!jsonMatch) {
            const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/i);
            if (codeBlockMatch) {
              jsonMatch = [codeBlockMatch[1]];
            }
          }
          
          if (!jsonMatch) {
            const arrayMatch = text.match(/\[(?:[^[\]]*|\[[^\]]*\])*\]/);
            if (arrayMatch) {
              jsonMatch = [arrayMatch[0]];
            }
          }
          
          if (!jsonMatch) {
            console.error('Raw response content:', text);
            throw new Error(
              'Could not find valid JSON array in response. The AI might have returned invalid format.' +
              '\nPlease try refreshing. If the issue persists, try simplifying the prompt.'
            );
          }

          try {
            let extracted = jsonMatch[0];
            console.log('Extracted JSON array:', extracted);
            
            extracted = extracted
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']')
              .trim();
            
            return JSON.parse(extracted);
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Extracted content that failed to parse:', jsonMatch[0]);
            
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
            throw new Error(
              `Found what looks like a JSON array but failed to parse it: ${errorMessage}` +
              '\nPlease try refreshing. If the issue persists, the AI might need a clearer prompt.'
            );
          }
        }
      };

      // Validate recipe format
      const validateRecipes = (recipes: any[]) => {
        if (!Array.isArray(recipes)) {
          console.error('Parsed content is not an array:', recipes);
          throw new Error(
            'AI response was not in the expected array format.' +
            '\nTry refreshing to get a new response.'
          );
        }

        const requiredFields = ['name', 'description', 'cuisine', 'calories', 'cookTime', 'difficulty', 'ingredients', 'instructions'];
        
        recipes.forEach((recipe, index) => {
          console.log(`Validating recipe ${index + 1}:`, recipe);
          requiredFields.forEach(field => {
            if (!(field in recipe)) {
              console.error(`Recipe ${index + 1} missing field:`, field);
              console.error('Recipe content:', recipe);
              throw new Error(
                `Recipe ${index + 1} is missing the required field: ${field}` +
                '\nTry refreshing to get a complete recipe.'
              );
            }
          });
        });

        return recipes as AIRecipeRecommendation[];
      };

      console.log('Attempting to parse response:', responseContent);
      const parsedData = cleanAndParseJSON(responseContent);
      const recipes = validateRecipes(parsedData);
      
      // Save to cache
      await saveToCache(recipes, promptForApi);
      
      console.log('Successfully generated and cached', recipes.length, 'recipes');

    } catch (err: any) {
      console.error('AI recommendation error:', err);
      
      // Enhanced error handling with more context and guidance
      const errorMessage = (() => {
        if (err.message?.includes('429')) {
          return '⏳ Rate limit reached. Please wait a few minutes before trying again.';
        } else if (err.message?.includes('401')) {
          return '🔑 Invalid API key. Please check your Gemini API key in Profile settings.';
        } else if (err.message?.includes('402')) {
          return '💰 API quota exceeded. Please check your Gemini account billing status.';
        } else if (err.message?.includes('Could not find valid JSON') ||
                  err.message?.includes('Found what looks like a JSON array')) {
          return '🔄 The AI response format was unexpected. This usually means the AI needs clearer instructions.\n\n' +
                 'Try:\n' +
                 '• Refreshing for a new response\n' +
                 '• Reviewing and simplifying the prompt\n' +
                 '• Ensuring the prompt emphasizes JSON format requirements';
        } else if (err.message?.includes('missing required field')) {
          return '📝 The AI response was incomplete. Some recipe details were missing.\n\n' +
                 'Try refreshing to get a complete recipe set.';
        } else if (!responseContent) {
          return '❌ No response received from AI. Please check your internet connection and try again.';
        } else {
          return `⚠️ ${err.message || 'Failed to generate recommendations'}.\n\nTry refreshing the page.`;
        }
      })();

      setError(errorMessage);
      
      console.log('Detailed error information:', {
        error: {
          type: err.name,
          message: err.message,
          stack: err.stack
        },
        context: {
          rawResponse: responseContent || 'No content received',
          userPrompt: activePromptText,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  }, [profile, activePromptText, saveToCache, setLoading, setError]);

  // Update recommendations when cached recipes change
  useEffect(() => {
    setRecommendations(cachedRecipes);
  }, [cachedRecipes]);

  // Manual refresh function that calls AI API and updates cache
  const handleRefresh = useCallback(async () => {
    if (!profile?.geminiApiKey || !profile?.smartRecommendationsEnabled) {
      setError('AI settings not properly configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await generateRecommendations();
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
    }
  }, [generateRecommendations]);

  if (!profile?.geminiApiKey) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recipe Recommendations</Text>
        <Text style={styles.setupText}>
          Set up your Google Gemini API key in Profile → AI Settings to get personalized recipe recommendations from the internet!
        </Text>
      </View>
    );
  }

  if (!profile?.smartRecommendationsEnabled) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recipe Recommendations</Text>
        <Text style={styles.setupText}>
          Enable Smart Recommendations in Profile → AI Settings to get AI-powered recipe suggestions!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          ✨ AI Recipe Discoveries
        </Text>
        <Text style={styles.sectionSubtitle}>
          Personalized recommendations crafted just for you by Google Gemini
          {hasCachedData && getCacheAge() !== null && (
            <Text style={styles.cacheInfo}>
              {'\n'}📱 Cached {getCacheAge()} hours ago • Saves your AI quota
            </Text>
          )}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={16} color="#374151" />
            <Text style={[styles.headerButtonText, { marginLeft: 6 }]}>Customize</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerButton,
              styles.headerButtonActive,
              loading && { opacity: 0.7 }
            ]}
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={16} color="#fff" />
            )}
            <Text style={[
              styles.headerButtonText,
              styles.headerButtonTextActive,
              { marginLeft: 6 }
            ]}>
              {loading ? 'Creating Magic...' : hasCachedData ? 'Refresh' : 'Discover New'}
            </Text>
          </TouchableOpacity>
          {hasCachedData && (
            <TouchableOpacity
              style={[styles.headerButton, styles.clearCacheButton]}
              onPress={clearCache}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.headerButtonText, { color: '#EF4444', marginLeft: 6 }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Prompt Editor Modal */}
      <Modal
        visible={editMode}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditMode(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setEditedPromptText(activePromptText); // Reset to current active prompt
                setEditMode(false);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit AI Prompt</Text>
            <TouchableOpacity
              onPress={async () => {
                setActivePromptText(editedPromptText);
                
                // Save the custom prompt to user profile
                if (profile && updateProfile) {
                  try {
                    await updateProfile({ customRecipePrompt: editedPromptText });
                    console.log('Custom prompt saved to profile');
                  } catch (error) {
                    console.error('Failed to save custom prompt:', error);
                  }
                }
                
                setEditMode(false);
                // Generate new recommendations immediately
                generateRecommendations();
              }}
              style={[styles.saveButton, { margin: 0, paddingHorizontal: 12 }]}
            >
              <Text style={styles.saveButtonText}>Save & Generate</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.promptTitle}>Customize AI Instructions:</Text>
            <TextInput
              style={[styles.promptInput, { height: 400 }]} // Taller input for better editing
              value={editedPromptText}
              onChangeText={setEditedPromptText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.headerButton, {
                backgroundColor: '#8E8E93',
                alignSelf: 'center',
                marginTop: 16
              }]}
              onPress={async () => {
                const defaultPrompt = generateDefaultPromptText(profile);
                setEditedPromptText(defaultPrompt);
                
                // Also clear the saved custom prompt from profile
                if (profile && updateProfile) {
                  try {
                    await updateProfile({ customRecipePrompt: null });
                    console.log('Custom prompt reset to default');
                  } catch (error) {
                    console.error('Failed to reset custom prompt:', error);
                  }
                }
              }}
            >
              <Text style={styles.headerButtonText}>Reset to Default</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            Generating personalized recommendations using Google Gemini...
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
        decelerationRate="normal"
        snapToInterval={222}
        snapToAlignment="start"
        pagingEnabled={false}
        scrollEventThrottle={16}
      >
        {recommendations.map((recipe, index) => (
          <View key={index} style={styles.recipeCard}>
            <View style={styles.recipeContent}>
              <View style={styles.recipeTopContent}>
                <View style={styles.recipeBadge}>
                  <Text style={styles.recipeBadgeText}>{String(recipe.cuisine || '')}</Text>
                </View>
                <Text style={styles.recipeName}>{String(recipe.name || '')}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {String(recipe.description || '')}
                </Text>
                
                <View style={styles.recipeMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="flame" size={12} color="#EF4444" />
                    <Text style={styles.metricValue}>{String(recipe.calories || 0)}</Text>
                    <Text style={styles.metricLabel}>CAL</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="time" size={12} color="#3B82F6" />
                    <Text style={styles.metricValue}>{String(recipe.cookTime || '')}</Text>
                    <Text style={styles.metricLabel}>TIME</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="bar-chart" size={12} color="#10B981" />
                    <Text style={styles.metricValue}>{String(recipe.difficulty || '')}</Text>
                    <Text style={styles.metricLabel}>LEVEL</Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewRecipe(recipe)}
                >
                  <Text style={styles.viewButtonText}>View Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToMyRecipes(recipe)}
                >
                  <Ionicons name="add-circle" size={12} color="#fff" />
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {recommendations.length === 0 && !loading && !error && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="sparkles-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {hasCachedData ? 'No cached recipes found' : 'Tap "Discover New" to generate AI-powered recipe recommendations!'}
          </Text>
          <Text style={styles.quotaText}>
            💡 Recipes are cached for 24 hours to save your AI quota
          </Text>
        </View>
      )}

      {/* Recipe Detail Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowRecipeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Recipe Details</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedRecipe && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.recipeTitle}>{selectedRecipe.name}</Text>
              <Text style={styles.recipeSubtitle}>{selectedRecipe.description}</Text>
              
              <Text style={styles.debugText}>Image URL: {selectedRecipe.imageUrl || 'No URL provided'}</Text>
              
              <View style={styles.recipeInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="restaurant" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedRecipe.cuisine}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="flame" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedRecipe.calories} cal</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedRecipe.cookTime}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="bar-chart" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedRecipe.difficulty}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Text style={styles.stepNumber}>{index + 1}.</Text>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modal and Form Styles
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  promptInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    lineHeight: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Main Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  headerButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  headerButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Setup and Error States
  setupText: {
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingVertical: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    marginBottom: 20,
    marginHorizontal: 20,
    lineHeight: 22,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginLeft: 12,
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Recipe Cards Container
  scroll: {
    paddingVertical: 8,
  },
  
  // Enhanced Recipe Card Design
  recipeCard: {
    width: 210,
    height: 260,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  recipeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recipeContent: {
    padding: 12,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  recipeTopContent: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 20,
  },
  recipeDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  
  // Recipe Metrics with Icons
  recipeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  
  
  // Action Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Empty State
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
  },
  
  debugText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginVertical: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 36,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  recipeSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 26,
  },
  recipeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  bullet: {
    fontSize: 18,
    color: '#3B82F6',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginRight: 16,
    marginTop: 2,
    minWidth: 28,
    textAlign: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  
  // New cache-related styles
  cacheInfo: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  clearCacheButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  quotaText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});