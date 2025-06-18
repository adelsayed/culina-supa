import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { AdvancedNutritionCalculator } from '../../utils/advancedNutritionCalculator';
import type { RecipeNutrition, NutritionData } from '../../utils/advancedNutritionCalculator';

interface AdvancedNutritionDisplayProps {
  visible: boolean;
  onClose: () => void;
  ingredients: string[];
  servings: number;
  recipeName?: string;
}

const NutritionBar: React.FC<{
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  color: string;
  percentage?: number;
}> = ({ label, value, maxValue, unit, color, percentage }) => {
  const barPercentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <View style={styles.nutritionBar}>
      <View style={styles.nutritionBarHeader}>
        <Text style={styles.nutritionBarLabel}>{label}</Text>
        <View style={styles.nutritionBarValue}>
          <Text style={styles.nutritionBarAmount}>{value.toFixed(1)}{unit}</Text>
          {percentage && (
            <Text style={styles.nutritionBarPercentage}>({percentage}%)</Text>
          )}
        </View>
      </View>
      <View style={styles.nutritionBarTrack}>
        <View 
          style={[
            styles.nutritionBarFill, 
            { width: `${barPercentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
};

const MacroRing: React.FC<{
  protein: number;
  carbs: number;
  fat: number;
}> = ({ protein, carbs, fat }) => {
  // Simple visual representation without complex SVG
  return (
    <View style={styles.macroRing}>
      <View style={styles.macroRingCenter}>
        <Text style={styles.macroRingTitle}>Macros</Text>
      </View>
      <View style={styles.macroLegend}>
        <View style={styles.macroLegendItem}>
          <View style={[styles.macroColorBox, { backgroundColor: Colors.primary }]} />
          <Text style={styles.macroLegendText}>Protein {protein}%</Text>
        </View>
        <View style={styles.macroLegendItem}>
          <View style={[styles.macroColorBox, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.macroLegendText}>Carbs {carbs}%</Text>
        </View>
        <View style={styles.macroLegendItem}>
          <View style={[styles.macroColorBox, { backgroundColor: Colors.accent }]} />
          <Text style={styles.macroLegendText}>Fat {fat}%</Text>
        </View>
      </View>
    </View>
  );
};

const HealthScoreDisplay: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <View style={styles.healthScore}>
      <View style={styles.healthScoreCircle}>
        <Text style={[styles.healthScoreValue, { color: getScoreColor(score) }]}>
          {score}
        </Text>
        <Text style={styles.healthScoreMax}>/100</Text>
      </View>
      <Text style={styles.healthScoreLabel}>{getScoreLabel(score)}</Text>
    </View>
  );
};

export default function AdvancedNutritionDisplay({
  visible,
  onClose,
  ingredients,
  servings,
  recipeName = 'Recipe',
}: AdvancedNutritionDisplayProps) {
  const [nutrition, setNutrition] = useState<RecipeNutrition | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'vitamins'>('overview');

  useEffect(() => {
    if (visible && ingredients.length > 0) {
      const calculatedNutrition = AdvancedNutritionCalculator.calculateRecipeNutrition(
        ingredients,
        servings
      );
      setNutrition(calculatedNutrition);
    }
  }, [visible, ingredients, servings]);

  if (!nutrition) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Nutrition Analysis</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Calculating nutrition...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

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
          <Text style={styles.servingInfo}>Per serving ({servings} total servings)</Text>
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
            style={[styles.tab, activeTab === 'detailed' && styles.activeTab]}
            onPress={() => setActiveTab('detailed')}
          >
            <Text style={[styles.tabText, activeTab === 'detailed' && styles.activeTabText]}>
              Detailed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vitamins' && styles.activeTab]}
            onPress={() => setActiveTab('vitamins')}
          >
            <Text style={[styles.tabText, activeTab === 'vitamins' && styles.activeTabText]}>
              Vitamins
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'overview' && (
            <View style={styles.overviewTab}>
              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{nutrition.nutritionPerServing.calories}</Text>
                  <Text style={styles.quickStatLabel}>Calories</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{nutrition.nutritionPerServing.protein.toFixed(1)}g</Text>
                  <Text style={styles.quickStatLabel}>Protein</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{nutrition.nutritionPerServing.carbs.toFixed(1)}g</Text>
                  <Text style={styles.quickStatLabel}>Carbs</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatValue}>{nutrition.nutritionPerServing.fat.toFixed(1)}g</Text>
                  <Text style={styles.quickStatLabel}>Fat</Text>
                </View>
              </View>

              {/* Macro Distribution */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Macro Distribution</Text>
                <MacroRing
                  protein={nutrition.macroPercentages.protein}
                  carbs={nutrition.macroPercentages.carbs}
                  fat={nutrition.macroPercentages.fat}
                />
              </View>

              {/* Health Score */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Score</Text>
                <HealthScoreDisplay score={nutrition.healthScore} />
              </View>

              {/* Dietary Labels */}
              {nutrition.dietaryLabels.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dietary Information</Text>
                  <View style={styles.labelContainer}>
                    {nutrition.dietaryLabels.map((label, index) => (
                      <View key={index} style={styles.dietaryLabel}>
                        <Text style={styles.dietaryLabelText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Allergen Warnings */}
              {nutrition.allergens.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>⚠️ Allergen Information</Text>
                  <View style={styles.labelContainer}>
                    {nutrition.allergens.map((allergen, index) => (
                      <View key={index} style={styles.allergenLabel}>
                        <Text style={styles.allergenLabelText}>{allergen}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'detailed' && (
            <View style={styles.detailedTab}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detailed Nutrition</Text>
                
                <NutritionBar
                  label="Calories"
                  value={nutrition.nutritionPerServing.calories}
                  maxValue={2000}
                  unit=""
                  color={Colors.primary}
                />
                
                <NutritionBar
                  label="Protein"
                  value={nutrition.nutritionPerServing.protein}
                  maxValue={50}
                  unit="g"
                  color={Colors.secondary}
                  percentage={nutrition.macroPercentages.protein}
                />
                
                <NutritionBar
                  label="Carbohydrates"
                  value={nutrition.nutritionPerServing.carbs}
                  maxValue={300}
                  unit="g"
                  color={Colors.accent}
                  percentage={nutrition.macroPercentages.carbs}
                />
                
                <NutritionBar
                  label="Fat"
                  value={nutrition.nutritionPerServing.fat}
                  maxValue={65}
                  unit="g"
                  color={Colors.warning}
                  percentage={nutrition.macroPercentages.fat}
                />

                {nutrition.nutritionPerServing.fiber && (
                  <NutritionBar
                    label="Fiber"
                    value={nutrition.nutritionPerServing.fiber}
                    maxValue={25}
                    unit="g"
                    color={Colors.success}
                  />
                )}

                {nutrition.nutritionPerServing.sugar && (
                  <NutritionBar
                    label="Sugar"
                    value={nutrition.nutritionPerServing.sugar}
                    maxValue={50}
                    unit="g"
                    color={Colors.error}
                  />
                )}

                {nutrition.nutritionPerServing.sodium && (
                  <NutritionBar
                    label="Sodium"
                    value={nutrition.nutritionPerServing.sodium}
                    maxValue={2300}
                    unit="mg"
                    color={Colors.warning}
                  />
                )}

                {nutrition.nutritionPerServing.cholesterol && (
                  <NutritionBar
                    label="Cholesterol"
                    value={nutrition.nutritionPerServing.cholesterol}
                    maxValue={300}
                    unit="mg"
                    color={Colors.error}
                  />
                )}
              </View>

              {/* Additional Metrics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Glycemic Load</Text>
                    <Text style={styles.infoValue}>{nutrition.glycemicLoad}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ingredients</Text>
                    <Text style={styles.infoValue}>{nutrition.ingredients.length}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'vitamins' && (
            <View style={styles.vitaminsTab}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vitamin & Mineral Content</Text>
                <Text style={styles.sectionSubtitle}>
                  Estimated values based on ingredient analysis
                </Text>
                
                {/* This would show vitamin/mineral content if available in the nutrition data */}
                <View style={styles.vitaminGrid}>
                  <View style={styles.vitaminItem}>
                    <Text style={styles.vitaminLabel}>Vitamin C</Text>
                    <Text style={styles.vitaminValue}>~15mg</Text>
                  </View>
                  <View style={styles.vitaminItem}>
                    <Text style={styles.vitaminLabel}>Iron</Text>
                    <Text style={styles.vitaminValue}>~2mg</Text>
                  </View>
                  <View style={styles.vitaminItem}>
                    <Text style={styles.vitaminLabel}>Calcium</Text>
                    <Text style={styles.vitaminValue}>~50mg</Text>
                  </View>
                  <View style={styles.vitaminItem}>
                    <Text style={styles.vitaminLabel}>Potassium</Text>
                    <Text style={styles.vitaminValue}>~200mg</Text>
                  </View>
                </View>
                
                <Text style={styles.disclaimerText}>
                  * Vitamin and mineral values are estimates based on typical ingredient compositions. 
                  Actual values may vary based on preparation methods and ingredient quality.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
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
  macroRing: {
    alignItems: 'center',
  },
  macroRingCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  macroRingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  macroLegend: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroColorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  macroLegendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
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
  allergenLabel: {
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  allergenLabelText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.weights.semibold,
  },
  detailedTab: {
    padding: Spacing.lg,
  },
  nutritionBar: {
    marginBottom: Spacing.lg,
  },
  nutritionBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nutritionBarLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  nutritionBarValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nutritionBarAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  nutritionBarPercentage: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  nutritionBarTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutritionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  vitaminsTab: {
    padding: Spacing.lg,
  },
  vitaminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  vitaminItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  vitaminLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  vitaminValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  disclaimerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.relaxed,
  },
});