/**
 * Health and nutrition calculation utilities
 */

export interface HealthMetrics {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  dailyCalorieNeeds: number;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate BMI (Body Mass Index)
 */
export const calculateBMI = (weight: number, height: number, units: 'metric' | 'imperial'): { bmi: number; category: string } => {
  let bmi: number;
  
  if (units === 'metric') {
    // weight in kg, height in cm
    const heightInMeters = height / 100;
    bmi = weight / (heightInMeters * heightInMeters);
  } else {
    // weight in lbs, height in inches
    bmi = (weight / (height * height)) * 703;
  }

  const category = getBMICategory(bmi);
  
  return {
    bmi: Math.round(bmi * 10) / 10, // Round to 1 decimal place
    category
  };
};

/**
 * Get BMI category based on BMI value
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  units: 'metric' | 'imperial'
): number => {
  let weightKg: number;
  let heightCm: number;

  if (units === 'metric') {
    weightKg = weight;
    heightCm = height;
  } else {
    // Convert from imperial
    weightKg = weight * 0.453592; // lbs to kg
    heightCm = height * 2.54; // inches to cm
  }

  let bmr: number;
  
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  return Math.round(bmr);
};

/**
 * Calculate daily calorie needs based on activity level
 */
export const calculateDailyCalorieNeeds = (
  bmr: number,
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
): number => {
  const activityMultipliers = {
    sedentary: 1.2,          // Little or no exercise
    lightly_active: 1.375,   // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725,      // Hard exercise 6-7 days/week
    extremely_active: 1.9    // Very hard exercise, physical job
  };

  const multiplier = activityMultipliers[activityLevel];
  return Math.round(bmr * multiplier);
};

/**
 * Calculate macro targets based on calorie goal and weight goal
 */
export const calculateMacroTargets = (
  dailyCalories: number,
  weightGoal: 'maintain' | 'lose' | 'gain',
  bodyWeight: number, // in kg (convert if needed)
  units: 'metric' | 'imperial'
): MacroTargets => {
  const weightKg = units === 'metric' ? bodyWeight : bodyWeight * 0.453592;

  let proteinRatio: number;
  let fatRatio: number;
  let carbRatio: number;

  switch (weightGoal) {
    case 'lose':
      // Higher protein for muscle preservation during weight loss
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25;     // 25% fat
      carbRatio = 0.45;    // 45% carbs
      break;
    case 'gain':
      // Balanced macros for weight gain
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30;     // 30% fat
      carbRatio = 0.45;    // 45% carbs
      break;
    default: // maintain
      // Balanced macros for maintenance
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.25;     // 25% fat
      carbRatio = 0.50;    // 50% carbs
  }

  // Calculate grams for each macro
  const proteinCalories = dailyCalories * proteinRatio;
  const fatCalories = dailyCalories * fatRatio;
  const carbCalories = dailyCalories * carbRatio;

  return {
    protein: Math.round(proteinCalories / 4), // 4 calories per gram
    carbs: Math.round(carbCalories / 4),      // 4 calories per gram
    fat: Math.round(fatCalories / 9)          // 9 calories per gram
  };
};

/**
 * Calculate target weight loss/gain timeline
 */
export const calculateTargetTimeline = (
  currentWeight: number,
  targetWeight: number,
  weightGoal: 'lose' | 'gain'
): { weeksToGoal: number; weeklyChange: number } => {
  const weightDifference = Math.abs(targetWeight - currentWeight);
  
  // Safe weight change rates (per week)
  const safeWeeklyLoss = 0.5; // kg per week (about 1 lb)
  const safeWeeklyGain = 0.25; // kg per week (about 0.5 lb)
  
  const weeklyChange = weightGoal === 'lose' ? safeWeeklyLoss : safeWeeklyGain;
  const weeksToGoal = Math.ceil(weightDifference / weeklyChange);
  
  return {
    weeksToGoal,
    weeklyChange
  };
};

/**
 * Get activity level description
 */
export const getActivityLevelDescription = (
  level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
): string => {
  const descriptions = {
    sedentary: 'Little or no exercise, desk job',
    lightly_active: 'Light exercise 1-3 days per week',
    moderately_active: 'Moderate exercise 3-5 days per week',
    very_active: 'Hard exercise 6-7 days per week',
    extremely_active: 'Very hard exercise, physical job, or training twice a day'
  };
  
  return descriptions[level];
};

/**
 * Calculate all health metrics at once
 */
export const calculateHealthMetrics = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
  units: 'metric' | 'imperial'
): HealthMetrics => {
  const { bmi, category } = calculateBMI(weight, height, units);
  const bmr = calculateBMR(weight, height, age, gender, units);
  const dailyCalorieNeeds = calculateDailyCalorieNeeds(bmr, activityLevel);

  return {
    bmi,
    bmiCategory: category,
    bmr,
    dailyCalorieNeeds
  };
};