/**
 * Date utility functions for meal planning
 */

export type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

/**
 * Get the start of the week (Monday) for a given date
 */
export const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get the end of the week (Sunday) for a given date
 */
export const getWeekEndDate = (date: Date): Date => {
  const weekStart = getWeekStartDate(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};

/**
 * Get all dates in a week
 */
export const getWeekDates = (weekStartDate: Date): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/**
 * Format date for display (e.g., "Mon, Jan 15")
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateForAPI(date1) === formatDateForAPI(date2);
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

/**
 * Get the next occurrence of a specific day of the week
 */
export const getNextDayOfWeek = (dayOfWeek: number, fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const currentDay = date.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysUntilTarget);
  return date;
};

/**
 * Get meal type display name
 */
export const getMealTypeDisplayName = (mealType: MealType): string => {
  const displayNames: Record<MealType, string> = {
    breakfast: 'Breakfast',
    snack1: 'Morning Snack',
    lunch: 'Lunch',
    snack2: 'Afternoon Snack',
    dinner: 'Dinner',
  };
  return displayNames[mealType];
};

/**
 * Get meal type order for sorting
 */
export const getMealTypeOrder = (mealType: MealType): number => {
  const order: Record<MealType, number> = {
    breakfast: 1,
    snack1: 2,
    lunch: 3,
    snack2: 4,
    dinner: 5,
  };
  return order[mealType];
};

/**
 * Get suggested meal times
 */
export const getMealTime = (mealType: MealType): string => {
  const times: Record<MealType, string> = {
    breakfast: '8:00 AM',
    snack1: '10:30 AM',
    lunch: '12:30 PM',
    snack2: '3:30 PM',
    dinner: '7:00 PM',
  };
  return times[mealType];
};

/**
 * Generate date range for meal planning
 */
export const generateDateRange = (startDate: Date, days: number): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/**
 * Get week number of the year
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Get month and year display string
 */
export const getMonthYearDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Navigate to previous/next week
 */
export const navigateWeek = (currentDate: Date, direction: 'prev' | 'next'): Date => {
  const newDate = new Date(currentDate);
  const daysToAdd = direction === 'next' ? 7 : -7;
  newDate.setDate(currentDate.getDate() + daysToAdd);
  return newDate;
};

/**
 * Get relative date description (Today, Tomorrow, Yesterday, etc.)
 */
export const getRelativeDateDescription = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return formatDateForDisplay(date);
  }
};