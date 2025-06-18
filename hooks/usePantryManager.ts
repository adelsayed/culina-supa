import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/AuthContext';

export interface PantryItemData {
  id: string;
  itemName: string;
  quantity: string;
  unit: string;
  category: string;
  expiryDate?: string;
  isLow: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usePantryManager = () => {
  const { session } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pantry items
  const loadPantryItems = useCallback(async () => {
    if (!session?.user?.id) {
      setPantryItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use AsyncStorage for React Native
      const storageKey = `pantry_${session.user.id}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        const parsedItems = JSON.parse(stored);
        setPantryItems(parsedItems);
      } else {
        setPantryItems([]);
      }
    } catch (err) {
      console.error('Error loading pantry items:', err);
      setError('Failed to load pantry items');
      setPantryItems([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Save pantry items to storage
  const savePantryItems = useCallback(async (items: PantryItemData[]) => {
    if (session?.user?.id) {
      const storageKey = `pantry_${session.user.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [session?.user?.id]);

  // Add item to pantry
  const addToPantry = useCallback(async (
    itemName: string,
    quantity: string,
    unit: string,
    category?: string,
    expiryDate?: string
  ) => {
    if (!session?.user?.id) return false;

    try {
      const newItem: PantryItemData = {
        id: `pantry_${Date.now()}_${Math.random()}`,
        itemName: itemName.trim(),
        quantity,
        unit,
        category: category || 'Other',
        expiryDate,
        isLow: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedItems = [...pantryItems, newItem];
      setPantryItems(updatedItems);
      await savePantryItems(updatedItems);
      
      return true;
    } catch (err) {
      console.error('Error adding to pantry:', err);
      setError('Failed to add item to pantry');
      return false;
    }
  }, [session?.user?.id, pantryItems, savePantryItems]);

  // Update pantry item
  const updatePantryItem = useCallback(async (
    itemId: string,
    updates: Partial<Pick<PantryItemData, 'quantity' | 'unit' | 'expiryDate' | 'isLow'>>
  ) => {
    try {
      const updatedItems = pantryItems.map(item =>
        item.id === itemId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      
      setPantryItems(updatedItems);
      await savePantryItems(updatedItems);
      
      return true;
    } catch (err) {
      console.error('Error updating pantry item:', err);
      setError('Failed to update pantry item');
      return false;
    }
  }, [pantryItems, savePantryItems]);

  // Remove item from pantry
  const removeFromPantry = useCallback(async (itemId: string) => {
    try {
      const updatedItems = pantryItems.filter(item => item.id !== itemId);
      setPantryItems(updatedItems);
      await savePantryItems(updatedItems);
      
      return true;
    } catch (err) {
      console.error('Error removing from pantry:', err);
      setError('Failed to remove item from pantry');
      return false;
    }
  }, [pantryItems, savePantryItems]);

  // Check if item is in pantry
  const isInPantry = useCallback((itemName: string): boolean => {
    return pantryItems.some(item => 
      item.itemName.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(item.itemName.toLowerCase())
    );
  }, [pantryItems]);

  // Get pantry item by name
  const getPantryItem = useCallback((itemName: string): PantryItemData | null => {
    return pantryItems.find(item => 
      item.itemName.toLowerCase() === itemName.toLowerCase()
    ) || null;
  }, [pantryItems]);

  // Mark item as low stock
  const markAsLowStock = useCallback(async (itemId: string) => {
    return updatePantryItem(itemId, { isLow: true });
  }, [updatePantryItem]);

  // Get low stock items
  const getLowStockItems = useCallback((): PantryItemData[] => {
    return pantryItems.filter(item => item.isLow);
  }, [pantryItems]);

  // Get expiring items (within 7 days)
  const getExpiringItems = useCallback((): PantryItemData[] => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return pantryItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= weekFromNow && expiryDate >= now;
    });
  }, [pantryItems]);

  // Load pantry items on mount
  useEffect(() => {
    loadPantryItems();
  }, [loadPantryItems]);

  return {
    // State
    pantryItems,
    loading,
    error,

    // Actions
    addToPantry,
    updatePantryItem,
    removeFromPantry,
    markAsLowStock,

    // Queries
    isInPantry,
    getPantryItem,
    getLowStockItems,
    getExpiringItems,

    // Utilities
    refreshPantry: loadPantryItems,
  };
};