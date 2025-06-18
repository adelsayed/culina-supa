import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { useMealPlanner } from '../../hooks/useMealPlanner';
import { useShoppingList } from '../../hooks/useShoppingList';
import { generateShoppingList } from '../../utils/shoppingListGenerator';
import { getWeekStartDate } from '../../utils/dateUtils';
import SmartShoppingList from '../../components/shoppinglist/SmartShoppingList';
import AutoShoppingGenerator from '../../components/shoppinglist/AutoShoppingGenerator';
import type { Schema } from '../../amplify/data/resource';

type ShoppingListItem = Schema['ShoppingListItem']['type'];

const ShoppingListScreen: React.FC = () => {
  const { session } = useAuth();
  const { weekMealPlan, recipes } = useMealPlanner(getWeekStartDate(new Date()));
  const {
    groupedList: shoppingList,
    loading,
    error,
    progress,
    toggleItemCompleted,
    addShoppingListItem,
    deleteShoppingListItem,
    clearCompletedItems,
    clearAllItems,
    addItemsFromMealPlan,
    refreshShoppingList,
  } = useShoppingList();
  
  const [newItemName, setNewItemName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [generatingList, setGeneratingList] = useState(false);
  const [showSmartGenerator, setShowSmartGenerator] = useState(false);
  const [useSmartView, setUseSmartView] = useState(true);

  // Refresh shopping list when screen becomes focused
  useEffect(() => {
    const unsubscribe = () => {
      refreshShoppingList();
    };
    
    // Call refresh immediately
    unsubscribe();
    
    return unsubscribe;
  }, [refreshShoppingList]);

  const addCustomItem = async () => {
    if (!newItemName.trim()) return;

    const success = await addShoppingListItem(
      newItemName.trim(),
      '1',
      'piece',
      'Other'
    );

    if (success) {
      setNewItemName('');
      setShowAddItem(false);
    } else {
      Alert.alert('Error', 'Failed to add item to shopping list');
    }
  };

  const handleClearOptions = () => {
    const totalItems = Object.values(shoppingList).flat().length;
    const completedItems = Object.values(shoppingList).flat().filter(item => item.isCompleted).length;
    
    const options: any[] = [
      { text: 'Cancel', style: 'cancel' },
    ];

    if (completedItems > 0) {
      options.push({
        text: `Clear Completed (${completedItems})`,
        onPress: async () => {
          const success = await clearCompletedItems();
          if (!success) {
            Alert.alert('Error', 'Failed to clear completed items');
          }
        },
      });
    }

    if (totalItems > 0) {
      options.push({
        text: `Clear All (${totalItems})`,
        style: 'destructive',
        onPress: async () => {
          const success = await clearAllItems();
          if (success) {
            Alert.alert('Success', 'Shopping list cleared successfully!');
          } else {
            Alert.alert('Error', 'Failed to clear shopping list');
          }
        },
      });
    }

    Alert.alert(
      'Clear Items',
      'Choose what to clear from your shopping list:',
      options
    );
  };

  const generateFromMealPlan = async () => {
    if (!session?.user?.id) return;

    setGeneratingList(true);
    
    try {
      // Generate shopping list from meal plan
      const generatedList = generateShoppingList(
        weekMealPlan.days.flatMap(day =>
          Object.values(day.meals).flatMap(mealEntries => mealEntries)
        ),
        recipes,
        weekMealPlan.weekStartDate,
        session.user.id
      );

      // Convert to the format expected by addItemsFromMealPlan
      const itemsToAdd = generatedList.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity || '1',
        unit: item.unit || 'piece',
        category: item.category || 'Other',
        recipeId: item.recipeId || undefined,
        mealPlanEntryId: item.mealPlanEntryId || undefined,
      }));

      const success = await addItemsFromMealPlan(itemsToAdd);
      
      if (success) {
        Alert.alert('Success', `Added ${itemsToAdd.length} items to your shopping list!`);
      } else {
        Alert.alert('Error', 'Failed to generate shopping list from meal plan');
      }
    } catch (err) {
      console.error('Error generating shopping list:', err);
      Alert.alert('Error', 'Failed to generate shopping list from meal plan');
    } finally {
      setGeneratingList(false);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Please sign in to view your shopping list</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setUseSmartView(!useSmartView)}
          >
            <Text style={styles.viewToggleText}>
              {useSmartView ? 'Smart' : 'Basic'}
            </Text>
            <Ionicons
              name={useSmartView ? 'sparkles' : 'list'}
              size={16}
              color="#007AFF"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSmartGenerator(true)}
          >
            <Ionicons name="construct" size={24} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddItem(!showAddItem)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleClearOptions}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {progress.completed} of {progress.total} items completed
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress.percentage)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress.percentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Add Item Input */}
      {showAddItem && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.addItemInput}
            placeholder="Add new item..."
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={addCustomItem}
            autoFocus
          />
          <TouchableOpacity style={styles.addItemButton} onPress={addCustomItem}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content - Smart or Basic View */}
      {useSmartView ? (
        <SmartShoppingList weekStartDate={getWeekStartDate(new Date())} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {Object.entries(shoppingList).map(([category, items]) => {
            if (items.length === 0) return null;
            
            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item: any) => (
                  <View key={item.id} style={[
                    styles.shoppingItem,
                    item.isCompleted && styles.completedItem,
                  ]}>
                    <TouchableOpacity
                      style={styles.itemContent}
                      onPress={() => toggleItemCompleted(item.id)}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[
                          styles.checkbox,
                          item.isCompleted && styles.checkedBox,
                        ]}>
                          {item.isCompleted && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <View style={styles.itemInfo}>
                          <Text style={[
                            styles.itemName,
                            item.isCompleted && styles.completedText,
                          ]}>
                            {item.itemName}
                          </Text>
                          <Text style={[
                            styles.itemQuantity,
                            item.isCompleted && styles.completedText,
                          ]}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Item',
                          `Remove "${item.itemName}" from your shopping list?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                const success = await deleteShoppingListItem(item.id);
                                if (!success) {
                                  Alert.alert('Error', 'Failed to delete item');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="close" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Empty State */}
          {Object.values(shoppingList).every((items) => items.length === 0) && (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>Your shopping list is empty</Text>
              <Text style={styles.emptyStateText}>
                Add items manually or generate a list from your meal plan
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => setShowAddItem(true)}
              >
                <Text style={styles.generateButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={generateFromMealPlan}
              disabled={generatingList}
            >
              {generatingList ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="refresh-outline" size={20} color="#007AFF" />
              )}
              <Text style={styles.actionButtonText}>
                {generatingList ? 'Generating...' : 'Generate from Meal Plan'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Share List</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Auto Shopping Generator Modal */}
      <AutoShoppingGenerator
        visible={showSmartGenerator}
        onClose={() => setShowSmartGenerator(false)}
        onGenerated={() => {
          // Refresh the shopping list after generation
          refreshShoppingList();
        }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  addItemContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addItemInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginRight: 12,
  },
  addItemButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  completedItem: {
    backgroundColor: '#f8f9fa',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  generateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    padding: 16,
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
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  fallbackText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  itemContent: {
    flex: 1,
  },
  deleteButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    gap: 4,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default ShoppingListScreen;