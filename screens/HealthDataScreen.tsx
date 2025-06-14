import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';
import { getActivityLevelDescription } from '../utils/healthCalculations';

const HealthDataScreen: React.FC = () => {
  const { profile, updateProfile, getHealthMetrics } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
    weightGoal: 'maintain' as 'maintain' | 'lose' | 'gain',
    targetWeight: '',
    dailyCalorieTarget: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age?.toString() || '',
        weight: profile.weight?.toString() || '',
        height: profile.height?.toString() || '',
        gender: profile.gender || 'prefer_not_to_say',
        activityLevel: profile.activityLevel || 'moderately_active',
        weightGoal: profile.weightGoal || 'maintain',
        targetWeight: profile.targetWeight?.toString() || '',
        dailyCalorieTarget: profile.dailyCalorieTarget?.toString() || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    // Validation
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Missing Information', 'Please fill in age, weight, and height.');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        weightGoal: formData.weightGoal,
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
        dailyCalorieTarget: formData.dailyCalorieTarget ? parseInt(formData.dailyCalorieTarget) : undefined,
      };

      const success = await updateProfile(updates);
      if (success) {
        Alert.alert('Success', 'Health data updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update health data.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update health data.');
    } finally {
      setLoading(false);
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'lightly_active', label: 'Lightly Active' },
    { value: 'moderately_active', label: 'Moderately Active' },
    { value: 'very_active', label: 'Very Active' },
    { value: 'extremely_active', label: 'Extremely Active' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const weightGoals = [
    { value: 'lose', label: 'Lose Weight' },
    { value: 'maintain', label: 'Maintain Weight' },
    { value: 'gain', label: 'Gain Weight' },
  ];

  const units = profile?.preferredUnits || 'metric';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health Data</Text>
          <Text style={styles.headerSubtitle}>
            Help us personalize your nutrition recommendations
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionGrid}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.gender === option.value && styles.selectedOption
                  ]}
                  onPress={() => setFormData({ ...formData, gender: option.value as any })}
                >
                  <Text style={[
                    styles.optionText,
                    formData.gender === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Weight ({units === 'metric' ? 'kg' : 'lbs'})</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                placeholder={units === 'metric' ? '70' : '154'}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Height ({units === 'metric' ? 'cm' : 'inches'})</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
                placeholder={units === 'metric' ? '175' : '69'}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <Text style={styles.sectionDescription}>
            How active are you during a typical week?
          </Text>
          
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.activityOption,
                formData.activityLevel === level.value && styles.selectedActivityOption
              ]}
              onPress={() => setFormData({ ...formData, activityLevel: level.value as any })}
            >
              <View style={styles.activityContent}>
                <Text style={[
                  styles.activityLabel,
                  formData.activityLevel === level.value && styles.selectedActivityLabel
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.activityDescription}>
                  {getActivityLevelDescription(level.value as any)}
                </Text>
              </View>
              {formData.activityLevel === level.value && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Goals</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight Goal</Text>
            <View style={styles.optionGrid}>
              {weightGoals.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.optionButton,
                    formData.weightGoal === goal.value && styles.selectedOption
                  ]}
                  onPress={() => setFormData({ ...formData, weightGoal: goal.value as any })}
                >
                  <Text style={[
                    styles.optionText,
                    formData.weightGoal === goal.value && styles.selectedOptionText
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.weightGoal !== 'maintain' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Weight ({units === 'metric' ? 'kg' : 'lbs'})</Text>
              <TextInput
                style={styles.input}
                value={formData.targetWeight}
                onChangeText={(text) => setFormData({ ...formData, targetWeight: text })}
                placeholder="Enter target weight"
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Calorie Target (optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.dailyCalorieTarget}
              onChangeText={(text) => setFormData({ ...formData, dailyCalorieTarget: text })}
              placeholder="Leave blank for automatic calculation"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Health Preview */}
        {formData.age && formData.weight && formData.height && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewText}>
                This will help us calculate your BMI, daily calorie needs, and create personalized meal recommendations.
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Health Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  activityOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedActivityOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedActivityLabel: {
    color: '#007AFF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveContainer: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HealthDataScreen;