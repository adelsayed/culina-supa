import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../lib/AuthContext';
import { getAmplifyClient } from '../lib/amplify';
import { 
  Achievement, 
  UserStats, 
  AchievementManager, 
  ACHIEVEMENTS 
} from '../utils/achievementSystem';

const ACHIEVEMENTS_STORAGE_KEY = 'user_achievements';
const STATS_STORAGE_KEY = 'user_stats';

export function useAchievements() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [userStats, setUserStats] = useState<UserStats>({
    recipes_created: 0,
    ai_recipes_added: 0,
    meals_planned: 0,
    daily_planning_streak: 0,
    ai_suggestions_used: 0,
    nutrition_goals_met: 0,
    macro_targets_hit: 0,
    complete_weeks_planned: 0,
    recipes_shared: 0,
    total_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Load achievements and stats from storage
  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const userId = session.user.id;
      
      // Load achievements
      const storedAchievements = await AsyncStorage.getItem(`${ACHIEVEMENTS_STORAGE_KEY}_${userId}`);
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }

      // Load user stats
      const storedStats = await AsyncStorage.getItem(`${STATS_STORAGE_KEY}_${userId}`);
      if (storedStats) {
        setUserStats(JSON.parse(storedStats));
      } else {
        // Calculate initial stats from database
        await calculateInitialStats(userId);
      }
    } catch (error) {
      console.error('Error loading achievement data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Calculate initial stats from database
  const calculateInitialStats = async (userId: string) => {
    try {
      const client = getAmplifyClient();
      // Fetch recipe count
      const { data: recipes } = await client.models.Recipe.list({
        filter: { userId: { eq: userId } },
      });
      // Fetch meal plan count
      const { data: mealEntries } = await client.models.MealPlanEntry.list({
        filter: { userId: { eq: userId } },
      });

      const initialStats: UserStats = {
        recipes_created: recipes?.length || 0,
        ai_recipes_added: recipes?.filter(r => r.name?.includes('AI') || r.name?.includes('Generated')).length || 0,
        meals_planned: mealEntries?.length || 0,
        daily_planning_streak: 5, // Mock streak for demo
        ai_suggestions_used: 0,
        nutrition_goals_met: 0,
        macro_targets_hit: 0,
        complete_weeks_planned: 0,
        recipes_shared: 0,
        total_points: 0,
      };

      setUserStats(initialStats);
      await saveStats(initialStats);
    } catch (error) {
      console.error('Error calculating initial stats:', error);
    }
  };

  // Save achievements to storage
  const saveAchievements = async (achievementsToSave: Achievement[]) => {
    if (!session?.user?.id) return;
    
    try {
      await AsyncStorage.setItem(
        `${ACHIEVEMENTS_STORAGE_KEY}_${session.user.id}`,
        JSON.stringify(achievementsToSave)
      );
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  // Save stats to storage
  const saveStats = async (statsToSave: UserStats) => {
    if (!session?.user?.id) return;
    
    try {
      await AsyncStorage.setItem(
        `${STATS_STORAGE_KEY}_${session.user.id}`,
        JSON.stringify(statsToSave)
      );
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  // Update a specific stat and check for new achievements
  const updateStat = useCallback(async (stat: keyof UserStats, value: number) => {
    const newStats = { ...userStats, [stat]: value };
    setUserStats(newStats);
    await saveStats(newStats);

    // Check for new achievements
    const { newlyUnlocked, updatedAchievements } = AchievementManager.checkAchievements(
      newStats,
      achievements
    );

    if (newlyUnlocked.length > 0) {
      setAchievements(updatedAchievements);
      setNewAchievements(newlyUnlocked);
      await saveAchievements(updatedAchievements);
    }

    return newlyUnlocked;
  }, [userStats, achievements]);

  // Increment a stat by 1
  const incrementStat = useCallback(async (stat: keyof UserStats) => {
    return await updateStat(stat, (userStats[stat] || 0) + 1);
  }, [userStats, updateStat]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Get progress to next achievement
  const getNextAchievementProgress = useCallback(() => {
    return AchievementManager.getProgressToNextAchievement(userStats, achievements);
  }, [userStats, achievements]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: Achievement['category']) => {
    return AchievementManager.getAchievementsByCategory(achievements, category);
  }, [achievements]);

  // Get unlocked achievements
  const getUnlockedAchievements = useCallback(() => {
    return AchievementManager.getUnlockedAchievements(achievements);
  }, [achievements]);

  // Get recent achievements
  const getRecentAchievements = useCallback((days: number = 7) => {
    return AchievementManager.getRecentAchievements(achievements, days);
  }, [achievements]);

  // Get total points
  const getTotalPoints = useCallback(() => {
    return AchievementManager.getTotalPoints(achievements);
  }, [achievements]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    achievements,
    userStats,
    loading,
    newAchievements,
    
    // Actions
    updateStat,
    incrementStat,
    clearNewAchievements,
    
    // Getters
    getNextAchievementProgress,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getRecentAchievements,
    getTotalPoints,
    
    // Calculated values
    totalPoints: getTotalPoints(),
    unlockedCount: getUnlockedAchievements().length,
    totalCount: achievements.length,
  };
}