/**
 * Progress tracking utilities for health goals
 */

export interface WeightGoalProgress {
  currentWeight: number;
  targetWeight: number;
  remainingWeight: number;
  progressPercentage: number;
  estimatedWeeksToGoal: number;
  recommendedWeeklyChange: number;
  goalType: 'lose' | 'gain';
}

/**
 * Calculate weight goal progress and timeline
 */
export const calculateWeightGoalProgress = (
  currentWeight: number,
  targetWeight: number,
  goalType: 'lose' | 'gain'
): WeightGoalProgress => {
  const remainingWeight = Math.abs(targetWeight - currentWeight);
  
  // Calculate progress percentage
  const totalWeightChange = goalType === 'lose' 
    ? currentWeight > targetWeight ? currentWeight - targetWeight : 0
    : targetWeight > currentWeight ? targetWeight - currentWeight : 0;
    
  const progressPercentage = totalWeightChange > 0 
    ? Math.max(0, (totalWeightChange - remainingWeight) / totalWeightChange * 100)
    : 0;

  // Safe weekly weight change rates (kg)
  const recommendedWeeklyChange = goalType === 'lose' ? 0.5 : 0.25; // 0.5kg loss or 0.25kg gain per week
  
  // Estimate weeks to goal
  const estimatedWeeksToGoal = Math.ceil(remainingWeight / recommendedWeeklyChange);

  return {
    currentWeight,
    targetWeight,
    remainingWeight,
    progressPercentage: Math.round(progressPercentage),
    estimatedWeeksToGoal,
    recommendedWeeklyChange,
    goalType
  };
};

/**
 * Get motivational message based on progress
 */
export const getProgressMotivation = (progress: WeightGoalProgress): string => {
  const { progressPercentage, goalType, estimatedWeeksToGoal } = progress;
  
  if (progressPercentage === 0) {
    return `Ready to start your ${goalType === 'lose' ? 'weight loss' : 'weight gain'} journey!`;
  }
  
  if (progressPercentage < 25) {
    return `Great start! You're ${progressPercentage}% of the way there.`;
  }
  
  if (progressPercentage < 50) {
    return `You're making good progress! ${progressPercentage}% complete.`;
  }
  
  if (progressPercentage < 75) {
    return `Excellent work! You're over halfway there at ${progressPercentage}%.`;
  }
  
  if (progressPercentage < 100) {
    return `Almost there! ${progressPercentage}% complete - keep it up!`;
  }
  
  return 'Congratulations! You\'ve reached your goal! 🎉';
};

/**
 * Calculate daily calorie adjustment for weight goal
 */
export const calculateCalorieAdjustment = (goalType: 'lose' | 'gain' | 'maintain'): number => {
  switch (goalType) {
    case 'lose':
      return -500; // 500 calorie deficit for ~1 lb/week loss
    case 'gain':
      return 300; // 300 calorie surplus for gradual gain
    default:
      return 0; // No adjustment for maintenance
  }
};

/**
 * Format timeline text for display
 */
export const formatTimelineText = (weeks: number): string => {
  if (weeks <= 4) {
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  
  const months = Math.round(weeks / 4);
  if (months <= 12) {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  
  const years = Math.round(months / 12);
  return `${years} year${years > 1 ? 's' : ''}`;
};

/**
 * Get BMI category color for visual feedback
 */
export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return '#FF9500'; // Orange for underweight
  if (bmi < 25) return '#34C759'; // Green for normal
  if (bmi < 30) return '#FF9500'; // Orange for overweight
  return '#FF3B30'; // Red for obese
};

/**
 * Get goal status badge text and color
 */
export const getGoalStatusBadge = (progress: WeightGoalProgress): { text: string; color: string } => {
  const { progressPercentage, estimatedWeeksToGoal } = progress;
  
  if (progressPercentage >= 100) {
    return { text: 'Goal Achieved!', color: '#34C759' };
  }
  
  if (progressPercentage === 0) {
    return { text: 'Getting Started', color: '#007AFF' };
  }
  
  if (estimatedWeeksToGoal <= 4) {
    return { text: 'Almost There!', color: '#FF9500' };
  }
  
  return { text: 'In Progress', color: '#007AFF' };
};