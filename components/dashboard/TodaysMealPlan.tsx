import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';

interface MealSlot {
  id?: string;
  name?: string;
  calories?: number;
  imageUrl?: string;
  isEmpty: boolean;
}

interface TodaysMealPlanProps {
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
  onAddMeal: (mealType: 'breakfast' | 'lunch' | 'dinner') => void;
}

const MealCard: React.FC<{
  meal: MealSlot;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onAddMeal: () => void;
  icon: string;
  color: string;
}> = ({ meal, mealType, onAddMeal, icon, color }) => {
  const router = useRouter();

  const handlePress = () => {
    if (meal.isEmpty) {
      onAddMeal();
    } else if (meal.id) {
      router.push(`/recipes/${meal.id}`);
    }
  };

  return (
    <TouchableOpacity style={styles.mealCard} onPress={handlePress} activeOpacity={0.8}>
      <View style={[styles.mealIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      
      <View style={styles.mealContent}>
        <Text style={styles.mealTypeText}>
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </Text>
        
        {meal.isEmpty ? (
          <View style={styles.emptyMealContent}>
            <Text style={styles.emptyMealText}>Not planned</Text>
            <View style={styles.addMealButton}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addMealText}>Add meal</Text>
            </View>
          </View>
        ) : (
          <View style={styles.plannedMealContent}>
            <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
            {meal.calories && (
              <Text style={styles.mealCalories}>{meal.calories} cal</Text>
            )}
          </View>
        )}
      </View>
      
      {!meal.isEmpty && meal.imageUrl ? (
        <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
      ) : (
        <View style={[styles.mealImagePlaceholder, { backgroundColor: `${color}10` }]}>
          <Ionicons name="restaurant-outline" size={20} color={color} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TodaysMealPlan({ breakfast, lunch, dinner, onAddMeal }: TodaysMealPlanProps) {
  const router = useRouter();

  const handleViewMealPlanner = () => {
    router.push('/(tabs)/meal-planner');
  };

  const todaysDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Meals</Text>
          <Text style={styles.subtitle}>{todaysDate}</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewMealPlanner}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.mealsContainer}>
        <MealCard
          meal={breakfast}
          mealType="breakfast"
          onAddMeal={() => onAddMeal('breakfast')}
          icon="cafe-outline"
          color="#F59E0B"
        />
        
        <MealCard
          meal={lunch}
          mealType="lunch"
          onAddMeal={() => onAddMeal('lunch')}
          icon="fast-food-outline"
          color="#10B981"
        />
        
        <MealCard
          meal={dinner}
          mealType="dinner"
          onAddMeal={() => onAddMeal('dinner')}
          icon="restaurant-outline"
          color="#8B5CF6"
        />
      </View>
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  mealsContainer: {
    gap: Spacing.md,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  mealContent: {
    flex: 1,
  },
  mealTypeText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyMealContent: {
    gap: Spacing.xs,
  },
  emptyMealText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textTertiary,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addMealText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
  },
  plannedMealContent: {
    gap: Spacing.xs,
  },
  mealName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.tight,
  },
  mealCalories: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  mealImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  mealImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});