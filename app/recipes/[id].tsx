import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { amplifyClient, isAmplifyReady } from '../../lib/amplify';
import type { Schema } from '../../amplify/data/resource';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { useShoppingList } from '../../hooks/useShoppingList';
import MealPlanDatePicker from '../../components/MealPlanDatePicker';
import { parseIngredient, categorizeIngredient } from '../../utils/shoppingListGenerator';
import SimpleNutritionAnalysis from '../../components/recipe/SimpleNutritionAnalysis';

type Recipe = Schema['Recipe'];

export default function RecipeDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading, isInitialized } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMealPlanPicker, setShowMealPlanPicker] = useState(false);
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const [showNutritionAnalysis, setShowNutritionAnalysis] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const { addShoppingListItem } = useShoppingList();

  useEffect(() => {
    let mounted = true;

    const loadRecipe = async () => {
      // Wait for auth to be initialized
      if (!isInitialized) {
        return;
      }

      // Check if user is authenticated
      if (!session) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Check if Amplify is ready
      if (!isAmplifyReady()) {
        setError('Service not available');
        setLoading(false);
        return;
      }

      try {
        // Check if Amplify models are available
        if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
          console.log('⚠️ Amplify Recipe model not available');
          setError('Recipe backend not configured');
          setLoading(false);
          return;
        }
        
        const result = await (amplifyClient.models as any).Recipe.get({ id: id as string });
        if (mounted && result.data) {
          setRecipe(result.data);
          console.log('Recipe details record:', result.data);
          console.log('Recipe imageUrl used in details:', result.data.imageUrl);
          
          // Track recently viewed recipe
          if ((global as any).addToRecentlyViewed) {
            (global as any).addToRecentlyViewed(result.data);
          }
        } else if (mounted) {
          setError('Recipe not found');
        }
      } catch (error) {
        if (mounted) {
          setError('Failed to load recipe');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      mounted = false;
    };
  }, [id, session, isInitialized]);


  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF4081" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          setLoading(true);
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="document-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  // Parse ingredients and instructions - they might be JSON strings or arrays
  let ingredients: string[] = [];
  let instructions: string[] = [];

  try {
    if (Array.isArray(recipe.ingredients)) {
      ingredients = recipe.ingredients;
    } else if (typeof recipe.ingredients === 'string') {
      ingredients = JSON.parse(recipe.ingredients);
    }
  } catch (error) {
    console.log('Error parsing ingredients:', error);
    ingredients = typeof recipe.ingredients === 'string' ? [recipe.ingredients] : [];
  }

  try {
    if (Array.isArray(recipe.instructions)) {
      instructions = recipe.instructions;
    } else if (typeof recipe.instructions === 'string') {
      instructions = JSON.parse(recipe.instructions);
    }
  } catch (error) {
    console.log('Error parsing instructions:', error);
    instructions = typeof recipe.instructions === 'string' ? [recipe.instructions] : [];
  }

  console.log('Parsed ingredients:', ingredients);
  console.log('Parsed instructions:', instructions);

  const handleAddToShoppingList = async () => {
    if (!recipe || !session?.user?.id) return;

    setAddingToShoppingList(true);

    try {
      // Parse and add each ingredient to shopping list
      const addPromises = ingredients.map(async (ingredientStr: string) => {
        const ingredient = parseIngredient(ingredientStr);
        return addShoppingListItem(
          ingredient.name,
          ingredient.quantity.toString(),
          ingredient.unit,
          ingredient.category,
          recipe.id
        );
      });

      const results = await Promise.all(addPromises);
      const successCount = results.filter(Boolean).length;

      if (successCount > 0) {
        Alert.alert(
          'Success',
          `Added ${successCount} ingredient${successCount !== 1 ? 's' : ''} to your shopping list!`
        );
      } else {
        Alert.alert('Error', 'Failed to add ingredients to shopping list');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add ingredients to shopping list');
    } finally {
      setAddingToShoppingList(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 8 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {imageError ? (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={48} color="#666" />
            </View>
          ) : (
            <Image
              source={{ uri: recipe.imageUrl || undefined }}
              style={styles.coverImage}
              onError={() => setImageError(true)}
            />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{recipe.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.favoriteButton, { marginRight: 8 }]}
                onPress={() => router.push(`/recipes/edit?id=${recipe.id}`)}
                accessibilityLabel="Edit Recipe"
              >
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={24} color="#FF4081" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nutrition Info */}
        {(recipe.nutrition?.calories || recipe.nutrition?.protein || recipe.nutrition?.carbs || recipe.nutrition?.fat) && (
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <View style={styles.nutritionGrid}>
              {recipe.nutrition?.calories && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.calories)}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
              )}
              {recipe.nutrition?.protein && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.protein)}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              )}
              {recipe.nutrition?.carbs && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.carbs)}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              )}
              {recipe.nutrition?.fat && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(recipe.nutrition.fat)}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              )}
            </View>
            
            {/* Recipe Meta Info */}
            <View style={styles.metaInfo}>
              {recipe.servings && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{recipe.servings} servings</Text>
                </View>
              )}
              {recipe.prepTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{recipe.prepTime}min prep</Text>
                </View>
              )}
              {recipe.cookTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="flash" size={16} color="#666" />
                  <Text style={styles.metaText}>{recipe.cookTime}min cook</Text>
                </View>
              )}
              {recipe.difficulty && (
                <View style={styles.metaItem}>
                  <Ionicons name="bar-chart-outline" size={16} color="#666" />
                  <Text style={[styles.metaText, styles.difficulty]}>{recipe.difficulty}</Text>
                </View>
              )}
            </View>
            
            {/* Nutrition Analysis Button */}
            <TouchableOpacity
              style={styles.nutritionAnalysisButton}
              onPress={() => setShowNutritionAnalysis(true)}
            >
              <Ionicons name="analytics" size={16} color="#007AFF" />
              <Text style={styles.nutritionAnalysisText}>Nutrition Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ingredient: any, index: number) => (
            <View key={index} style={styles.ingredientItem}>
              <Ionicons name="ellipse" size={8} color="#666" />
              <Text style={styles.ingredientText}>
                {typeof ingredient === 'string'
                  ? ingredient
                  : [
                      ingredient.name,
                      ingredient.quantity ? `- ${ingredient.quantity}` : '',
                      ingredient.unit ? ingredient.unit : ''
                    ]
                      .filter(Boolean)
                      .join(' ')
                }
              </Text>
            </View>
          ))}
        </View>

        {/* Instructions Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructions.map((instruction: string, index: number) => (
            <View key={index} style={styles.instructionItem}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => setShowMealPlanPicker(true)}
        >
          <Ionicons name="calendar" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add to Meal Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddToShoppingList}
          disabled={addingToShoppingList}
        >
          {addingToShoppingList ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="cart" size={24} color="#007AFF" />
          )}
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            {addingToShoppingList ? 'Adding...' : 'Add to Shopping List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meal Plan Date Picker Modal */}
      {recipe && (
        <MealPlanDatePicker
          visible={showMealPlanPicker}
          onClose={() => setShowMealPlanPicker(false)}
          recipe={recipe}
        />
      )}

      {/* Simple Nutrition Analysis Modal */}
      {recipe && (
        <SimpleNutritionAnalysis
          visible={showNutritionAnalysis}
          onClose={() => setShowNutritionAnalysis(false)}
          ingredients={ingredients}
          servings={recipe.servings || 4}
          recipeName={recipe.name || 'Recipe'}
          currentNutrition={{
            calories: recipe.nutrition?.calories || undefined,
            protein: recipe.nutrition?.protein || undefined,
            carbs: recipe.nutrition?.carbs || undefined,
            fat: recipe.nutrition?.fat || undefined,
          }}
        />
      )}
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  favoriteButton: {
    padding: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastSection: {
    borderBottomWidth: 0,
    paddingBottom: 100, // Space for action bar
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientText: {
    fontSize: 16,
    marginLeft: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: '#f8f9fa',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  difficulty: {
    textTransform: 'capitalize',
  },
  nutritionAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  nutritionAnalysisText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
});
