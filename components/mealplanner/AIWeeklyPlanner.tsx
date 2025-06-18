import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '../../lib/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { useAchievements } from '../../hooks/useAchievements';

interface WeeklyMealPlan {
  day: string;
  date: Date;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface AIWeeklyPlannerProps {
  visible: boolean;
  onClose: () => void;
  onPlanGenerated: (weekPlan: WeeklyMealPlan[], clearExisting?: boolean) => void;
  weekStartDate: Date;
}

export default function AIWeeklyPlanner({ visible, onClose, onPlanGenerated, weekStartDate }: AIWeeklyPlannerProps) {
  const { profile } = useUserProfile();
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<WeeklyMealPlan[] | null>(null);
  const [clearExisting, setClearExisting] = useState(true);

  const generateWeeklyPlan = async () => {
    if (!profile?.geminiApiKey) {
      setError('Google Gemini API key required for AI meal planning');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = generateWeeklyMealPlanPrompt(profile, weekStartDate);
      
      const modelName = profile.aiModel === 'gemini_1_5_pro' ? 'gemini-1.5-pro' : 
                       profile.aiModel === 'gemini_1_5_flash' ? 'gemini-1.5-flash' : 
                       'gemini-2.0-flash';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${profile.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse the weekly meal plan
      const cleanedContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let weekPlan: WeeklyMealPlan[];
      try {
        weekPlan = JSON.parse(cleanedContent);
      } catch (parseError) {
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Invalid response format');
        }
        weekPlan = JSON.parse(jsonMatch[0]);
      }

      // Add actual dates to the plan
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const planWithDates = weekPlan.map((dayPlan, index) => {
        const date = new Date(weekStartDate);
        date.setDate(weekStartDate.getDate() + index);
        return {
          ...dayPlan,
          day: daysOfWeek[date.getDay()],
          date: date
        };
      });

      setGeneratedPlan(planWithDates);
      
      // Track achievement
      await incrementStat('ai_suggestions_used');
      await incrementStat('meals_planned');

    } catch (err: any) {
      console.error('AI weekly meal plan generation error:', err);
      setError(err.message || 'Failed to generate weekly meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = () => {
    if (generatedPlan) {
      onPlanGenerated(generatedPlan, clearExisting);
      onClose();
    }
  };

  const calculateWeeklyTotals = () => {
    if (!generatedPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return generatedPlan.reduce((totals, day) => ({
      calories: totals.calories + day.totalCalories,
      protein: totals.protein + day.totalProtein,
      carbs: totals.carbs + day.totalCarbs,
      fat: totals.fat + day.totalFat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const weeklyTotals = calculateWeeklyTotals();
  const dailyAverages = {
    calories: Math.round(weeklyTotals.calories / 7),
    protein: Math.round(weeklyTotals.protein / 7),
    carbs: Math.round(weeklyTotals.carbs / 7),
    fat: Math.round(weeklyTotals.fat / 7)
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>🤖 AI Weekly Meal Planner</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Smart Weekly Planning</Text>
            <Text style={styles.introText}>
              Generate a personalized weekly meal plan based on your profile, preferences, and nutrition goals.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!generatedPlan && (
            <View style={styles.generateSection}>
              <TouchableOpacity
                style={[styles.generateButton, loading && styles.disabledButton]}
                onPress={generateWeeklyPlan}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Ionicons name="sparkles" size={20} color={Colors.surface} />
                )}
                <Text style={styles.generateButtonText}>
                  {loading ? 'Generating Your Week...' : 'Generate Weekly Plan'}
                </Text>
              </TouchableOpacity>

              <View style={styles.features}>
                <Text style={styles.featuresTitle}>What you'll get:</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>7 days of personalized meals</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Nutrition-balanced daily plans</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Variety and seasonal ingredients</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Matches your dietary preferences</Text>
                </View>
              </View>
            </View>
          )}

          {generatedPlan && (
            <View style={styles.planPreview}>
              <Text style={styles.planTitle}>Your Generated Weekly Plan</Text>
              
              {/* Weekly Nutrition Summary */}
              <View style={styles.nutritionSummary}>
                <Text style={styles.summaryTitle}>Daily Averages</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{dailyAverages.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{dailyAverages.protein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{dailyAverages.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{dailyAverages.fat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Daily Meal Plan */}
              {generatedPlan.map((dayPlan, index) => (
                <View key={index} style={styles.dayPlan}>
                  <Text style={styles.dayTitle}>
                    {dayPlan.day} - {dayPlan.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  
                  <View style={styles.mealsContainer}>
                    <View style={styles.mealItem}>
                      <Ionicons name="cafe" size={16} color={Colors.warning} />
                      <Text style={styles.mealLabel}>Breakfast:</Text>
                      <Text style={styles.mealName}>{dayPlan.meals.breakfast}</Text>
                    </View>
                    <View style={styles.mealItem}>
                      <Ionicons name="fast-food" size={16} color={Colors.secondary} />
                      <Text style={styles.mealLabel}>Lunch:</Text>
                      <Text style={styles.mealName}>{dayPlan.meals.lunch}</Text>
                    </View>
                    <View style={styles.mealItem}>
                      <Ionicons name="restaurant" size={16} color={Colors.accent} />
                      <Text style={styles.mealLabel}>Dinner:</Text>
                      <Text style={styles.mealName}>{dayPlan.meals.dinner}</Text>
                    </View>
                  </View>

                  <View style={styles.dayNutrition}>
                    <Text style={styles.dayNutritionText}>
                      {dayPlan.totalCalories} cal • {dayPlan.totalProtein}g protein • {dayPlan.totalCarbs}g carbs • {dayPlan.totalFat}g fat
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.applySection}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setClearExisting(!clearExisting)}
                >
                  <View style={[styles.checkbox, clearExisting && styles.checkboxChecked]}>
                    {clearExisting && <Ionicons name="checkmark" size={14} color={Colors.surface} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Clear existing meals before applying plan</Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.regenerateButton} onPress={generateWeeklyPlan}>
                    <Ionicons name="refresh" size={16} color={Colors.primary} />
                    <Text style={styles.regenerateButtonText}>Generate New Plan</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.applyButton} onPress={handleApplyPlan}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.surface} />
                    <Text style={styles.applyButtonText}>Apply This Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function generateWeeklyMealPlanPrompt(profile: any, weekStartDate: Date): string {
  const userInfo = {
    restrictions: profile.dietaryRestrictions?.join(', ') || 'None',
    allergies: profile.allergies?.join(', ') || 'None',
    cuisines: profile.preferredCuisines?.join(', ') || 'Various',
    calorieTarget: profile.dailyCalorieTarget || 2000,
    weightGoal: profile.weightGoal || 'maintenance',
    activityLevel: profile.activityLevel || 'moderate'
  };

  return `
Generate a complete 7-day weekly meal plan starting from ${weekStartDate.toDateString()}.

USER PROFILE:
- Dietary restrictions: ${userInfo.restrictions}
- Allergies: ${userInfo.allergies}
- Preferred cuisines: ${userInfo.cuisines}
- Daily calorie target: ${userInfo.calorieTarget}
- Weight goal: ${userInfo.weightGoal}
- Activity level: ${userInfo.activityLevel}

REQUIREMENTS:
- Create balanced meals for breakfast, lunch, and dinner each day
- Ensure variety across the week (no repeated meals)
- Include specific recipe names, not just categories
- Balance nutrition to meet daily calorie and macro goals
- Consider meal prep opportunities (similar ingredients across days)
- Include seasonal and fresh ingredients

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no code blocks.

JSON FORMAT (exactly 7 days):
[
  {
    "meals": {
      "breakfast": "Mediterranean Veggie Scramble with Feta",
      "lunch": "Quinoa Buddha Bowl with Tahini Dressing",
      "dinner": "Herb-Crusted Salmon with Roasted Vegetables"
    },
    "totalCalories": 1950,
    "totalProtein": 95,
    "totalCarbs": 220,
    "totalFat": 85
  }
]

Generate 7 complete days with specific recipe names and accurate nutrition totals.
`;
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
  content: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  intro: {
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  introText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
  generateSection: {
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  features: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  featuresTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  planPreview: {
    marginTop: Spacing.lg,
  },
  planTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  nutritionSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  dayPlan: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  dayTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  mealsContainer: {
    marginBottom: Spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  mealLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    minWidth: 80,
  },
  mealName: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  dayNutrition: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  dayNutritionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  regenerateButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  applyButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  applySection: {
    marginTop: Spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 4,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});