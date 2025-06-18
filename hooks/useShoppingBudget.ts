import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/AuthContext';

export interface CategoryBudget {
  category: string;
  estimated: string;
  averagePrice: string;
  spent: number;
  remaining: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categories: CategoryBudget[];
}

// Default price estimates for common grocery categories (in USD)
const DEFAULT_CATEGORY_PRICES: Record<string, number> = {
  'Produce': 3.50,
  'Dairy': 4.00,
  'Meat & Seafood': 8.00,
  'Pantry': 2.50,
  'Frozen': 5.00,
  'Beverages': 3.00,
  'Snacks & Sweets': 4.50,
  'Household': 6.00,
  'Other': 3.00,
};

export const useShoppingBudget = () => {
  const { session } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetSummary>({
    totalBudget: 150, // Default weekly budget
    totalSpent: 0,
    totalRemaining: 150,
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load budget data from storage
  const loadBudgetData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const storageKey = `budget_${session.user.id}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        const parsedData = JSON.parse(stored);
        setBudgetData(parsedData);
      }
    } catch (err) {
      console.error('Error loading budget data:', err);
      setError('Failed to load budget data');
    }
  }, [session?.user?.id]);

  // Save budget data to storage
  const saveBudgetData = useCallback(async (data: BudgetSummary) => {
    if (session?.user?.id) {
      const storageKey = `budget_${session.user.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [session?.user?.id]);

  // Estimate total cost for shopping list
  const estimateShoppingListCost = useCallback((shoppingList: any[]): number => {
    return shoppingList.reduce((total, item) => {
      const categoryPrice = DEFAULT_CATEGORY_PRICES[item.category || 'Other'] || 3.00;
      const quantity = parseFloat(item.quantity) || 1;
      return total + (categoryPrice * quantity);
    }, 0);
  }, []);

  // Get category budget information
  const getCategoryBudget = useCallback((category: string): CategoryBudget | null => {
    const existingCategory = budgetData.categories.find(cat => cat.category === category);
    
    if (existingCategory) {
      return existingCategory;
    }

    // Return default category budget
    const averagePrice = DEFAULT_CATEGORY_PRICES[category] || 3.00;
    return {
      category,
      estimated: '0.00',
      averagePrice: averagePrice.toFixed(2),
      spent: 0,
      remaining: 0,
    };
  }, [budgetData.categories]);

  // Update category budget
  const updateCategoryBudget = useCallback(async (
    category: string,
    estimated: number,
    averagePrice?: number
  ) => {
    try {
      const updatedCategories = [...budgetData.categories];
      const existingIndex = updatedCategories.findIndex(cat => cat.category === category);
      
      if (existingIndex >= 0) {
        updatedCategories[existingIndex] = {
          ...updatedCategories[existingIndex],
          estimated: estimated.toFixed(2),
          averagePrice: averagePrice?.toFixed(2) || updatedCategories[existingIndex].averagePrice,
          remaining: estimated - updatedCategories[existingIndex].spent,
        };
      } else {
        updatedCategories.push({
          category,
          estimated: estimated.toFixed(2),
          averagePrice: (averagePrice || DEFAULT_CATEGORY_PRICES[category] || 3.00).toFixed(2),
          spent: 0,
          remaining: estimated,
        });
      }

      const updatedBudgetData = {
        ...budgetData,
        categories: updatedCategories,
        totalRemaining: budgetData.totalBudget - updatedCategories.reduce((sum, cat) => sum + cat.spent, 0),
      };

      setBudgetData(updatedBudgetData);
      saveBudgetData(updatedBudgetData);
      
      return true;
    } catch (err) {
      console.error('Error updating category budget:', err);
      setError('Failed to update category budget');
      return false;
    }
  }, [budgetData, saveBudgetData]);

  // Track a purchase
  const trackPurchase = useCallback(async (category: string, amount: number) => {
    try {
      const updatedCategories = [...budgetData.categories];
      const existingIndex = updatedCategories.findIndex(cat => cat.category === category);
      
      if (existingIndex >= 0) {
        updatedCategories[existingIndex] = {
          ...updatedCategories[existingIndex],
          spent: updatedCategories[existingIndex].spent + amount,
          remaining: Math.max(0, updatedCategories[existingIndex].remaining - amount),
        };
      } else {
        // Create new category budget entry
        updatedCategories.push({
          category,
          estimated: amount.toFixed(2),
          averagePrice: (DEFAULT_CATEGORY_PRICES[category] || 3.00).toFixed(2),
          spent: amount,
          remaining: 0,
        });
      }

      const totalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0);
      
      const updatedBudgetData = {
        ...budgetData,
        categories: updatedCategories,
        totalSpent,
        totalRemaining: Math.max(0, budgetData.totalBudget - totalSpent),
      };

      setBudgetData(updatedBudgetData);
      saveBudgetData(updatedBudgetData);
      
      return true;
    } catch (err) {
      console.error('Error tracking purchase:', err);
      setError('Failed to track purchase');
      return false;
    }
  }, [budgetData, saveBudgetData]);

  // Set total weekly budget
  const setWeeklyBudget = useCallback(async (amount: number) => {
    try {
      const updatedBudgetData = {
        ...budgetData,
        totalBudget: amount,
        totalRemaining: amount - budgetData.totalSpent,
      };

      setBudgetData(updatedBudgetData);
      saveBudgetData(updatedBudgetData);
      
      return true;
    } catch (err) {
      console.error('Error setting weekly budget:', err);
      setError('Failed to set weekly budget');
      return false;
    }
  }, [budgetData, saveBudgetData]);

  // Reset budget for new week
  const resetWeeklyBudget = useCallback(async () => {
    try {
      const resetData: BudgetSummary = {
        totalBudget: budgetData.totalBudget,
        totalSpent: 0,
        totalRemaining: budgetData.totalBudget,
        categories: budgetData.categories.map(cat => ({
          ...cat,
          spent: 0,
          remaining: parseFloat(cat.estimated),
        })),
      };

      setBudgetData(resetData);
      saveBudgetData(resetData);
      
      return true;
    } catch (err) {
      console.error('Error resetting weekly budget:', err);
      setError('Failed to reset weekly budget');
      return false;
    }
  }, [budgetData, saveBudgetData]);

  // Get budget status
  const getBudgetStatus = useCallback((): 'good' | 'warning' | 'over' => {
    const spentPercentage = (budgetData.totalSpent / budgetData.totalBudget) * 100;
    
    if (spentPercentage <= 75) return 'good';
    if (spentPercentage <= 100) return 'warning';
    return 'over';
  }, [budgetData]);

  // Get estimated total for current shopping list
  const estimatedTotal = budgetData.categories.reduce(
    (total, category) => total + parseFloat(category.estimated), 
    0
  );

  // Load budget data on mount
  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  return {
    // State
    budgetData,
    loading,
    error,
    estimatedTotal,

    // Actions
    updateCategoryBudget,
    trackPurchase,
    setWeeklyBudget,
    resetWeeklyBudget,

    // Queries
    getCategoryBudget,
    estimateShoppingListCost,
    getBudgetStatus,

    // Utilities
    refreshBudget: loadBudgetData,
  };
};