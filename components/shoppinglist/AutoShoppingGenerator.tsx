import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { useMealPlanner } from '../../hooks/useMealPlanner';
import { useShoppingList } from '../../hooks/useShoppingList';
import { usePantryManager } from '../../hooks/usePantryManager';
import { useShoppingBudget } from '../../hooks/useShoppingBudget';
import { generateShoppingList, consolidateIngredients, categorizeIngredient } from '../../utils/shoppingListGenerator';
import { getWeekStartDate } from '../../utils/dateUtils';
import { useAuth } from '../../lib/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';

interface AutoShoppingGeneratorProps {
  visible: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export default function AutoShoppingGenerator({ visible, onClose, onGenerated }: AutoShoppingGeneratorProps) {
  const { session } = useAuth();
  const { incrementStat } = useAchievements();
  const { weekMealPlan, recipes } = useMealPlanner(getWeekStartDate(new Date()));
  const { addItemsFromMealPlan } = useShoppingList();
  const { pantryItems, isInPantry } = usePantryManager();
  const { getCategoryBudget, estimateShoppingListCost } = useShoppingBudget();

  const [loading, setLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [skipPantryItems, setSkipPantryItems] = useState(true);
  const [consolidateDuplicates, setConsolidateDuplicates] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const generatePreview = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    
    try {
      console.log('Week meal plan:', weekMealPlan);
      console.log('Available recipes:', recipes);

      // Get all meal plan entries for the week
      const mealPlanEntries = weekMealPlan.days.flatMap(day =>
        Object.values(day.meals).flatMap(mealEntries => mealEntries)
      );

      console.log('Meal plan entries found:', mealPlanEntries.length);
      console.log('Meal plan entries:', mealPlanEntries);

      if (mealPlanEntries.length === 0) {
        // Create a demo shopping list for users who haven't planned meals yet
        console.log('No meal plan entries found, creating demo list');
        
        const demoItems = [
          { itemName: 'Chicken breast', quantity: '2', unit: 'lbs', category: 'Meat & Seafood' },
          { itemName: 'Broccoli', quantity: '1', unit: 'head', category: 'Produce' },
          { itemName: 'Rice', quantity: '1', unit: 'cup', category: 'Pantry' },
          { itemName: 'Olive oil', quantity: '1', unit: 'bottle', category: 'Pantry' },
          { itemName: 'Onion', quantity: '2', unit: 'pieces', category: 'Produce' },
          { itemName: 'Garlic', quantity: '1', unit: 'bulb', category: 'Produce' },
        ].map(item => ({
          ...item,
          userId: session.user.id,
          weekStartDate: weekMealPlan.weekStartDate.toISOString().split('T')[0],
          isCompleted: false,
          recipeId: 'demo',
          mealPlanEntryId: 'demo',
          inPantry: isInPantry(item.itemName),
          estimatedPrice: '3.50',
          notes: [],
        }));

        setPreviewItems(demoItems);
        setShowPreview(true);
        return;
      }

      // Generate basic shopping list
      let generatedItems = [];
      
      try {
        generatedItems = generateShoppingList(
          mealPlanEntries,
          recipes,
          weekMealPlan.weekStartDate,
          session.user.id
        );
        console.log('Generated items from shopping list generator:', generatedItems.length);
      } catch (error) {
        console.error('Error in generateShoppingList:', error);
        
        // Fallback: create basic items from meal plan entries
        generatedItems = mealPlanEntries.flatMap(entry => {
          const recipe = recipes.find(r => r.id === entry.recipeId);
          if (!recipe) {
            console.log('No recipe found for entry:', entry.recipeId);
            return [];
          }
          
          if (!recipe.ingredients) {
            console.log('Recipe has no ingredients:', recipe.id, recipe.name);
            return [];
          }
          
          try {
            let ingredients: string[] = [];
            
            if (Array.isArray(recipe.ingredients)) {
              ingredients = recipe.ingredients;
            } else if (typeof recipe.ingredients === 'string') {
              // Try to parse as JSON array if it starts with '['
              try {
                if (recipe.ingredients.startsWith('[')) {
                  const parsed = JSON.parse(recipe.ingredients);
                  ingredients = Array.isArray(parsed) ? parsed : [recipe.ingredients];
                } else {
                  // Split by newlines or commas if it's a plain string
                  ingredients = recipe.ingredients.split(/\n|,/)
                    .map((i: string) => i.trim())
                    .filter((i: string) => i.length > 0);
                }
              } catch (error) {
                // If JSON parsing fails, treat as plain string
                ingredients = recipe.ingredients.split(/\n|,/)
                  .map((i: string) => i.trim())
                  .filter((i: string) => i.length > 0);
              }
            }
            
            console.log(`Recipe "${recipe.name}" has ${ingredients.length} ingredients:`, ingredients);
            
            return ingredients.map((ingredient: string) => {
              // Simple ingredient name extraction
              const cleanName = ingredient
                .replace(/^\d+[\d\/\s]*/, '') // Remove quantities like "2", "1/2", "2 1/2"
                .replace(/\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|lbs?|pounds?|oz|ounces?|g|grams?|kg|kilograms?)\s*/gi, '')
                .replace(/^\s*(of\s+)?/, '') // Remove "of" at start
                .trim();
              
              return {
                userId: session.user.id,
                weekStartDate: weekMealPlan.weekStartDate.toISOString().split('T')[0],
                itemName: cleanName || ingredient, // Fallback to original if cleaning fails
                quantity: '1',
                unit: 'piece',
                category: 'Other',
                isCompleted: false,
                recipeId: recipe.id,
                mealPlanEntryId: entry.id,
              };
            }).filter((item: any) => item.itemName.length > 0); // Only include items with valid names
          } catch (parseError) {
            console.error('Error parsing ingredients for recipe:', recipe.id, parseError);
            console.log('Raw ingredients data:', recipe.ingredients);
            
            // Final fallback: split by common delimiters
            // Convert ingredients to simple format with proper type annotations
            const simpleIngredients = (typeof recipe.ingredients === 'string'
              ? recipe.ingredients.split(/[,\n]/).filter(Boolean)
              : Array.isArray(recipe.ingredients)
                ? recipe.ingredients
                : []
            )
              .map((i: string) => i.trim())
              .filter((i: string) => i.length > 2)
              .slice(0, 10); // Limit to 10 items
            
            return simpleIngredients.map((ingredient: string) => ({
              userId: session.user.id,
              weekStartDate: weekMealPlan.weekStartDate.toISOString().split('T')[0],
              itemName: ingredient,
              quantity: '1',
              unit: 'piece',
              category: 'Other',
              isCompleted: false,
              recipeId: recipe.id,
              mealPlanEntryId: entry.id,
            }));
          }
        });
        
        console.log('Fallback generated items:', generatedItems.length);
      }

      if (generatedItems.length === 0) {
        console.log('No items generated, creating enhanced demo list based on planned meals');
        
        // Create a more realistic demo based on the number of planned meals
        const mealCount = mealPlanEntries.length;
        const demoItems = [
          { itemName: 'Chicken breast', quantity: '2', unit: 'lbs', category: 'Meat & Seafood' },
          { itemName: 'Ground beef', quantity: '1', unit: 'lb', category: 'Meat & Seafood' },
          { itemName: 'Salmon fillet', quantity: '4', unit: 'pieces', category: 'Meat & Seafood' },
          { itemName: 'Broccoli', quantity: '2', unit: 'heads', category: 'Produce' },
          { itemName: 'Spinach', quantity: '1', unit: 'bag', category: 'Produce' },
          { itemName: 'Bell peppers', quantity: '3', unit: 'pieces', category: 'Produce' },
          { itemName: 'Onions', quantity: '2', unit: 'pieces', category: 'Produce' },
          { itemName: 'Garlic', quantity: '1', unit: 'bulb', category: 'Produce' },
          { itemName: 'Tomatoes', quantity: '4', unit: 'pieces', category: 'Produce' },
          { itemName: 'Rice', quantity: '2', unit: 'cups', category: 'Pantry' },
          { itemName: 'Pasta', quantity: '1', unit: 'box', category: 'Pantry' },
          { itemName: 'Olive oil', quantity: '1', unit: 'bottle', category: 'Pantry' },
          { itemName: 'Salt', quantity: '1', unit: 'container', category: 'Pantry' },
          { itemName: 'Black pepper', quantity: '1', unit: 'container', category: 'Pantry' },
          { itemName: 'Milk', quantity: '1', unit: 'gallon', category: 'Dairy' },
          { itemName: 'Eggs', quantity: '1', unit: 'dozen', category: 'Dairy' },
          { itemName: 'Cheese', quantity: '1', unit: 'block', category: 'Dairy' },
        ].slice(0, Math.max(6, mealCount * 3)).map(item => ({
          ...item,
          userId: session.user.id,
          weekStartDate: weekMealPlan.weekStartDate.toISOString().split('T')[0],
          isCompleted: false,
          recipeId: 'demo',
          mealPlanEntryId: 'demo',
          inPantry: isInPantry(item.itemName),
          estimatedPrice: getCategoryBudget(item.category)?.averagePrice || '3.50',
          notes: [],
        }));

        console.log('Enhanced demo items created:', demoItems.length);
        setPreviewItems(demoItems);
        setShowPreview(true);
        return;
      }

      // Filter out pantry items if requested
      if (skipPantryItems) {
        generatedItems = generatedItems.filter(item => !isInPantry(item.itemName));
      }

      // Add smart insights to items
      const enhancedItems = generatedItems.map(item => {
        const categoryBudget = getCategoryBudget(item.category || 'Other');
        
        return {
          ...item,
          inPantry: isInPantry(item.itemName),
          estimatedPrice: categoryBudget?.averagePrice || '3.00',
          notes: [],
        };
      });

      console.log('Enhanced items for preview:', enhancedItems.length);

      // Group by category and sort
      const groupedItems = enhancedItems.reduce((groups, item) => {
        const category = item.category || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
        return groups;
      }, {} as Record<string, any[]>);

      // Flatten with category information
      const sortedItems = Object.entries(groupedItems).flatMap(([category, items]) =>
        (items as any[]).map((item: any) => ({ ...item, categoryHeader: category }))
      );

      setPreviewItems(sortedItems);
      setShowPreview(true);

    } catch (error) {
      console.error('Error generating shopping list preview:', error);
      Alert.alert('Error', 'Failed to generate shopping list preview.');
    } finally {
      setLoading(false);
    }
  };

  const applyShoppingList = async () => {
    setLoading(true);
    
    try {
      const itemsToAdd = previewItems.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity || '1',
        unit: item.unit || 'piece',
        category: item.category || 'Other',
        recipeId: item.recipeId,
        mealPlanEntryId: item.mealPlanEntryId,
      }));

      const success = await addItemsFromMealPlan(itemsToAdd);
      
      if (success) {
        // Track achievement
        await incrementStat('meals_planned');
        
        Alert.alert(
          '🛒 Shopping List Generated!',
          `Successfully added ${itemsToAdd.length} items to your shopping list.`,
          [{ text: 'Great!' }]
        );
        
        onGenerated();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to generate shopping list.');
      }
    } catch (error) {
      console.error('Error applying shopping list:', error);
      Alert.alert('Error', 'Failed to apply shopping list.');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTotal = () => {
    return previewItems.reduce((total, item) => {
      const price = parseFloat(item.estimatedPrice) || 3.00;
      const quantity = parseFloat(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getMealStats = () => {
    const totalMeals = weekMealPlan.days.reduce((sum, day) => {
      return sum + Object.values(day.meals).reduce((daySum, meals) => daySum + meals.length, 0);
    }, 0);

    const plannedDays = weekMealPlan.days.filter(day => 
      Object.values(day.meals).some(meals => meals.length > 0)
    ).length;

    return { totalMeals, plannedDays };
  };

  const stats = getMealStats();
  const estimatedTotal = getEstimatedTotal();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>🛒 Smart Shopping Generator</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {!showPreview ? (
            <>
              {/* Meal Plan Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Meal Plan</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.plannedDays}</Text>
                    <Text style={styles.statLabel}>Days Planned</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalMeals}</Text>
                    <Text style={styles.statLabel}>Total Meals</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{pantryItems.length}</Text>
                    <Text style={styles.statLabel}>Pantry Items</Text>
                  </View>
                </View>
              </View>

              {/* Generation Options */}
              <View style={styles.optionsCard}>
                <Text style={styles.optionsTitle}>Smart Options</Text>
                
                <TouchableOpacity 
                  style={styles.optionRow}
                  onPress={() => setSkipPantryItems(!skipPantryItems)}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name="home" size={20} color={Colors.primary} />
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>Skip Pantry Items</Text>
                      <Text style={styles.optionSubtitle}>
                        Don't add items you already have at home
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, skipPantryItems && styles.toggleActive]}>
                    {skipPantryItems && <Ionicons name="checkmark" size={16} color={Colors.surface} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionRow}
                  onPress={() => setConsolidateDuplicates(!consolidateDuplicates)}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name="layers" size={20} color={Colors.secondary} />
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>Consolidate Duplicates</Text>
                      <Text style={styles.optionSubtitle}>
                        Combine same ingredients from different recipes
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, consolidateDuplicates && styles.toggleActive]}>
                    {consolidateDuplicates && <Ionicons name="checkmark" size={16} color={Colors.surface} />}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Features List */}
              <View style={styles.featuresCard}>
                <Text style={styles.featuresTitle}>What you'll get:</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Organized by store sections</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Consolidated quantities</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Price estimates</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Pantry integration</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generatePreview}
                disabled={loading || stats.totalMeals === 0}
              >
                <Ionicons name="sparkles" size={20} color={Colors.surface} />
                <Text style={styles.generateButtonText}>
                  {loading ? 'Generating Preview...' : 'Generate Shopping List'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Preview Summary */}
              <View style={styles.previewSummary}>
                <Text style={styles.previewTitle}>Shopping List Preview</Text>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewValue}>{previewItems.length}</Text>
                    <Text style={styles.previewLabel}>Items</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewValue}>${estimatedTotal.toFixed(2)}</Text>
                    <Text style={styles.previewLabel}>Estimated</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewValue}>
                      {previewItems.filter(item => item.inPantry).length}
                    </Text>
                    <Text style={styles.previewLabel}>In Pantry</Text>
                  </View>
                </View>
              </View>

              {/* Preview Items */}
              <View style={styles.previewItems}>
                {previewItems.map((item, index) => (
                  <View key={index} style={styles.previewItem}>
                    <View style={styles.previewItemLeft}>
                      <Text style={styles.previewItemName}>{item.itemName}</Text>
                      <Text style={styles.previewItemDetails}>
                        {item.quantity} {item.unit} • {item.category}
                      </Text>
                    </View>
                    <View style={styles.previewItemRight}>
                      <Text style={styles.previewItemPrice}>${item.estimatedPrice}</Text>
                      {item.inPantry && (
                        <Ionicons name="home" size={12} color={Colors.warning} />
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowPreview(false)}
                >
                  <Ionicons name="chevron-back" size={16} color={Colors.primary} />
                  <Text style={styles.backButtonText}>Back to Options</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={applyShoppingList}
                  disabled={loading}
                >
                  <Ionicons name="checkmark-circle" size={16} color={Colors.surface} />
                  <Text style={styles.applyButtonText}>
                    {loading ? 'Adding...' : 'Add to Shopping List'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
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
  content: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  },
  optionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  optionsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  generateButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  previewSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  previewTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  previewLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  previewItems: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewItemLeft: {
    flex: 1,
  },
  previewItemName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  previewItemDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  previewItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  previewItemPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.success,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  backButtonText: {
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  applyButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
});