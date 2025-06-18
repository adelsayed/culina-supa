import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { useShoppingList } from '../../hooks/useShoppingList';
import { usePantryManager } from '../../hooks/usePantryManager';
import { useShoppingBudget } from '../../hooks/useShoppingBudget';
import { getSuggestedShoppingOrder } from '../../utils/shoppingListGenerator';
import type { Schema } from '../../amplify/data/resource';

type ShoppingListItem = Schema['ShoppingListItem']['type'];

interface SmartShoppingListProps {
  weekStartDate?: Date;
}

export default function SmartShoppingList({ weekStartDate }: SmartShoppingListProps) {
  const {
    groupedList,
    loading,
    progress,
    toggleItemCompleted,
    deleteShoppingListItem,
    addShoppingListItem,
  } = useShoppingList(weekStartDate);

  const { pantryItems, isInPantry, addToPantry } = usePantryManager();
  const { estimatedTotal, getCategoryBudget, trackPurchase } = useShoppingBudget();

  const [showOptimizedOrder, setShowOptimizedOrder] = useState(false);
  const [showPriceEstimate, setShowPriceEstimate] = useState(false);

  // Get shopping order (optimized for store layout)
  const suggestedOrder = getSuggestedShoppingOrder();
  const orderedCategories = showOptimizedOrder 
    ? suggestedOrder.filter(category => groupedList[category]?.length > 0)
    : Object.keys(groupedList).filter(category => groupedList[category]?.length > 0);

  // Calculate smart insights
  const getSmartInsights = () => {
    const allItems = Object.values(groupedList).flat();
    const pendingItems = allItems.filter(item => !item.isCompleted);
    const pantryAvailable = pendingItems.filter(item => isInPantry(item.itemName));
    const duplicateItems = findDuplicateItems(allItems);

    return {
      total: allItems.length,
      pending: pendingItems.length,
      pantryAvailable: pantryAvailable.length,
      duplicates: duplicateItems.length,
      estimatedCost: estimatedTotal,
    };
  };

  const findDuplicateItems = (items: ShoppingListItem[]) => {
    const itemNames = items.map(item => item.itemName.toLowerCase());
    return items.filter((item, index) => 
      itemNames.indexOf(item.itemName.toLowerCase()) !== index
    );
  };

  const handlePantryCheck = async (item: ShoppingListItem) => {
    if (isInPantry(item.itemName)) {
      Alert.alert(
        'Item in Pantry',
        `You already have "${item.itemName}" in your pantry. Mark as completed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Complete',
            onPress: () => toggleItemCompleted(item.id),
          },
        ]
      );
    } else {
      Alert.alert(
        'Add to Pantry',
        `Add "${item.itemName}" to your pantry inventory?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add to Pantry',
            onPress: () => addToPantry(item.itemName, item.quantity || '1', item.unit || 'piece'),
          },
        ]
      );
    }
  };

  const handleItemPurchased = async (item: ShoppingListItem) => {
    await toggleItemCompleted(item.id);
    // Track purchase for budget management
    const categoryBudget = getCategoryBudget(item.category || 'Other');
    if (categoryBudget) {
      await trackPurchase(item.category || 'Other', parseFloat(categoryBudget.averagePrice) || 5);
    }
  };

  const insights = getSmartInsights();

  return (
    <View style={styles.container}>
      {/* Smart Insights Header */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Smart Shopping Insights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightsScroll}>
          <View style={styles.insightCard}>
            <Ionicons name="basket" size={20} color={Colors.primary} />
            <Text style={styles.insightValue}>{insights.pending}</Text>
            <Text style={styles.insightLabel}>Items Left</Text>
          </View>
          
          {insights.pantryAvailable > 0 && (
            <View style={[styles.insightCard, styles.warningCard]}>
              <Ionicons name="home" size={20} color={Colors.warning} />
              <Text style={styles.insightValue}>{insights.pantryAvailable}</Text>
              <Text style={styles.insightLabel}>In Pantry</Text>
            </View>
          )}

          {insights.duplicates > 0 && (
            <View style={[styles.insightCard, styles.errorCard]}>
              <Ionicons name="copy" size={20} color={Colors.error} />
              <Text style={styles.insightValue}>{insights.duplicates}</Text>
              <Text style={styles.insightLabel}>Duplicates</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.insightCard, styles.budgetCard]}
            onPress={() => setShowPriceEstimate(!showPriceEstimate)}
          >
            <Ionicons name="wallet" size={20} color={Colors.success} />
            <Text style={styles.insightValue}>~${insights.estimatedCost}</Text>
            <Text style={styles.insightLabel}>Estimated</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Smart Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, showOptimizedOrder && styles.activeControl]}
          onPress={() => setShowOptimizedOrder(!showOptimizedOrder)}
        >
          <Ionicons 
            name={showOptimizedOrder ? "map" : "map-outline"} 
            size={16} 
            color={showOptimizedOrder ? Colors.surface : Colors.primary} 
          />
          <Text style={[styles.controlText, showOptimizedOrder && styles.activeControlText]}>
            Store Layout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showPriceEstimate && styles.activeControl]}
          onPress={() => setShowPriceEstimate(!showPriceEstimate)}
        >
          <Ionicons 
            name={showPriceEstimate ? "cash" : "cash-outline"} 
            size={16} 
            color={showPriceEstimate ? Colors.surface : Colors.primary} 
          />
          <Text style={[styles.controlText, showPriceEstimate && styles.activeControlText]}>
            Prices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shopping List by Category */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {orderedCategories.map((category, categoryIndex) => {
          const items = groupedList[category] || [];
          if (items.length === 0) return null;

          const categoryBudget = getCategoryBudget(category);
          const completedInCategory = items.filter(item => item.isCompleted).length;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.categorySubtitle}>
                    {items.length - completedInCategory} of {items.length} items
                  </Text>
                </View>
                
                {showOptimizedOrder && (
                  <View style={styles.orderIndicator}>
                    <Text style={styles.orderNumber}>{categoryIndex + 1}</Text>
                  </View>
                )}

                {showPriceEstimate && categoryBudget && (
                  <View style={styles.priceEstimate}>
                    <Text style={styles.priceText}>~${categoryBudget.estimated}</Text>
                  </View>
                )}
              </View>

              {items.map((item) => (
                <View key={item.id} style={[styles.itemContainer, item.isCompleted && styles.completedItemContainer]}>
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => handleItemPurchased(item)}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.checkbox, item.isCompleted && styles.checkedBox]}>
                        {item.isCompleted && (
                          <Ionicons name="checkmark" size={16} color={Colors.surface} />
                        )}
                      </View>
                      
                      <View style={styles.itemInfo}>
                        <View style={styles.itemNameRow}>
                          <Text style={[styles.itemName, item.isCompleted && styles.completedText]}>
                            {item.itemName}
                          </Text>
                          {isInPantry(item.itemName) && (
                            <View style={styles.pantryIndicator}>
                              <Ionicons name="home" size={12} color={Colors.warning} />
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.itemDetails}>
                          <Text style={[styles.itemQuantity, item.isCompleted && styles.completedText]}>
                            {item.quantity} {item.unit}
                          </Text>
                          {showPriceEstimate && (
                            <Text style={styles.itemPrice}>
                              ~${categoryBudget?.averagePrice || '2.50'}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handlePantryCheck(item)}
                    >
                      <Ionicons 
                        name={isInPantry(item.itemName) ? "home" : "home-outline"} 
                        size={16} 
                        color={isInPantry(item.itemName) ? Colors.warning : Colors.textTertiary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteShoppingListItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {Object.keys(groupedList).length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No items in your shopping list</Text>
            <Text style={styles.emptySubtitle}>
              Generate a list from your meal plan or add items manually
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  insightsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  insightsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  insightsScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  insightCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 80,
  },
  warningCard: {
    backgroundColor: `${Colors.warning}15`,
  },
  errorCard: {
    backgroundColor: `${Colors.error}15`,
  },
  budgetCard: {
    backgroundColor: `${Colors.success}15`,
  },
  insightValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  insightLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  controlsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  activeControl: {
    backgroundColor: Colors.primary,
  },
  controlText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  activeControlText: {
    color: Colors.surface,
  },
  listContainer: {
    flex: 1,
  },
  categorySection: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  categorySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  orderIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  orderNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
  },
  priceEstimate: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.success,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  completedItemContainer: {
    backgroundColor: Colors.surfaceSecondary,
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkedBox: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  pantryIndicator: {
    marginLeft: Spacing.sm,
    padding: 2,
    backgroundColor: `${Colors.warning}20`,
    borderRadius: BorderRadius.sm,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.success,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
  },
});