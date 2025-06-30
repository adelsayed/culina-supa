import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getWeekStartDate, 
  getWeekDates, 
  formatDateForDisplay, 
  isToday,
  navigateWeek,
  formatDateForAPI 
} from '../utils/dateUtils';
import { getAmplifyClient } from '../lib/amplify';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'expo-router';
import type { Schema } from '../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];
type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

interface MealPlanDatePickerProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
}

const MealPlanDatePicker: React.FC<MealPlanDatePickerProps> = ({
  visible,
  onClose,
  recipe,
}) => {
  const { session } = useAuth();
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStartDate(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [servings, setServings] = useState(1);
  const [adding, setAdding] = useState(false);

  const weekDates = getWeekDates(currentWeekStart);

  const mealTypes = [
    { type: 'breakfast' as MealType, name: 'Breakfast', time: '8:00 AM', color: '#FFE4B5' },
    { type: 'snack1' as MealType, name: 'Morning Snack', time: '10:30 AM', color: '#E6F3FF' },
    { type: 'lunch' as MealType, name: 'Lunch', time: '12:30 PM', color: '#F0FFF0' },
    { type: 'snack2' as MealType, name: 'Afternoon Snack', time: '3:30 PM', color: '#FFF0F5' },
    { type: 'dinner' as MealType, name: 'Dinner', time: '7:00 PM', color: '#F5F5DC' },
  ];

  const navigateToPrevWeek = () => {
    setCurrentWeekStart(navigateWeek(currentWeekStart, 'prev'));
  };

  const navigateToNextWeek = () => {
    setCurrentWeekStart(navigateWeek(currentWeekStart, 'next'));
  };

  const handleAddToMealPlan = async () => {
    if (!selectedDate || !selectedMealType || !session?.user?.id) return;

    setAdding(true);
    try {
      const client = getAmplifyClient();
      const plannedCalories = recipe.calories ? recipe.calories * servings : undefined;

      await client.models.MealPlanEntry.create({
        userId: session.user.id,
        date: formatDateForAPI(selectedDate),
        mealType: selectedMealType,
        recipeId: recipe.id,
        servings,
        plannedCalories,
      });

      // Navigate to meal planner and close modal
      router.replace('/(tabs)/meal-planner');
      onClose();
    } catch (error) {
      console.error('Error adding to meal plan:', error);
      Alert.alert('Error', 'Failed to add recipe to meal plan. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedMealType(null);
    setServings(1);
    onClose();
  };

  const canAdd = selectedDate && selectedMealType && !adding;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add to Meal Plan</Text>
            <Text style={styles.headerSubtitle}>{recipe.name}</Text>
          </View>
          
          <TouchableOpacity
            onPress={handleAddToMealPlan}
            disabled={!canAdd}
            style={[styles.addButton, !canAdd && styles.disabledButton]}
          >
            <Text style={[styles.addButtonText, !canAdd && styles.disabledText]}>
              {adding ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Week Navigation */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity onPress={navigateToPrevWeek} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <Text style={styles.weekTitle}>
              {currentWeekStart.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            
            <TouchableOpacity onPress={navigateToNextWeek} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.dateGrid}>
              {weekDates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateItem,
                    isToday(date) && styles.todayDate,
                    selectedDate?.toDateString() === date.toDateString() && styles.selectedDate,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayName,
                    isToday(date) && styles.todayText,
                    selectedDate?.toDateString() === date.toDateString() && styles.selectedText,
                  ]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isToday(date) && styles.todayText,
                    selectedDate?.toDateString() === date.toDateString() && styles.selectedText,
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Meal</Text>
            <View style={styles.mealTypeGrid}>
              {mealTypes.map((meal) => (
                <TouchableOpacity
                  key={meal.type}
                  style={[
                    styles.mealTypeItem,
                    { backgroundColor: meal.color },
                    selectedMealType === meal.type && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType(meal.type)}
                >
                  <Text style={styles.mealTypeName}>{meal.name}</Text>
                  <Text style={styles.mealTypeTime}>{meal.time}</Text>
                  {selectedMealType === meal.type && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Servings Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servings</Text>
            <View style={styles.servingsContainer}>
              <TouchableOpacity
                onPress={() => setServings(Math.max(0.5, servings - 0.5))}
                style={styles.servingsButton}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <Text style={styles.servingsValue}>{String(servings)}</Text>
              
              <TouchableOpacity
                onPress={() => setServings(servings + 0.5)}
                style={styles.servingsButton}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            {recipe.calories && (
              <Text style={styles.caloriesText}>
                {String(Math.round(recipe.calories * servings))} calories
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    padding: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 44,
  },
  todayDate: {
    backgroundColor: '#007AFF',
  },
  selectedDate: {
    backgroundColor: '#E3F2FD',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  todayText: {
    color: '#fff',
  },
  selectedText: {
    color: '#007AFF',
  },
  mealTypeGrid: {
    gap: 12,
  },
  mealTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMealType: {
    borderColor: '#34C759',
  },
  mealTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealTypeTime: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  servingsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
    minWidth: 30,
    textAlign: 'center',
  },
  caloriesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MealPlanDatePicker;