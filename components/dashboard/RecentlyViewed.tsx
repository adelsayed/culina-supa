import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { useAuth } from '../../lib/AuthContext';
import { getAmplifyClient } from '../../lib/amplify';

interface RecentRecipe {
  id: string;
  name: string;
  imageUrl?: string;
  category?: string;
  calories?: number;
  cookTime?: number;
  viewedAt: string;
  difficulty?: string;
}

const RECENT_RECIPES_KEY = 'recently_viewed_recipes';
const MAX_RECENT_RECIPES = 10;

export default function RecentlyViewed() {
  const { session } = useAuth();
  const router = useRouter();
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recently viewed recipes from storage
  const loadRecentRecipes = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(`${RECENT_RECIPES_KEY}_${session.user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentRecipe[];
        // Sort by most recently viewed
        const sorted = parsed.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
        setRecentRecipes(sorted.slice(0, 6)); // Show max 6 in the dashboard
      }
    } catch (error) {
      console.error('Error loading recent recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Add a recipe to recently viewed
  const addToRecentlyViewed = useCallback(async (recipe: any) => {
    if (!session?.user?.id || !recipe) return;

    try {
      const recentRecipe: RecentRecipe = {
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        category: recipe.category,
        calories: recipe.calories,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        viewedAt: new Date().toISOString(),
      };

      // Load existing recent recipes
      const stored = await AsyncStorage.getItem(`${RECENT_RECIPES_KEY}_${session.user.id}`);
      let recentList: RecentRecipe[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to move to top)
      recentList = recentList.filter(r => r.id !== recipe.id);

      // Add to front of list
      recentList.unshift(recentRecipe);

      // Limit to MAX_RECENT_RECIPES
      recentList = recentList.slice(0, MAX_RECENT_RECIPES);

      // Save back to storage
      await AsyncStorage.setItem(`${RECENT_RECIPES_KEY}_${session.user.id}`, JSON.stringify(recentList));

      // Update state
      setRecentRecipes(recentList.slice(0, 6));
    } catch (error) {
      console.error('Error adding to recent recipes:', error);
    }
  }, [session?.user?.id]);

  // Clear recently viewed recipes
  const clearRecentRecipes = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      await AsyncStorage.removeItem(`${RECENT_RECIPES_KEY}_${session.user.id}`);
      setRecentRecipes([]);
    } catch (error) {
      console.error('Error clearing recent recipes:', error);
    }
  }, [session?.user?.id]);

  // Handle recipe press
  const handleRecipePress = useCallback((recipe: RecentRecipe) => {
    router.push(`/recipes/${recipe.id}`);
  }, [router]);

  // Handle "Cook Again" - add to today's meal plan
  const handleCookAgain = useCallback(async (recipe: RecentRecipe) => {
    // Determine best meal type based on current time
    const currentHour = new Date().getHours();
    let mealType = 'dinner'; // default

    if (currentHour >= 6 && currentHour <= 10) {
      mealType = 'breakfast';
    } else if (currentHour >= 11 && currentHour <= 15) {
      mealType = 'lunch';
    } else if (currentHour >= 16 && currentHour <= 20) {
      mealType = 'dinner';
    }

    router.push(`/(tabs)/meal-planner?addMeal=${mealType}&recipeId=${recipe.id}`);
  }, [router]);

  // Handle view all
  const handleViewAll = useCallback(() => {
    // For now, navigate to recipes tab
    // In the future, could open a dedicated "Recently Viewed" screen
    router.push('/(tabs)/recipes');
  }, [router]);

  // Load data on mount
  useEffect(() => {
    loadRecentRecipes();
  }, [loadRecentRecipes]);

  // Expose addToRecentlyViewed function globally (could be called from recipe detail screen)
  useEffect(() => {
    // Store reference for other components to use
    (global as any).addToRecentlyViewed = addToRecentlyViewed;
    return () => {
      delete (global as any).addToRecentlyViewed;
    };
  }, [addToRecentlyViewed]);

  if (loading || recentRecipes.length === 0) {
    return null; // Don't show section if no recent recipes
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recently Viewed</Text>
          <Text style={styles.subtitle}>Quick access to your recent recipes</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewAll}>
            <Text style={styles.actionButtonText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
          {recentRecipes.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearRecentRecipes}>
              <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.recipesContainer}
        contentContainerStyle={styles.recipesContent}
      >
        {recentRecipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe)}
            activeOpacity={0.8}
          >
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.textTertiary} />
              </View>
            )}
            
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
              
              {recipe.category && (
                <Text style={styles.recipeCategory}>{recipe.category}</Text>
              )}
              
              <View style={styles.recipeMetrics}>
                {recipe.calories && (
                  <View style={styles.metric}>
                    <Ionicons name="flame" size={12} color={Colors.warning} />
                    <Text style={styles.metricText}>{recipe.calories}</Text>
                  </View>
                )}
                {recipe.cookTime && (
                  <View style={styles.metric}>
                    <Ionicons name="time" size={12} color={Colors.primary} />
                    <Text style={styles.metricText}>{recipe.cookTime}m</Text>
                  </View>
                )}
                {recipe.difficulty && (
                  <View style={styles.metric}>
                    <Ionicons name="bar-chart" size={12} color={Colors.secondary} />
                    <Text style={styles.metricText}>{recipe.difficulty}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.recipeActions}>
              <TouchableOpacity
                style={styles.cookAgainButton}
                onPress={() => handleCookAgain(recipe)}
              >
                <Ionicons name="add-circle" size={16} color={Colors.primary} />
                <Text style={styles.cookAgainText}>Cook Again</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
  },
  recipesContainer: {
    marginHorizontal: -Spacing.lg,
  },
  recipesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  recipeCard: {
    width: 200,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recipeInfo: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  recipeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeights.tight,
  },
  recipeCategory: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'capitalize',
  },
  recipeMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  recipeActions: {
    alignItems: 'stretch',
  },
  cookAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  cookAgainText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
});