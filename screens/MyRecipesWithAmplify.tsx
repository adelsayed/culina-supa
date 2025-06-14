import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
import { dummyRecipes } from '../data/dummyRecipes';
import { navigateToRecipe } from '../lib/navigation';
// import { subscriptionManager } from '../lib/subscriptionManager'; // temporarily disabled

type Recipe = Schema['Recipe']['type'];

const RecipeItem: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const [imageError, setImageError] = useState(false);

  const ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];

  return (
    <TouchableOpacity 
      style={styles.recipeItem}
      onPress={() => navigateToRecipe(recipe.id)}
    >
      {imageError ? (
        <View style={[styles.recipeImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      ) : (
        <Image
          source={{ uri: recipe.imageUrl || undefined }}
          style={styles.recipeImage}
          onError={() => setImageError(true)}
        />
      )}
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeIngredients} numberOfLines={2}>
          Ingredients: {ingredients.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MyRecipesWithAmplify: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  // Navigation for add recipe
  const handleAddRecipe = () => {
    // If using Expo Router or React Navigation, adjust as needed
    // For Expo Router:
    if (typeof window !== 'undefined' && 'router' in window) {
      // @ts-ignore
      window.router.push('/recipes/add');
    } else if (typeof navigateToRecipe === 'function') {
      // fallback: try to use navigation helper if available
      navigateToRecipe('add');
    }
  };

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;
    let mounted = true;
    let subscription: any = null;

    const loadRecipes = async () => {
      try {
        console.log("Loading recipes for user:", userId);
        const existingRecipesResult = await amplifyClient.models.Recipe.list({
          filter: { userId: { eq: userId } }
        });

        if (existingRecipesResult.data.length === 0 && mounted) {
          console.log("No recipes found, seeding data...");
          await seedRecipes(userId);
        }

        // Set up subscription only if component is still mounted
        if (mounted) {
          subscription = amplifyClient.models.Recipe.observeQuery({
            filter: { userId: { eq: userId } }
          }).subscribe({
            next: ({ items }) => {
              if (mounted) {
                console.log("Received recipes:", items.length);
                setRecipes(items);
                setLoading(false);
              }
            },
            error: (error) => {
              console.error('Subscription error:', error);
              if (mounted) {
                setLoading(false);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRecipes();

    return () => {
      mounted = false;
      if (subscription) {
        console.log("Cleaning up recipe subscription");
        subscription.unsubscribe();
      }
    };
  }, [session?.user?.id]);

  const seedRecipes = async (userId: string) => {
    console.log("Checking if recipes need to be seeded...");
    try {
      // Check if user already has recipes
      const existingRecipesResult = await amplifyClient.models.Recipe.list({
        filter: {
          userId: { eq: userId }
        }
      });

      if (existingRecipesResult.data.length === 0) {
        console.log("No recipes found for user, seeding data...");
        for (const recipe of dummyRecipes) {
          await amplifyClient.models.Recipe.create({
            name: recipe.name,
            ingredients: JSON.stringify(recipe.ingredients),
            instructions: JSON.stringify(recipe.instructions),
            imageUrl: recipe.imageUrl,
            userId: userId,
          });
        }
        console.log("Seeding complete!");
      } else {
        console.log(`Found ${existingRecipesResult.data.length} existing recipes for user`);
      }
    } catch (error) {
      console.error('Error seeding recipes:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }


  if (recipes.length === 0 && !loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="restaurant-outline" size={48} color="#666" />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>
          No recipes found. Your recipes will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Recipe "+" icon at top right */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddRecipe}
        accessibilityLabel="Add Recipe"
      >
        <Ionicons name="add" size={32} color="#007AFF" />
      </TouchableOpacity>
      <FlatList
        data={recipes}
        renderItem={({ item }) => <RecipeItem recipe={item} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  recipeItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
  },
  recipeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipeIngredients: {
    fontSize: 14,
    color: '#666',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
})

export default MyRecipesWithAmplify;
