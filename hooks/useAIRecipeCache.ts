import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AIRecipeRecommendation {
  name: string;
  description: string;
  cuisine: string;
  calories: number;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
}

interface CachedAIRecipes {
  recipes: AIRecipeRecommendation[];
  timestamp: number;
  prompt: string;
  userId: string;
}

const CACHE_KEY = 'ai_recipe_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useAIRecipeCache(userId: string | null) {
  const [cachedRecipes, setCachedRecipes] = useState<AIRecipeRecommendation[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheInitialized = useRef(false);

  // Load cached recipes from AsyncStorage
  const loadCachedRecipes = useCallback(async () => {
    if (!userId || cacheInitialized.current) return;
    
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${userId}`);
      if (cached) {
        const cachedData: CachedAIRecipes = JSON.parse(cached);
        
        // Check if cache is still valid (within 24 hours)
        const now = Date.now();
        const isValid = (now - cachedData.timestamp) < CACHE_DURATION;
        
        if (isValid && cachedData.recipes.length > 0) {
          setCachedRecipes(cachedData.recipes);
          setCacheTimestamp(cachedData.timestamp);
          console.log('Loaded cached AI recipes:', cachedData.recipes.length, 'recipes');
        } else {
          // Cache is expired, clear it
          await AsyncStorage.removeItem(`${CACHE_KEY}_${userId}`);
          console.log('Cache expired, cleared old data');
        }
      }
      cacheInitialized.current = true;
    } catch (error) {
      console.error('Failed to load cached recipes:', error);
      cacheInitialized.current = true;
    }
  }, [userId]);

  // Save recipes to cache
  const saveToCache = useCallback(async (recipes: AIRecipeRecommendation[], prompt: string) => {
    if (!userId || recipes.length === 0) return;
    
    try {
      const cacheData: CachedAIRecipes = {
        recipes,
        timestamp: Date.now(),
        prompt,
        userId
      };
      
      await AsyncStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(cacheData));
      setCachedRecipes(recipes);
      setCacheTimestamp(cacheData.timestamp);
      console.log('Saved AI recipes to cache:', recipes.length, 'recipes');
    } catch (error) {
      console.error('Failed to save recipes to cache:', error);
    }
  }, [userId]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!userId) return;
    
    try {
      await AsyncStorage.removeItem(`${CACHE_KEY}_${userId}`);
      setCachedRecipes([]);
      setCacheTimestamp(null);
      console.log('Cleared AI recipe cache');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [userId]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cacheTimestamp || cachedRecipes.length === 0) return false;
    
    const now = Date.now();
    return (now - cacheTimestamp) < CACHE_DURATION;
  }, [cacheTimestamp, cachedRecipes.length]);

  // Get cache age in hours
  const getCacheAge = useCallback(() => {
    if (!cacheTimestamp) return null;
    
    const now = Date.now();
    const ageInHours = Math.floor((now - cacheTimestamp) / (60 * 60 * 1000));
    return ageInHours;
  }, [cacheTimestamp]);

  // Initialize cache on mount
  useEffect(() => {
    loadCachedRecipes();
  }, [loadCachedRecipes]);

  return {
    cachedRecipes,
    cacheTimestamp,
    loading,
    error,
    setLoading,
    setError,
    saveToCache,
    clearCache,
    isCacheValid,
    getCacheAge,
    hasCachedData: cachedRecipes.length > 0
  };
}