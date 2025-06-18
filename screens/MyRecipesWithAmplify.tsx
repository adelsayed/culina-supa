import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
import { dummyRecipes } from '../data/dummyRecipes';
import { navigateToRecipe } from '../lib/navigation';
import SimpleRecipeImport from '../components/recipe/SimpleRecipeImport';
import { testAmplifyConnection } from '../utils/amplifyDiagnostic';
// import { subscriptionManager } from '../lib/subscriptionManager'; // temporarily disabled

type Recipe = Schema['Recipe'];

const RecipeItem: React.FC<{
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({ recipe, isFavorite, onToggleFavorite, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  // Safely parse ingredients with error handling
  let ingredients: string[] = [];
  try {
    if (recipe.ingredients) {
      if (Array.isArray(recipe.ingredients)) {
        ingredients = recipe.ingredients;
      } else if (typeof recipe.ingredients === 'string') {
        const parsed = JSON.parse(recipe.ingredients);
        ingredients = Array.isArray(parsed) ? parsed : [recipe.ingredients];
      }
    }
  } catch (error) {
    // If JSON parsing fails, treat as plain string and split by lines
    if (typeof recipe.ingredients === 'string') {
      ingredients = (recipe.ingredients as string).split('\n').filter(Boolean);
    } else if (Array.isArray(recipe.ingredients)) {
      ingredients = recipe.ingredients;
    }
  }

  const tags = Array.isArray(recipe.tags) ? recipe.tags.filter((t): t is string => typeof t === 'string' && !!t) : [];
  const category = recipe.category || '';

  return (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => navigateToRecipe(recipe.id)}
      activeOpacity={0.85}
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
        {category ? (
          <Text style={styles.recipeCategory}>{category}</Text>
        ) : null}
        <Text style={styles.recipeIngredients} numberOfLines={2}>
          Ingredients: {ingredients.join(', ')}
        </Text>
        {tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
            {tags.map((tag: string) => (
              <View
                key={tag}
                style={{
                  backgroundColor: '#eee',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginRight: 4,
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontSize: 12, color: '#007AFF' }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 8 }}>
        <TouchableOpacity
          onPress={() => onToggleFavorite(recipe.id)}
          accessibilityLabel={isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color="#FF4081" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onEdit && onEdit(recipe.id)}
          style={{ marginTop: 10 }}
          accessibilityLabel="Edit Recipe"
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete && onDelete(recipe.id)}
          style={{ marginTop: 10 }}
          accessibilityLabel="Delete Recipe"
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const MyRecipesWithAmplify: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<'recent' | 'az' | 'za' | 'favorites'>('recent');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { session } = useAuth();

  // Toggle favorite for a recipe
  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  // Delete recipe with confirmation
  const handleDeleteRecipe = (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if Amplify models are available
              if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
                Alert.alert('Error', 'Recipe backend not configured');
                return;
              }
              
              await (amplifyClient.models as any).Recipe.delete({ id });
              // Remove from favorites if it was favorited
              setFavorites(prev => prev.filter(fav => fav !== id));
              // Note: The subscription will automatically update the recipes list
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Extract unique tags from all recipes
  const allTags = Array.from(
    new Set(
      recipes
        .flatMap(r => Array.isArray(r.tags) ? r.tags : [])
        .filter((t): t is string => typeof t === 'string' && !!t)
        .map((t: string) => t.trim())
    )
  );

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

  // Test Amplify connection
  const handleTestConnection = async () => {
    if (!session?.user?.id) {
      Alert.alert('No User', 'Please sign in first');
      return;
    }
    
    console.log('Testing Amplify connection...');
    const result = await testAmplifyConnection(session.user.id);
    
    if (result.success) {
      Alert.alert(
        'Connection Test ✅',
        `Found ${result.totalRecipes} recipes in database.\nModels: ${result.models?.join(', ')}`
      );
    } else {
      Alert.alert(
        'Connection Test ❌',
        `Error: ${(result.error as Error)?.message || 'Unknown error'}\nAmplify Client: ${result.amplifyClientExists ? 'Yes' : 'No'}`
      );
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
        
        // Check if Amplify models are available
        if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
          console.log('⚠️ Amplify Recipe model not available');
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        const existingRecipesResult = await (amplifyClient.models as any).Recipe.list({
          filter: { userId: { eq: userId } }
        });

        if (existingRecipesResult.data.length === 0 && mounted) {
          console.log("No recipes found, seeding data...");
          await seedRecipes(userId);
        }

        // Set up subscription only if component is still mounted
        if (mounted) {
          subscription = (amplifyClient.models as any).Recipe.observeQuery({
            filter: { userId: { eq: userId } }
          }).subscribe({
            next: ({ items }: { items: any[] }) => {
              if (mounted) {
                console.log("Received recipes:", items.length);
                setRecipes(items);
                setLoading(false);
              }
            },
            error: (error: any) => {
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
    
    // Check if Amplify models are available
    if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
      console.log('⚠️ Amplify Recipe model not available, skipping seeding');
      return;
    }
    
    try {
      // Check if user already has recipes
      const existingRecipesResult = await (amplifyClient.models as any).Recipe.list({
        filter: {
          userId: { eq: userId }
        }
      });

      if (existingRecipesResult.data.length === 0) {
        console.log("No recipes found for user, seeding dummy recipes...");
        
        // Seed dummy recipes
        for (const recipe of dummyRecipes) {
          await (amplifyClient.models as any).Recipe.create({
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
        
        {/* Test Connection Button */}
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: '#007AFF',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            elevation: 3,
          }}
          onPress={handleTestConnection}
        >
          <Ionicons name="cloud-outline" size={24} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>
            Test Amplify Connection
          </Text>
        </TouchableOpacity>
        
      </View>
    );
  }

  // Filter and sort recipes
  let filteredRecipes = recipes.filter((recipe) => {
    const query = search.toLowerCase();
    const name = recipe.name?.toLowerCase() || '';
    
    // Safely parse ingredients for search
    let ingredientsText = '';
    try {
      if (recipe.ingredients) {
        if (Array.isArray(recipe.ingredients)) {
          ingredientsText = recipe.ingredients.join(', ').toLowerCase();
        } else if (typeof recipe.ingredients === 'string') {
          const parsed = JSON.parse(recipe.ingredients);
          ingredientsText = Array.isArray(parsed) ? parsed.join(', ').toLowerCase() : (recipe.ingredients as string).toLowerCase();
        }
      }
    } catch (error) {
      // If JSON parsing fails, use as plain string
      if (typeof recipe.ingredients === 'string') {
        ingredientsText = (recipe.ingredients as string).toLowerCase();
      } else if (Array.isArray(recipe.ingredients)) {
        ingredientsText = recipe.ingredients.join(', ').toLowerCase();
      }
    }
    
    const tags = Array.isArray(recipe.tags) ? recipe.tags.join(', ').toLowerCase() : '';
    const matchesTag = tagFilter ? (Array.isArray(recipe.tags) && recipe.tags.includes(tagFilter)) : true;
    return (
      (name.includes(query) ||
      ingredientsText.includes(query) ||
      tags.includes(query)) && matchesTag
    );
  });

  // Sorting
  if (sort === 'az') {
    filteredRecipes = filteredRecipes.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sort === 'za') {
    filteredRecipes = filteredRecipes.slice().sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sort === 'favorites') {
    filteredRecipes = filteredRecipes.slice().sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      return aFav - bFav;
    });
  } // 'recent' is default order

  return (
    <View style={styles.container}>
      {/* Header with Search, Favorites, Add */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 10,
              backgroundColor: '#fafbfc',
              fontSize: 16,
            }}
            placeholder="Search recipes..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={{ marginLeft: 8 }}
          onPress={() => setShowFavoritesOnly(f => !f)}
        >
          <Ionicons name={showFavoritesOnly ? "heart" : "heart-outline"} size={28} color="#FF4081" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginLeft: 8, backgroundColor: '#fff', borderRadius: 20, padding: 4, elevation: 2 }}
          onPress={() => setShowImportModal(true)}
          accessibilityLabel="Import Recipe"
        >
          <Ionicons name="download" size={28} color="#34C759" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginLeft: 8, backgroundColor: '#fff', borderRadius: 20, padding: 4, elevation: 2 }}
          onPress={handleAddRecipe}
          accessibilityLabel="Add Recipe"
        >
          <Ionicons name="add" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {/* Sort Segmented Control */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
        {/* Recent */}
        <TouchableOpacity
          onPress={() => setSort('recent')}
          style={{
            backgroundColor: sort === 'recent' ? '#007AFF' : '#eee',
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 18,
            marginHorizontal: 4,
          }}
        >
          <Text style={{ color: sort === 'recent' ? '#fff' : '#007AFF', fontWeight: '600' }}>Recent</Text>
        </TouchableOpacity>
        {/* A-Z / Z-A */}
        <TouchableOpacity
          onPress={() => setSort(sort === 'az' ? 'za' : 'az')}
          style={{
            backgroundColor: sort === 'az' || sort === 'za' ? '#007AFF' : '#eee',
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 18,
            marginHorizontal: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: sort === 'az' || sort === 'za' ? '#fff' : '#007AFF', fontWeight: '600' }}>
            {sort === 'za' ? 'Z-A' : 'A-Z'}
          </Text>
          <Ionicons
            name={sort === 'za' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={sort === 'az' || sort === 'za' ? '#fff' : '#007AFF'}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
        {/* Favs */}
        <TouchableOpacity
          onPress={() => setSort('favorites')}
          style={{
            backgroundColor: sort === 'favorites' ? '#007AFF' : '#eee',
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 18,
            marginHorizontal: 4,
          }}
        >
          <Text style={{ color: sort === 'favorites' ? '#fff' : '#007AFF', fontWeight: '600' }}>Favs</Text>
        </TouchableOpacity>
      </View>
      {/* Tag Filter Bar */}
      {allTags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: tagFilter === null ? '#007AFF' : '#eee',
              borderRadius: 12,
              paddingVertical: 4,
              paddingHorizontal: 12,
              marginRight: 8,
              marginBottom: 4,
            }}
            onPress={() => setTagFilter(null)}
          >
            <Text style={{ color: tagFilter === null ? '#fff' : '#007AFF', fontWeight: '600' }}>All</Text>
          </TouchableOpacity>
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={{
                backgroundColor: tagFilter === tag ? '#007AFF' : '#eee',
                borderRadius: 12,
                paddingVertical: 4,
                paddingHorizontal: 12,
                marginRight: 8,
                marginBottom: 4,
              }}
              onPress={() => setTagFilter(tag)}
            >
              <Text style={{ color: tagFilter === tag ? '#fff' : '#007AFF', fontWeight: '600' }}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={filteredRecipes.filter(r => !showFavoritesOnly || favorites.includes(r.id))}
        renderItem={({ item }) => (
          <RecipeItem
            recipe={item}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={toggleFavorite}
            onEdit={(id) => navigateToRecipe(`edit?id=${id}`)}
            onDelete={handleDeleteRecipe}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      
      {/* Import Recipe Modal */}
      <SimpleRecipeImport
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          setShowImportModal(false);
          // The subscription will automatically update the recipes list
        }}
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
    marginBottom: 2,
  },
  recipeCategory: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
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
