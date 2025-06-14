import { useState, useEffect, useCallback } from 'react';
import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
import { getWeekStartDate } from '../utils/dateUtils';

type ShoppingListItem = Schema['ShoppingListItem']['type'];

export interface GroupedShoppingList {
  [category: string]: ShoppingListItem[];
}

export const useShoppingList = (weekStartDate?: Date) => {
  const { session } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [groupedList, setGroupedList] = useState<GroupedShoppingList>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentWeekStart = weekStartDate || getWeekStartDate(new Date());

  // Load shopping list items for the current week
  const loadShoppingList = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if ShoppingListItem model exists
      if (!amplifyClient.models?.ShoppingListItem) {
        console.error('ShoppingListItem model not found in Amplify client');
        // Don't set error, just return empty list
        setShoppingList([]);
        setGroupedList({});
        setLoading(false);
        return;
      }

      const weekStartDateStr = currentWeekStart.toISOString().split('T')[0];

      const { data: items } = await amplifyClient.models.ShoppingListItem.list({
        filter: {
          userId: { eq: session.user.id },
          weekStartDate: { eq: weekStartDateStr }
        }
      });

      const shoppingItems = items || [];
      setShoppingList(shoppingItems);
      
      // Group items by category
      const grouped = groupItemsByCategory(shoppingItems);
      setGroupedList(grouped);

    } catch (err) {
      console.error('Error loading shopping list:', err);
      console.error('Error details:', err);
      // Don't set error for now, just show empty list
      setShoppingList([]);
      setGroupedList({});
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, currentWeekStart]);

  // Group items by category
  const groupItemsByCategory = (items: ShoppingListItem[]): GroupedShoppingList => {
    const grouped: GroupedShoppingList = {};
    
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  };

  // Add a shopping list item
  const addShoppingListItem = useCallback(async (
    itemName: string,
    quantity?: string,
    unit?: string,
    category?: string,
    recipeId?: string,
    mealPlanEntryId?: string
  ) => {
    if (!session?.user?.id) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      if (!amplifyClient.models?.ShoppingListItem) {
        setError('Shopping list model not available.');
        setLoading(false);
        return false;
      }

      const weekStartDateStr = currentWeekStart.toISOString().split('T')[0];

      const { data: newItem } = await amplifyClient.models.ShoppingListItem.create({
        userId: session.user.id,
        weekStartDate: weekStartDateStr,
        itemName,
        quantity: quantity || '1',
        unit: unit || 'piece',
        category: category || 'Other',
        isCompleted: false,
        recipeId,
        mealPlanEntryId,
      });


      if (newItem) {
        const updatedList = [...shoppingList, newItem];
        setShoppingList(updatedList);
        setGroupedList(groupItemsByCategory(updatedList));
        return true;
      }
    } catch (err) {
      console.error('Error adding shopping list item:', err);
      setError('Failed to add item to shopping list.');
    } finally {
      setLoading(false);
    }

    return false;
  }, [session?.user?.id, currentWeekStart, shoppingList]);

  // Update a shopping list item
  const updateShoppingListItem = useCallback(async (
    itemId: string,
    updates: Partial<Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'weekStartDate'>>
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (!amplifyClient.models?.ShoppingListItem) {
        setError('Shopping list model not available.');
        return false;
      }

      const { data: updatedItem } = await amplifyClient.models.ShoppingListItem.update({
        id: itemId,
        ...updates
      });

      if (updatedItem) {
        const updatedList = shoppingList.map(item => 
          item.id === itemId ? updatedItem : item
        );
        setShoppingList(updatedList);
        setGroupedList(groupItemsByCategory(updatedList));
        return true;
      }
    } catch (err) {
      console.error('Error updating shopping list item:', err);
      setError('Failed to update item.');
    } finally {
      setLoading(false);
    }

    return false;
  }, [shoppingList]);

  // Toggle item completion
  const toggleItemCompleted = useCallback(async (itemId: string) => {
    const item = shoppingList.find(item => item.id === itemId);
    if (!item) return false;

    return updateShoppingListItem(itemId, { isCompleted: !item.isCompleted });
  }, [shoppingList, updateShoppingListItem]);

  // Delete a shopping list item
  const deleteShoppingListItem = useCallback(async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!amplifyClient.models?.ShoppingListItem) {
        setError('Shopping list model not available.');
        return false;
      }

      await amplifyClient.models.ShoppingListItem.delete({ id: itemId });
      
      const updatedList = shoppingList.filter(item => item.id !== itemId);
      setShoppingList(updatedList);
      setGroupedList(groupItemsByCategory(updatedList));
      
      return true;
    } catch (err) {
      console.error('Error deleting shopping list item:', err);
      setError('Failed to delete item.');
    } finally {
      setLoading(false);
    }

    return false;
  }, [shoppingList]);

  // Clear completed items
  const clearCompletedItems = useCallback(async () => {
    const completedItems = shoppingList.filter(item => item.isCompleted);
    
    setLoading(true);
    setError(null);

    try {
      // Delete all completed items
      const deletePromises = completedItems.map(item =>
        amplifyClient.models.ShoppingListItem.delete({ id: item.id })
      );
      
      await Promise.all(deletePromises);
      
      const updatedList = shoppingList.filter(item => !item.isCompleted);
      setShoppingList(updatedList);
      setGroupedList(groupItemsByCategory(updatedList));
      
      return true;
    } catch (err) {
      console.error('Error clearing completed items:', err);
      setError('Failed to clear completed items.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [shoppingList]);

  // Clear all items
  const clearAllItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!amplifyClient.models?.ShoppingListItem) {
        setError('Shopping list model not available.');
        return false;
      }

      // Delete all items
      const deletePromises = shoppingList.map(item =>
        amplifyClient.models.ShoppingListItem.delete({ id: item.id })
      );
      
      await Promise.all(deletePromises);
      
      setShoppingList([]);
      setGroupedList({});
      
      return true;
    } catch (err) {
      console.error('Error clearing all items:', err);
      setError('Failed to clear shopping list.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [shoppingList]);

  // Add multiple items from meal plan generation
  const addItemsFromMealPlan = useCallback(async (items: Array<{
    itemName: string;
    quantity: string;
    unit: string;
    category: string;
    recipeId?: string;
    mealPlanEntryId?: string;
  }>) => {
    if (!session?.user?.id || !amplifyClient.models?.ShoppingListItem) return false;

    setLoading(true);
    setError(null);

    try {
      const weekStartDateStr = currentWeekStart.toISOString().split('T')[0];

      // Create all items in parallel
      const createPromises = items.map(item =>
        amplifyClient.models.ShoppingListItem.create({
          userId: session.user.id,
          weekStartDate: weekStartDateStr,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          isCompleted: false,
          recipeId: item.recipeId,
          mealPlanEntryId: item.mealPlanEntryId,
        })
      );

      const results = await Promise.all(createPromises);
      const newItems = results.map(result => result.data).filter(Boolean) as ShoppingListItem[];

      const updatedList = [...shoppingList, ...newItems];
      setShoppingList(updatedList);
      setGroupedList(groupItemsByCategory(updatedList));

      return true;
    } catch (err) {
      console.error('Error adding items from meal plan:', err);
      setError('Failed to generate shopping list from meal plan.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, currentWeekStart, shoppingList]);

  // Calculate progress
  const getProgress = useCallback(() => {
    const total = shoppingList.length;
    const completed = shoppingList.filter(item => item.isCompleted).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }, [shoppingList]);

  // Load shopping list when component mounts or week changes
  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  return {
    // State
    shoppingList,
    groupedList,
    loading,
    error,
    progress: getProgress(),

    // Actions
    addShoppingListItem,
    updateShoppingListItem,
    toggleItemCompleted,
    deleteShoppingListItem,
    clearCompletedItems,
    clearAllItems,
    addItemsFromMealPlan,

    // Utilities
    refreshShoppingList: loadShoppingList,
  };
};