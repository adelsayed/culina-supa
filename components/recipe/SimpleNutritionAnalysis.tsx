import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';

interface SimpleNutritionAnalysisProps {
  visible: boolean;
  onClose: () => void;
  ingredients: string[];
  servings: number;
  recipeName?: string;
  currentNutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// Simple nutrition estimator for common ingredients
const getSimpleNutrition = (ingredient: string) => {
  if (!ingredient || typeof ingredient !== 'string') {
    return { calories: 100, protein: 2, carbs: 15, fat: 2 };
  }
  const name = ingredient.toLowerCase();
  
  // Basic nutrition per 100g
  if (name.includes('chicken')) return { calories: 165, protein: 31, carbs: 0, fat: 3.6 };
  if (name.includes('beef')) return { calories: 250, protein: 26, carbs: 0, fat: 15 };
  if (name.includes('salmon') || name.includes('fish')) return { calories: 208, protein: 22, carbs: 0, fat: 12 };
  if (name.includes('egg')) return { calories: 155, protein: 13, carbs: 1, fat: 11 };
  if (name.includes('rice')) return { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 };
  if (name.includes('pasta')) return { calories: 131, protein: 5, carbs: 25, fat: 1.1 };
  if (name.includes('potato')) return { calories: 77, protein: 2, carbs: 17, fat: 0.1 };
  if (name.includes('bread')) return { calories: 265, protein: 9, carbs: 49, fat: 3.2 };
  if (name.includes('cheese')) return { calories: 113, protein: 7, carbs: 1, fat: 9 };
  if (name.includes('milk')) return { calories: 42, protein: 3.4, carbs: 5, fat: 1 };
  if (name.includes('oil')) return { calories: 884, protein: 0, carbs: 0, fat: 100 };
  if (name.includes('butter')) return { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 };
  if (name.includes('sugar')) return { calories: 387, protein: 0, carbs: 100, fat: 0 };
  if (name.includes('flour')) return { calories: 364, protein: 10, carbs: 76, fat: 1 };
  
  // Vegetables (average)
  if (name.includes('broccoli') || name.includes('spinach') || name.includes('lettuce')) {
    return { calories: 25, protein: 3, carbs: 5, fat: 0.3 };
  }
  if (name.includes('tomato') || name.includes('pepper') || name.includes('onion')) {
    return { calories: 20, protein: 1, carbs: 4, fat: 0.2 };
  }
  if (name.includes('carrot') || name.includes('vegetable')) {
    return { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 };
  }
  
  // Fruits
  if (name.includes('apple') || name.includes('orange') || name.includes('fruit')) {
    return { calories: 50, protein: 0.3, carbs: 13, fat: 0.2 };
  }
  if (name.includes('banana')) return { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 };
  
  // Default for unknown ingredients
  return { calories: 100, protein: 2, carbs: 15, fat: 2 };
};

const ProgressBar: React.FC<{
  label: string;
  value: number;
  color: string;
  percentage: number;
}> = ({ label, value, color, percentage }) => (
  <View style={styles.progressBar}>
    <View style={styles.progressHeader}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressValue}>{value.toFixed(1)}g ({percentage}%)</Text>
    </View>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  </View>
);

export default function SimpleNutritionAnalysis({
  visible,
  onClose,
  ingredients,
  servings,
  recipeName = 'Recipe',
  currentNutrition,
}: SimpleNutritionAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients'>('overview');

  // Calculate estimated nutrition from ingredients
  const calculateNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ingredients.forEach((ingredient) => {
      if (!ingredient) return; // Skip null/undefined ingredients
      
      let name: string | undefined;
      if (typeof ingredient === 'string') {
        name = ingredient;
      } else if (ingredient && typeof ingredient === 'object' && 'name' in ingredient) {
        name = ingredient.name;
      }
      const nutrition = getSimpleNutrition(name || '');
      // Estimate 100g per ingredient (simple assumption)
      const factor = 1; // 100g per ingredient
      totalCalories += nutrition.calories * factor;
      totalProtein += nutrition.protein * factor;
      totalCarbs += nutrition.carbs * factor;
      totalFat += nutrition.fat * factor;
    });

    // Per serving
    const perServing = {
      calories: Math.round(totalCalories / servings),
      protein: Math.round((totalProtein / servings) * 10) / 10,
      carbs: Math.round((totalCarbs / servings) * 10) / 10,
      fat: Math.round((totalFat / servings) * 10) / 10,
    };

    // Calculate macro percentages
    const totalMacroCalories = (perServing.protein * 4) + (perServing.carbs * 4) + (perServing.fat * 9);
    const macroPercentages = {
      protein: Math.round((perServing.protein * 4 / totalMacroCalories) * 100),
      carbs: Math.round((perServing.carbs * 4 / totalMacroCalories) * 100),
      fat: Math.round((perServing.fat * 9 / totalMacroCalories) * 100),
    };

    return { perServing, macroPercentages };
  };

  const nutrition = calculateNutrition();

  // Use current nutrition if available, otherwise use estimated
  const displayNutrition = currentNutrition || nutrition.perServing;
  const macros = nutrition.macroPercentages;

  const getDietaryLabels = () => {
    const labels = [];
    
    // Check for vegetarian/vegan
    const hasAnimalProducts = ingredients.some(ing => {
      if (!ing || typeof ing !== 'string') return false;
      const ingLower = ing.toLowerCase();
      return ingLower.includes('chicken') ||
             ingLower.includes('beef') ||
             ingLower.includes('fish') ||
             ingLower.includes('meat');
    });
    
    const hasDairy = ingredients.some(ing => {
      if (!ing || typeof ing !== 'string') return false;
      const ingLower = ing.toLowerCase();
      return ingLower.includes('milk') ||
             ingLower.includes('cheese') ||
             ingLower.includes('egg');
    });

    if (!hasAnimalProducts) {
      if (!hasDairy) {
        labels.push('Vegan');
      } else {
        labels.push('Vegetarian');
      }
    }

    if ((displayNutrition.protein || 0) > 20) labels.push('High Protein');
    if ((displayNutrition.calories || 0) < 300) labels.push('Low Calorie');
    if (macros.carbs < 20) labels.push('Low Carb');

    return labels;
  };

  const getHealthScore = () => {
    let score = 50; // Base score
    
    // Positive factors
    if ((displayNutrition.protein || 0) > 15) score += 15;
    if ((displayNutrition.calories || 0) < 400) score += 10;
    
    // Count vegetables
    const vegCount = ingredients.filter(ing => {
      if (!ing || typeof ing !== 'string') return false;
      const ingLower = ing.toLowerCase();
      return ingLower.includes('vegetable') ||
             ingLower.includes('broccoli') ||
             ingLower.includes('spinach') ||
             ingLower.includes('tomato') ||
             ingLower.includes('carrot');
    }).length;
    score += Math.min(vegCount * 10, 20);

    // Negative factors
    if ((displayNutrition.calories || 0) > 600) score -= 15;
    if (macros.fat > 60) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const dietaryLabels = getDietaryLabels();
  const healthScore = getHealthScore();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Nutrition Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{recipeName}</Text>
          <Text style={styles.servingInfo}>Per serving ({String(servings)} total servings)</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              Breakdown
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'overview' ? (
            <View style={styles.overviewTab}>
              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{String(displayNutrition.calories)}</Text>
                  <Text style={styles.quickStatLabel}>Calories</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{String(displayNutrition.protein?.toFixed(1))}g</Text>
                  <Text style={styles.quickStatLabel}>Protein</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{String(displayNutrition.carbs?.toFixed(1))}g</Text>
                  <Text style={styles.quickStatLabel}>Carbs</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{String(displayNutrition.fat?.toFixed(1))}g</Text>
                  <Text style={styles.quickStatLabel}>Fat</Text>
                </View>
              </View>

              {/* Macro Distribution */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Macro Distribution</Text>
                <ProgressBar
                  label="Protein"
                  value={displayNutrition.protein || 0}
                  color={Colors.primary}
                  percentage={macros.protein}
                />
                <ProgressBar
                  label="Carbohydrates"
                  value={displayNutrition.carbs || 0}
                  color={Colors.secondary}
                  percentage={macros.carbs}
                />
                <ProgressBar
                  label="Fat"
                  value={displayNutrition.fat || 0}
                  color={Colors.accent}
                  percentage={macros.fat}
                />
              </View>

              {/* Health Score */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Score</Text>
                <View style={styles.healthScore}>
                  <View style={styles.healthScoreCircle}>
                    <Text style={[styles.healthScoreValue, { 
                      color: healthScore >= 70 ? Colors.success : healthScore >= 50 ? Colors.warning : Colors.error 
                    }]}>
                      {healthScore}
                    </Text>
                    <Text style={styles.healthScoreMax}>/100</Text>
                  </View>
                  <Text style={styles.healthScoreLabel}>
                    {healthScore >= 70 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Needs Improvement'}
                  </Text>
                </View>
              </View>

              {/* Dietary Labels */}
              {dietaryLabels.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dietary Information</Text>
                  <View style={styles.labelContainer}>
                    {dietaryLabels.map((label, index) => (
                      <View key={index} style={styles.dietaryLabel}>
                        <Text style={styles.dietaryLabelText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.ingredientsTab}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredient Breakdown</Text>
                <Text style={styles.sectionSubtitle}>
                  Estimated nutrition contribution from each ingredient
                </Text>
                
                {ingredients.filter(Boolean).map((ingredient, index) => {
                  if (!ingredient || typeof ingredient !== 'string') return null;
                  const nutrition = getSimpleNutrition(ingredient);
                  return (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>{ingredient}</Text>
                      <View style={styles.ingredientNutrition}>
                        <Text style={styles.ingredientStat}>{nutrition.calories} cal</Text>
                        <Text style={styles.ingredientStat}>{nutrition.protein}g protein</Text>
                        <Text style={styles.ingredientStat}>{nutrition.carbs}g carbs</Text>
                        <Text style={styles.ingredientStat}>{nutrition.fat}g fat</Text>
                      </View>
                    </View>
                  );
                })}
                
                <Text style={styles.disclaimerText}>
                  * Estimates based on typical ingredient values. Actual nutrition may vary based on preparation and portion sizes.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  recipeInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recipeName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  servingInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  overviewTab: {
    padding: Spacing.lg,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  quickStatLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  progressValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthScore: {
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthScoreValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  healthScoreMax: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  healthScoreLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryLabel: {
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dietaryLabelText: {
    fontSize: Typography.sizes.sm,
    color: Colors.success,
    fontWeight: Typography.weights.semibold,
  },
  ingredientsTab: {
    padding: Spacing.lg,
  },
  ingredientItem: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  ingredientName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  ingredientNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  ingredientStat: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  disclaimerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.relaxed,
    marginTop: Spacing.lg,
  },
});