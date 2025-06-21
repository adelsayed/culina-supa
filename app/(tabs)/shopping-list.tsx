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

type ShoppingListItem = Schema['ShoppingListItem'];

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
            onPress={handleClearOptions}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading shopping list...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Error loading shopping list</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshShoppingList}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddItem(true)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={generateFromMealPlan}
              disabled={generatingList}
            >
              <Ionicons name="restaurant" size={20} color="#10B981" />
              <Text style={styles.actionButtonText}>
                {generatingList ? 'Generating...' : 'From Meal Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Shopping List Content */}
          {useSmartView ? (
            <SmartShoppingList weekStartDate={getWeekStartDate(new Date())} />
          ) : (
            <ScrollView style={styles.listContainer}>
              {Object.entries(shoppingList).map(([category, items]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.listItem,
                        item.isCompleted && styles.completedItem,
                      ]}
                      onPress={() => toggleItemCompleted(item.id)}
                    >
                      <View style={styles.itemContent}>
                        <Ionicons
                          name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={item.isCompleted ? '#10B981' : '#6B7280'}
                        />
                        <View style={styles.itemDetails}>
                          <Text
                            style={[
                              styles.itemName,
                              item.isCompleted && styles.completedText,
                            ]}
                          >
                            {item.itemName}
                          </Text>
                          <Text style={styles.itemQuantity}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteShoppingListItem(item.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Shopping Item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddItem(false);
                  setNewItemName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addCustomItem}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Smart Generator Modal */}
      {showSmartGenerator && (
        <AutoShoppingGenerator
          visible={showSmartGenerator}
          onClose={() => setShowSmartGenerator(false)}
          onGenerated={() => {
            // Refresh the shopping list after generation
            refreshShoppingList();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  completedItem: {
    backgroundColor: '#F0FDF4',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ShoppingListScreen;