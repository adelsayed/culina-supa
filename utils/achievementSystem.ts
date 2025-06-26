export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'cooking' | 'planning' | 'ai' | 'social' | 'health';
  requirement: {
    type: 'count' | 'streak' | 'milestone' | 'first_time';
    target: number;
    metric: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // First-time achievements
  {
    id: 'first_recipe',
    title: 'Chef in the Making',
    description: 'Create your first recipe',
    icon: 'restaurant',
    color: '#10B981',
    category: 'cooking',
    requirement: { type: 'first_time', target: 1, metric: 'recipes_created' },
    rarity: 'common',
    points: 10,
    isUnlocked: false,
  },
  {
    id: 'first_ai_recipe',
    title: 'AI Pioneer',
    description: 'Add your first AI-generated recipe',
    icon: 'sparkles',
    color: '#8B5CF6',
    category: 'ai',
    requirement: { type: 'first_time', target: 1, metric: 'ai_recipes_added' },
    rarity: 'common',
    points: 15,
    isUnlocked: false,
  },
  {
    id: 'first_meal_plan',
    title: 'Planning Ahead',
    description: 'Plan your first meal',
    icon: 'calendar',
    color: '#3B82F6',
    category: 'planning',
    requirement: { type: 'first_time', target: 1, metric: 'meals_planned' },
    rarity: 'common',
    points: 10,
    isUnlocked: false,
  },

  // Count-based achievements
  {
    id: 'recipe_collector_5',
    title: 'Recipe Collector',
    description: 'Create 5 recipes',
    icon: 'library',
    color: '#F59E0B',
    category: 'cooking',
    requirement: { type: 'count', target: 5, metric: 'recipes_created' },
    rarity: 'common',
    points: 25,
    isUnlocked: false,
  },
  {
    id: 'recipe_master_10',
    title: 'Recipe Master',
    description: 'Create 10 recipes',
    icon: 'trophy',
    color: '#EF4444',
    category: 'cooking',
    requirement: { type: 'count', target: 10, metric: 'recipes_created' },
    rarity: 'rare',
    points: 50,
    isUnlocked: false,
  },
  {
    id: 'culinary_expert_25',
    title: 'Culinary Expert',
    description: 'Create 25 recipes',
    icon: 'medal',
    color: '#7C3AED',
    category: 'cooking',
    requirement: { type: 'count', target: 25, metric: 'recipes_created' },
    rarity: 'epic',
    points: 100,
    isUnlocked: false,
  },

  // Streak-based achievements
  {
    id: 'consistent_planner_3',
    title: 'Consistent Planner',
    description: 'Plan meals for 3 days in a row',
    icon: 'flame',
    color: '#F97316',
    category: 'planning',
    requirement: { type: 'streak', target: 3, metric: 'daily_planning_streak' },
    rarity: 'common',
    points: 20,
    isUnlocked: false,
  },
  {
    id: 'weekly_warrior_7',
    title: 'Weekly Warrior',
    description: 'Plan meals for 7 days in a row',
    icon: 'flame',
    color: '#DC2626',
    category: 'planning',
    requirement: { type: 'streak', target: 7, metric: 'daily_planning_streak' },
    rarity: 'rare',
    points: 75,
    isUnlocked: false,
  },
  {
    id: 'planning_legend_30',
    title: 'Planning Legend',
    description: 'Plan meals for 30 days in a row',
    icon: 'bonfire',
    color: '#991B1B',
    category: 'planning',
    requirement: { type: 'streak', target: 30, metric: 'daily_planning_streak' },
    rarity: 'legendary',
    points: 250,
    isUnlocked: false,
  },

  // AI-related achievements
  {
    id: 'ai_enthusiast_5',
    title: 'AI Enthusiast',
    description: 'Use AI suggestions 5 times',
    icon: 'bulb',
    color: '#06B6D4',
    category: 'ai',
    requirement: { type: 'count', target: 5, metric: 'ai_suggestions_used' },
    rarity: 'common',
    points: 30,
    isUnlocked: false,
  },
  {
    id: 'ai_master_20',
    title: 'AI Master',
    description: 'Use AI suggestions 20 times',
    icon: 'flash',
    color: '#8B5CF6',
    category: 'ai',
    requirement: { type: 'count', target: 20, metric: 'ai_suggestions_used' },
    rarity: 'rare',
    points: 100,
    isUnlocked: false,
  },

  // Health-related achievements
  {
    id: 'healthy_week',
    title: 'Healthy Week',
    description: 'Meet your nutrition goals for 7 days',
    icon: 'fitness',
    color: '#10B981',
    category: 'health',
    requirement: { type: 'streak', target: 7, metric: 'nutrition_goals_met' },
    rarity: 'rare',
    points: 80,
    isUnlocked: false,
  },
  {
    id: 'balanced_eater',
    title: 'Balanced Eater',
    description: 'Hit your macro targets 10 times',
    icon: 'nutrition',
    color: '#059669',
    category: 'health',
    requirement: { type: 'count', target: 10, metric: 'macro_targets_hit' },
    rarity: 'rare',
    points: 60,
    isUnlocked: false,
  },

  // Milestone achievements
  {
    id: 'full_week_planned',
    title: 'Week Planner',
    description: 'Plan all meals for a complete week',
    icon: 'calendar-clear',
    color: '#3B82F6',
    category: 'planning',
    requirement: { type: 'milestone', target: 1, metric: 'complete_weeks_planned' },
    rarity: 'rare',
    points: 75,
    isUnlocked: false,
  },
  {
    id: 'recipe_sharer',
    title: 'Recipe Sharer',
    description: 'Share your first recipe',
    icon: 'share',
    color: '#EC4899',
    category: 'social',
    requirement: { type: 'first_time', target: 1, metric: 'recipes_shared' },
    rarity: 'common',
    points: 20,
    isUnlocked: false,
  },
];

export interface UserStats {
  recipes_created: number;
  ai_recipes_added: number;
  meals_planned: number;
  daily_planning_streak: number;
  ai_suggestions_used: number;
  nutrition_goals_met: number;
  macro_targets_hit: number;
  complete_weeks_planned: number;
  recipes_shared: number;
  total_points: number;
}

export class AchievementManager {
  static checkAchievements(userStats: UserStats, currentAchievements: Achievement[]): {
    newlyUnlocked: Achievement[];
    updatedAchievements: Achievement[];
  } {
    const updatedAchievements = [...currentAchievements];
    const newlyUnlocked: Achievement[] = [];

    ACHIEVEMENTS.forEach((achievement, index) => {
      const current = updatedAchievements[index];
      if (current?.isUnlocked) return; // Already unlocked

      const isUnlocked = this.isAchievementUnlocked(achievement, userStats);
      
      if (isUnlocked) {
        const unlockedAchievement = {
          ...achievement,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        };
        
        updatedAchievements[index] = unlockedAchievement;
        newlyUnlocked.push(unlockedAchievement);
      }
    });

    return { newlyUnlocked, updatedAchievements };
  }

  private static isAchievementUnlocked(achievement: Achievement, userStats: UserStats): boolean {
    const { type, target, metric } = achievement.requirement;
    const currentValue = userStats[metric as keyof UserStats] || 0;

    switch (type) {
      case 'count':
      case 'streak':
      case 'milestone':
        return currentValue >= target;
      case 'first_time':
        return currentValue >= 1;
      default:
        return false;
    }
  }

  static getTotalPoints(achievements: Achievement[]): number {
    return achievements
      .filter(a => a.isUnlocked)
      .reduce((total, a) => total + a.points, 0);
  }

  static getProgressToNextAchievement(userStats: UserStats, achievements: Achievement[]): {
    achievement: Achievement | null;
    progress: number;
    remaining: number;
  } {
    const lockedAchievements = achievements.filter(a => !a.isUnlocked);
    
    if (lockedAchievements.length === 0) {
      return { achievement: null, progress: 100, remaining: 0 };
    }

    // Find the closest achievement to unlock
    let closestAchievement: Achievement | null = null;
    let bestProgress = 0;

    lockedAchievements.forEach(achievement => {
      const { target, metric } = achievement.requirement;
      const currentValue = userStats[metric as keyof UserStats] || 0;
      const progress = Math.min((currentValue / target) * 100, 100);

      if (progress > bestProgress) {
        bestProgress = progress;
        closestAchievement = achievement;
      }
    });

    if (!closestAchievement) {
      return { achievement: null, progress: 100, remaining: 0 };
    }

    // Type assertion to fix TypeScript issue
    const achievement = closestAchievement as Achievement;
    const requirement = achievement.requirement;
    const currentValue = userStats[requirement.metric as keyof UserStats] || 0;
    const remaining = Math.max(requirement.target - currentValue, 0);

    return {
      achievement,
      progress: bestProgress,
      remaining,
    };
  }

  static getAchievementsByCategory(achievements: Achievement[], category: Achievement['category']): Achievement[] {
    return achievements.filter(a => a.category === category);
  }

  static getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
    return achievements.filter(a => a.isUnlocked);
  }

  static getRecentAchievements(achievements: Achievement[], days: number = 7): Achievement[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return achievements
      .filter(a => a.isUnlocked && a.unlockedAt)
      .filter(a => new Date(a.unlockedAt!) > cutoff)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime());
  }
}