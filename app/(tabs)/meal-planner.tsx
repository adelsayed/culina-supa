import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import {
  getWeekStartDate,
  getWeekDates,
  formatDateForDisplay,
  isToday,
  navigateWeek,
  getRelativeDateDescription
} from '../../utils/dateUtils';
import { useMealPlanner } from '../../hooks/useMealPlanner';
import { useAchievements } from '../../hooks/useAchievements';
import RecipePicker from '../../components/RecipePicker';
import type { Schema } from '../../amplify/data/resource';
import AIMealSuggestions from '../../components/AIMealSuggestions';
import AIWeeklyPlanner from '../../components/mealplanner/AIWeeklyPlanner';
import NutritionBalancer from '../../components/mealplanner/NutritionBalancer';

type Recipe = Schema['Recipe']['type'];
type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

const MealPlannerScreen: React.FC = () => {
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [showAIWeeklyPlanner, setShowAIWeeklyPlanner] = useState(false);

  const {
    weekMealPlan,
    loading,
    error,
    addMealPlanEntry,
    removeMealPlanEntry,
    navigateToWeek,
  } = useMealPlanner(getWeekStartDate(selectedDate));

  const weekDates = getWeekDates(weekMealPlan.weekStartDate);

  const navigateToPrevWeek = () => {
    const newWeekStart = navigateWeek(weekMealPlan.weekStartDate, 'prev');
    navigateToWeek(newWeekStart);
  };

  const navigateToNextWeek = () => {
    const newWeekStart = navigateWeek(weekMealPlan.weekStartDate, 'next');
    navigateToWeek(newWeekStart);
  };

  const navigateToToday = () => {
    const today = new Date();
    const todayWeekStart = getWeekStartDate(today);
    navigateToWeek(todayWeekStart);
    setSelectedDate(today);
  };

  const handleAddRecipe = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowRecipePicker(true);
  };

  const handleSelectRecipe = async (recipe: Recipe, mealType: MealType, servings: number = 1) => {
    const success = await addMealPlanEntry(selectedDate, mealType, recipe, servings);
    if (success) {
      // Track achievement for meal planning
      await incrementStat('meals_planned');
      
      setShowRecipePicker(false);
    } else {
      Alert.alert('Error', 'Failed to add recipe to meal plan');
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe from your meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMealPlanEntry(entryId);
            if (!success) {
              Alert.alert('Error', 'Failed to remove recipe from meal plan');
            }
          },
        },
      ]
    );
  };

  const handleAIWeeklyPlan = async (weekPlan: any[], clearExisting: boolean = false) => {
    try {
      let successCount = 0;
      let totalMeals = 0;

      // Clear existing meals if requested
      if (clearExisting) {
        for (const day of weekMealPlan.days) {
          for (const mealType of ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'] as MealType[]) {
            const meals = day.meals[mealType] || [];
            for (const meal of meals) {
              await removeMealPlanEntry(meal.id);
            }
          }
        }
      }

      // Apply each day's meals to the meal planner
      for (const dayPlan of weekPlan) {
        const dayDate = dayPlan.date;
        
        // Add each meal type for this day
        const mealTypes = [
          { type: 'breakfast' as MealType, name: dayPlan.meals.breakfast },
          { type: 'lunch' as MealType, name: dayPlan.meals.lunch },
          { type: 'dinner' as MealType, name: dayPlan.meals.dinner },
        ];

        for (const meal of mealTypes) {
          totalMeals++;
          
          // Create a virtual recipe entry for the AI-generated meal
          const virtualRecipe = {
            id: `ai-${Date.now()}-${Math.random()}`,
            name: meal.name,
            userId: session?.user?.id || '',
            ingredients: '[]', // Empty for now
            instructions: '[]', // Empty for now
            servings: 1,
            calories: Math.round(dayPlan.totalCalories / 3), // Rough estimate per meal
            protein: Math.round(dayPlan.totalProtein / 3),
            carbs: Math.round(dayPlan.totalCarbs / 3),
            fat: Math.round(dayPlan.totalFat / 3),
            prepTime: 30,
            cookTime: 30,
            difficulty: 'medium' as const,
            category: 'AI Generated',
            imageUrl: null,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add the meal to the planner
          const success = await addMealPlanEntry(dayDate, meal.type, virtualRecipe, 1);
          if (success) {
            successCount++;
          }
        }
      }

      // Track achievement for successful meal planning
      if (successCount > 0) {
        await incrementStat('meals_planned');
      }

      // Show success/failure message
      if (successCount === totalMeals) {
        Alert.alert(
          '🎉 Weekly Plan Applied!',
          `Successfully added ${successCount} AI-generated meals to your weekly plan.`,
          [{ text: 'Great!' }]
        );
      } else if (successCount > 0) {
        Alert.alert(
          '⚠️ Partial Success',
          `Added ${successCount} of ${totalMeals} meals. Some meals may have failed to add.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Plan Application Failed',
          'Failed to add meals to your plan. Please try again.',
          [{ text: 'Retry' }]
        );
      }
    } catch (error) {
      console.error('Error applying AI weekly plan:', error);
      Alert.alert(
        'Error',
        'Failed to apply the weekly plan. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const selectedDayPlan = weekMealPlan.days.find(day =>
    day.date.toDateString() === selectedDate.toDateString()
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Please sign in to view your meal planner</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={navigateToPrevWeek} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.monthYear}>
              {weekMealPlan.weekStartDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={navigateToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAIWeeklyPlanner(true)} style={styles.aiButton}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.aiButtonText}>AI Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity onPress={navigateToNextWeek} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Week Days Header */}
        <View style={styles.weekHeader}>
          {weekDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayHeader,
                isToday(date) && styles.todayHeader,
                selectedDate.toDateString() === date.toDateString() && styles.selectedHeader,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dayName,
                isToday(date) && styles.todayText,
                selectedDate.toDateString() === date.toDateString() && styles.selectedText,
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.dayNumber,
                isToday(date) && styles.todayText,
                selectedDate.toDateString() === date.toDateString() && styles.selectedText,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Date Info */}
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            {getRelativeDateDescription(selectedDate)}
          </Text>
          <Text style={styles.selectedDateSubtext}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading meal plan...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Meal Slots */}
        {!loading && !error && (
          <View style={styles.mealSlotsContainer}>
            {[
              { type: 'breakfast' as MealType, name: 'Breakfast', time: '8:00 AM', color: '#FFE4B5' },
              { type: 'snack1' as MealType, name: 'Morning Snack', time: '10:30 AM', color: '#E6F3FF' },
              { type: 'lunch' as MealType, name: 'Lunch', time: '12:30 PM', color: '#F0FFF0' },
              { type: 'snack2' as MealType, name: 'Afternoon Snack', time: '3:30 PM', color: '#FFF0F5' },
              { type: 'dinner' as MealType, name: 'Dinner', time: '7:00 PM', color: '#F5F5DC' },
            ].map((meal) => {
              const mealEntries = selectedDayPlan?.meals[meal.type] || [];
              const mealIcon = {
                breakfast: 'cafe-outline',
                snack1: 'nutrition-outline',
                lunch: 'fast-food-outline',
                snack2: 'ice-cream-outline',
                dinner: 'restaurant-outline',
              }[meal.type];
              return (
                <View key={meal.type}>
                  {/* AI Suggestion Card for Empty Slot */}
                  {mealEntries.length === 0 && (
                    <AIMealSuggestions
                      selectedDate={selectedDate}
                      mealType={meal.type}
                      onSelectRecipe={handleSelectRecipe}
                    />
                  )}
                  <View style={[styles.mealSlot, { backgroundColor: meal.color }]}> 
                    <View style={styles.mealHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={mealIcon as any} size={22} color="#007AFF" style={{ marginRight: 8 }} />
                        <View>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <Text style={styles.mealTime}>{meal.time}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => handleAddRecipe(meal.type)}
                      >
                        <Ionicons name="add" size={24} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                    {/* Recipe Entries or Empty State */}
                    {mealEntries.length > 0 ? (
                      <View style={styles.recipeEntries}>
                        {mealEntries.map((entry) => (
                          <View key={entry.id} style={styles.recipeEntry}>
                            {/* Recipe Image */}
                            {entry.recipe?.imageUrl ? (
                              <Image source={{ uri: entry.recipe.imageUrl }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
                            ) : (
                              <View style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="image-outline" size={24} color="#ccc" />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.recipeName}>{entry.recipe?.name || 'Unknown Recipe'}</Text>
                              <Text style={styles.recipeDetails}>
                                {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                                {entry.recipe?.calories && ` • ${Math.round((entry.recipe.calories * (entry.servings || 1)))} cal`}
                              </Text>
                              {/* Nutrition Info */}
                              {entry.recipe && (
                                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                                  {entry.recipe.protein ? `P: ${entry.recipe.protein}g ` : ''}
                                  {entry.recipe.carbs ? `C: ${entry.recipe.carbs}g ` : ''}
                                  {entry.recipe.fat ? `F: ${entry.recipe.fat}g` : ''}
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => handleRemoveEntry(entry.id)}
                            >
                              <Ionicons name="close" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                            {/* Replace Button */}
                            <TouchableOpacity
                              style={{ marginLeft: 8, padding: 4 }}
                              onPress={() => handleAddRecipe(meal.type)}
                            >
                              <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) :
                      <View style={styles.emptyMealSlot}>
                        <Text style={styles.emptyMealText}>No recipes planned</Text>
                      </View>
                    }
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Daily Summary */}
        {!loading && !error && selectedDayPlan && (
          <View style={styles.dailySummary}>
            <Text style={styles.summaryTitle}>Daily Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(selectedDayPlan.nutrition.calories)}
                </Text>
                <Text style={styles.summaryLabel}>Calories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(selectedDayPlan.nutrition.protein)}g
                </Text>
                <Text style={styles.summaryLabel}>Protein</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(selectedDayPlan.nutrition.carbs)}g
                </Text>
                <Text style={styles.summaryLabel}>Carbs</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(selectedDayPlan.nutrition.fat)}g
                </Text>
                <Text style={styles.summaryLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Nutrition Balancer */}
        {!loading && !error && (
          <NutritionBalancer
            weeklyNutrition={{
              totalCalories: weekMealPlan.days.reduce((sum, day) => sum + day.nutrition.calories, 0),
              totalProtein: weekMealPlan.days.reduce((sum, day) => sum + day.nutrition.protein, 0),
              totalCarbs: weekMealPlan.days.reduce((sum, day) => sum + day.nutrition.carbs, 0),
              totalFat: weekMealPlan.days.reduce((sum, day) => sum + day.nutrition.fat, 0),
              daysPlanned: weekMealPlan.days.filter(day =>
                Object.values(day.meals).some(meals => meals.length > 0)
              ).length,
            }}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="list-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Generate Shopping List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="copy-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Copy Week</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Recipe Picker Modal */}
      <RecipePicker
        visible={showRecipePicker}
        onClose={() => setShowRecipePicker(false)}
        onSelectRecipe={(recipe, servings) => handleSelectRecipe(recipe, selectedMealType, servings)}
        mealType={selectedMealType}
        selectedDate={selectedDate}
      />

      {/* AI Weekly Planner Modal */}
      <AIWeeklyPlanner
        visible={showAIWeeklyPlanner}
        onClose={() => setShowAIWeeklyPlanner(false)}
        onPlanGenerated={handleAIWeeklyPlan}
        weekStartDate={weekMealPlan.weekStartDate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 12,
    gap: 4,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 44,
  },
  todayHeader: {
    backgroundColor: '#007AFF',
  },
  selectedHeader: {
    backgroundColor: '#E3F2FD',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  todayText: {
    color: '#fff',
  },
  selectedText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  selectedDateInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mealSlotsContainer: {
    padding: 16,
  },
  mealSlot: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyMealSlot: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMealText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 12,
  },
  addRecipeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addRecipeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dailySummary: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  recipeEntries: {
    marginTop: 8,
  },
  recipeEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    marginBottom: 8,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recipeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default MealPlannerScreen;