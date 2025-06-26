import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDashboardData } from '../../hooks/useDashboardData';
import { getAmplifyClient } from '../../lib/amplify';
import { useAuth } from '../../lib/AuthContext';

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'recipe' | 'action' | 'tip' | 'weather';
  priority: number;
  action: () => void;
  data?: any;
}

export default function SmartSuggestions() {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const { todaysMeals } = useDashboardData();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [weather, setWeather] = useState<string>('clear');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate smart suggestions based on context
  const generateSuggestions = useCallback(async () => {
    const newSuggestions: SmartSuggestion[] = [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Load user's recipes for recipe suggestions
    let userRecipes: any[] = [];
    if (profile?.userId) {
      try {
        const client = getAmplifyClient();
        const { data: recipeData } = await client.models.Recipe.list({
          filter: {
            userId: { eq: profile.userId },
          }
        });
        userRecipes = recipeData || [];
        setRecipes(userRecipes);
      } catch (error) {
        console.error('Error loading recipes:', error);
      }
    }

    // Always show some suggestions for testing - Time-based suggestions
    if (currentHour >= 6 && currentHour <= 10) {
      newSuggestions.push({
        id: 'morning_breakfast',
        title: '🌅 Start Your Day Right',
        description: todaysMeals.breakfast.isEmpty ? 'Plan a healthy breakfast to fuel your morning' : 'Consider adding a morning snack',
        icon: 'cafe',
        color: Colors.warning,
        type: 'action',
        priority: 10,
        action: () => router.push('/(tabs)/meal-planner'),
      });
    }

    if (currentHour >= 11 && currentHour <= 14) {
      newSuggestions.push({
        id: 'lunch_time',
        title: '🥗 Lunch Break Coming Up',
        description: todaysMeals.lunch.isEmpty ? 'Plan your lunch for sustained afternoon energy' : 'How about a healthy afternoon snack?',
        icon: 'fast-food',
        color: Colors.secondary,
        type: 'action',
        priority: 9,
        action: () => router.push('/(tabs)/meal-planner'),
      });
    }

    if (currentHour >= 16 && currentHour <= 23) {
      newSuggestions.push({
        id: 'dinner_planning',
        title: '🍽️ Dinner Planning Time',
        description: todaysMeals.dinner.isEmpty ? 'Plan a satisfying dinner for tonight' : 'Review your dinner plan',
        icon: 'restaurant',
        color: Colors.accent,
        type: 'action',
        priority: 8,
        action: () => router.push('/(tabs)/meal-planner'),
      });
    }

    // Always show explore recipes suggestion
    newSuggestions.push({
      id: 'explore_recipes',
      title: '🔍 Explore Recipes',
      description: 'Discover new recipes to add to your collection',
      icon: 'search',
      color: Colors.primary,
      type: 'action',
      priority: 7,
      action: () => router.push('/(tabs)/recipes'),
    });

    // Weather-based suggestions (mock weather for demo)
    const weatherConditions = ['sunny', 'rainy', 'cold', 'hot'];
    const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    setWeather(currentWeather);

    if (currentWeather === 'cold') {
      newSuggestions.push({
        id: 'weather_cold',
        title: '🥵 Warm Comfort Food',
        description: 'Perfect weather for soups and hot meals',
        icon: 'thermometer',
        color: Colors.error,
        type: 'weather',
        priority: 6,
        action: () => {
          // Filter for warm/comfort food recipes
          router.push('/(tabs)/recipes?filter=comfort');
        },
      });
    }

    if (currentWeather === 'hot') {
      newSuggestions.push({
        id: 'weather_hot',
        title: '🧊 Cool & Refreshing',
        description: 'Stay cool with salads and cold dishes',
        icon: 'snow',
        color: Colors.primary,
        type: 'weather',
        priority: 6,
        action: () => {
          router.push('/(tabs)/recipes?filter=cold');
        },
      });
    }

    // Recipe of the day suggestion
    if (recipes.length > 0) {
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      newSuggestions.push({
        id: 'recipe_of_day',
        title: '✨ Recipe of the Day',
        description: `Try "${randomRecipe.name}" - one of your saved recipes`,
        icon: 'star',
        color: Colors.warning,
        type: 'recipe',
        priority: 7,
        data: randomRecipe,
        action: () => router.push(`/recipes/${randomRecipe.id}`),
      });
    }

    // Day-specific suggestions
    if (currentDay === 0) { // Sunday
      newSuggestions.push({
        id: 'sunday_prep',
        title: '📋 Sunday Meal Prep',
        description: 'Plan your week ahead for a stress-free Monday',
        icon: 'calendar',
        color: Colors.primary,
        type: 'action',
        priority: 5,
        action: () => router.push('/(tabs)/meal-planner'),
      });
    }

    if (currentDay === 1) { // Monday
      newSuggestions.push({
        id: 'monday_energy',
        title: '💪 Monday Motivation',
        description: 'Start the week with energizing meals',
        icon: 'fitness',
        color: Colors.secondary,
        type: 'tip',
        priority: 4,
        action: () => router.push('/(tabs)/recipes?filter=high-protein'),
      });
    }

    // Quick meal suggestions for busy times
    if (currentHour >= 18 && currentHour <= 20) {
      newSuggestions.push({
        id: 'quick_dinner',
        title: '⚡ Quick 15-Min Dinners',
        description: 'Fast and delicious meals for busy evenings',
        icon: 'flash-outline',
        color: Colors.error,
        type: 'action',
        priority: 8,
        action: () => router.push('/(tabs)/recipes?filter=quick'),
      });
    }

    // AI suggestion prompts
    if (profile?.geminiApiKey && !todaysMeals.breakfast.isEmpty && !todaysMeals.lunch.isEmpty && todaysMeals.dinner.isEmpty) {
      newSuggestions.push({
        id: 'ai_dinner_suggestion',
        title: '🤖 AI Dinner Ideas',
        description: 'Get personalized dinner suggestions based on today\'s meals',
        icon: 'bulb',
        color: Colors.accent,
        type: 'action',
        priority: 9,
        action: () => {
          // Scroll to AI suggestions on home screen or navigate there
          router.push('/(tabs)/home');
        },
      });
    }

    // Shopping list suggestion
    const hasPlannedMeals = !todaysMeals.breakfast.isEmpty || !todaysMeals.lunch.isEmpty || !todaysMeals.dinner.isEmpty;
    if (hasPlannedMeals && currentHour >= 8 && currentHour <= 12) {
      newSuggestions.push({
        id: 'shopping_list',
        title: '🛒 Generate Shopping List',
        description: 'Create a shopping list from your planned meals',
        icon: 'bag',
        color: Colors.primary,
        type: 'action',
        priority: 6,
        action: () => router.push('/(tabs)/shopping-list'),
      });
    }

    // Nutrition tracking suggestion
    if (currentHour >= 19 && currentHour <= 22) {
      newSuggestions.push({
        id: 'nutrition_review',
        title: '📊 Daily Nutrition Review',
        description: 'Check how you\'re doing with today\'s nutrition goals',
        icon: 'analytics',
        color: Colors.secondary,
        type: 'action',
        priority: 5,
        action: () => router.push('/(tabs)/profile'),
      });
    }

    // Fallback suggestions if none generated
    if (newSuggestions.length === 0) {
      newSuggestions.push(
        {
          id: 'fallback_explore',
          title: '🔍 Explore Recipes',
          description: 'Browse and discover new recipes',
          icon: 'search',
          color: Colors.primary,
          type: 'action',
          priority: 5,
          action: () => router.push('/(tabs)/recipes'),
        },
        {
          id: 'fallback_plan',
          title: '📅 Plan Your Meals',
          description: 'Organize your weekly meal schedule',
          icon: 'calendar',
          color: Colors.secondary,
          type: 'action',
          priority: 4,
          action: () => router.push('/(tabs)/meal-planner'),
        },
        {
          id: 'fallback_add',
          title: '➕ Add New Recipe',
          description: 'Create a new recipe for your collection',
          icon: 'add',
          color: Colors.accent,
          type: 'action',
          priority: 3,
          action: () => router.push('/recipes/add'),
        }
      );
    }

    // Sort suggestions by priority (higher number = higher priority)
    newSuggestions.sort((a, b) => b.priority - a.priority);
    
    // Limit to top 3 suggestions
    setSuggestions(newSuggestions.slice(0, 3));
  }, [session?.user?.id, todaysMeals.breakfast.isEmpty, todaysMeals.lunch.isEmpty, todaysMeals.dinner.isEmpty, profile?.geminiApiKey, router]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Refresh suggestions every 30 minutes
  useEffect(() => {
    const interval = setInterval(generateSuggestions, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateSuggestions]);

  // Show loading state or always show the component
  if (suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Smart Suggestions</Text>
            <Text style={styles.subtitle}>Loading personalized recommendations...</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={generateSuggestions}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Smart Suggestions</Text>
          <Text style={styles.subtitle}>Personalized recommendations just for you</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={generateSuggestions}>
          <Ionicons name="refresh" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsContainer}
        contentContainerStyle={styles.suggestionsContent}
      >
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[styles.suggestionCard, { borderLeftColor: suggestion.color }]}
            onPress={suggestion.action}
            activeOpacity={0.8}
          >
            <View style={styles.suggestionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${suggestion.color}15` }]}>
                <Ionicons name={suggestion.icon as any} size={20} color={suggestion.color} />
              </View>
              <View style={styles.typeIndicator}>
                <Text style={[styles.typeText, { color: suggestion.color }]}>
                  {suggestion.type.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            </View>
            
            <View style={styles.suggestionAction}>
              <View style={[styles.actionButton, { backgroundColor: `${suggestion.color}15` }]}>
                <Text style={[styles.actionText, { color: suggestion.color }]}>
                  {suggestion.type === 'recipe' ? 'View Recipe' :
                   suggestion.type === 'action' ? 'Take Action' :
                   suggestion.type === 'tip' ? 'Learn More' : 'Explore'}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={suggestion.color} />
              </View>
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
  refreshButton: {
    padding: Spacing.sm,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.lg,
  },
  suggestionsContainer: {
    marginHorizontal: -Spacing.lg,
  },
  suggestionsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  suggestionCard: {
    width: 280,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    marginRight: Spacing.md,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIndicator: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  suggestionContent: {
    marginBottom: Spacing.lg,
  },
  suggestionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeights.tight,
  },
  suggestionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.normal,
  },
  suggestionAction: {
    alignItems: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});