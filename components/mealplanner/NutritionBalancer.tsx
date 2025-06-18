import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/DesignSystem';
import { useUserProfile } from '../../hooks/useUserProfile';

interface WeeklyNutrition {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  daysPlanned: number;
}

interface NutritionBalancerProps {
  weeklyNutrition: WeeklyNutrition;
}

export default function NutritionBalancer({ weeklyNutrition }: NutritionBalancerProps) {
  const { profile, getMacroTargets, getHealthMetrics } = useUserProfile();
  
  const macroTargets = getMacroTargets();
  const healthMetrics = getHealthMetrics();
  
  // Calculate weekly targets
  const weeklyTargets = {
    calories: (profile?.dailyCalorieTarget || healthMetrics?.bmr || 2000) * 7,
    protein: (macroTargets?.protein || 150) * 7,
    carbs: (macroTargets?.carbs || 250) * 7,
    fat: (macroTargets?.fat || 65) * 7,
  };

  // Calculate averages
  const dailyAverages = weeklyNutrition.daysPlanned > 0 ? {
    calories: Math.round(weeklyNutrition.totalCalories / weeklyNutrition.daysPlanned),
    protein: Math.round(weeklyNutrition.totalProtein / weeklyNutrition.daysPlanned),
    carbs: Math.round(weeklyNutrition.totalCarbs / weeklyNutrition.daysPlanned),
    fat: Math.round(weeklyNutrition.totalFat / weeklyNutrition.daysPlanned),
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const dailyTargets = {
    calories: Math.round(weeklyTargets.calories / 7),
    protein: Math.round(weeklyTargets.protein / 7),
    carbs: Math.round(weeklyTargets.carbs / 7),
    fat: Math.round(weeklyTargets.fat / 7),
  };

  // Calculate progress percentages
  const progress = {
    calories: Math.min((dailyAverages.calories / dailyTargets.calories) * 100, 100),
    protein: Math.min((dailyAverages.protein / dailyTargets.protein) * 100, 100),
    carbs: Math.min((dailyAverages.carbs / dailyTargets.carbs) * 100, 100),
    fat: Math.min((dailyAverages.fat / dailyTargets.fat) * 100, 100),
  };

  // Get status color based on progress
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return Colors.success;
    if (percentage >= 70) return Colors.warning;
    return Colors.error;
  };

  // Get recommendation based on progress
  const getRecommendation = () => {
    const lowNutrients = [];
    if (progress.protein < 80) lowNutrients.push('protein');
    if (progress.calories < 80) lowNutrients.push('calories');
    if (progress.carbs < 70) lowNutrients.push('complex carbs');
    if (progress.fat < 70) lowNutrients.push('healthy fats');

    if (lowNutrients.length === 0) {
      return "🎯 Great nutrition balance! Your weekly plan is well-balanced.";
    }

    if (lowNutrients.length === 1) {
      return `💡 Consider adding more ${lowNutrients[0]} to reach your goals.`;
    }

    return `📊 Focus on increasing ${lowNutrients.slice(0, 2).join(' and ')} in your remaining meals.`;
  };

  if (weeklyNutrition.daysPlanned === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📊 Weekly Nutrition Balance</Text>
        <Text style={styles.emptyText}>Start planning meals to see your nutrition balance</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Weekly Nutrition Balance</Text>
      <Text style={styles.subtitle}>
        {weeklyNutrition.daysPlanned} of 7 days planned • Daily averages vs targets
      </Text>

      <View style={styles.nutritionGrid}>
        {[
          { key: 'calories', label: 'Calories', unit: '', color: Colors.primary },
          { key: 'protein', label: 'Protein', unit: 'g', color: Colors.secondary },
          { key: 'carbs', label: 'Carbs', unit: 'g', color: Colors.warning },
          { key: 'fat', label: 'Fat', unit: 'g', color: Colors.accent },
        ].map((nutrient) => (
          <View key={nutrient.key} style={styles.nutritionItem}>
            <View style={styles.nutritionHeader}>
              <Text style={styles.nutritionLabel}>{nutrient.label}</Text>
              <Text style={[styles.progressText, { color: getStatusColor(progress[nutrient.key as keyof typeof progress]) }]}>
                {Math.round(progress[nutrient.key as keyof typeof progress])}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(progress[nutrient.key as keyof typeof progress], 100)}%`,
                    backgroundColor: getStatusColor(progress[nutrient.key as keyof typeof progress])
                  }
                ]} 
              />
            </View>
            
            <View style={styles.nutritionValues}>
              <Text style={styles.currentValue}>
                {dailyAverages[nutrient.key as keyof typeof dailyAverages]}{nutrient.unit}
              </Text>
              <Text style={styles.targetValue}>
                / {dailyTargets[nutrient.key as keyof typeof dailyTargets]}{nutrient.unit}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationText}>{getRecommendation()}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{weeklyNutrition.daysPlanned}</Text>
          <Text style={styles.statLabel}>Days Planned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round((dailyAverages.calories / dailyTargets.calories) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Calorie Target</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(((progress.protein + progress.carbs + progress.fat) / 3))}%
          </Text>
          <Text style={styles.statLabel}>Macro Balance</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    margin: Spacing.lg,
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
    marginBottom: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: Spacing.xl,
  },
  nutritionGrid: {
    marginBottom: Spacing.xl,
  },
  nutritionItem: {
    marginBottom: Spacing.lg,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  nutritionValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  targetValue: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  recommendationContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  recommendationText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.relaxed,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});