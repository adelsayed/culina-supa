import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { calculateWeightGoalProgress, getProgressMotivation, formatTimelineText, getBMIColor } from '../utils/progressTracking';
import DietaryPreferencesSection from './DietaryPreferencesSection';

interface AISettings {
  geminiApiKey: string;
  aiModel: 'gemini_2_0_flash' | 'gemini_1_5_pro' | 'gemini_1_5_flash';
  smartMealPlanningEnabled: boolean;
  smartRecommendationsEnabled: boolean;
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  if (!session || !session.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Please sign in to view your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    profile,
    loading: profileLoading,
    updateProfile,
    getHealthMetrics,
    getMacroTargets,
    isHealthProfileComplete,
    getProfileCompleteness
  } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: '',
    username: '',
    bio: '',
  });
  const [healthData, setHealthData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
    weightGoal: 'maintain' as 'maintain' | 'lose' | 'gain',
    targetWeight: '',
    dailyCalorieTarget: '',
  });

  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    geminiApiKey: '',
    aiModel: 'gemini_2_0_flash',
    smartMealPlanningEnabled: false,
    smartRecommendationsEnabled: false,
  });
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);
  const [aiSettingsSaved, setAiSettingsSaved] = useState(false);
  const [aiSettingsError, setAiSettingsError] = useState<string | null>(null);

  // Sync AI settings with profile
  React.useEffect(() => {
    if (profile) {
      setAiSettings({
        geminiApiKey: profile.geminiApiKey || '',
        aiModel: profile.aiModel || 'gemini_2_0_flash',
        smartMealPlanningEnabled: !!profile.smartMealPlanningEnabled,
        smartRecommendationsEnabled: !!profile.smartRecommendationsEnabled,
      });
    }
  }, [profile]);

  // Save AI settings handler
  const handleSaveAiSettings = async () => {
    setAiSettingsSaving(true);
    setAiSettingsError(null);
    setAiSettingsSaved(false);
    try {
      const success = await updateProfile({
        geminiApiKey: aiSettings.geminiApiKey,
        aiModel: aiSettings.aiModel as 'gemini_2_0_flash' | 'gemini_1_5_pro' | 'gemini_1_5_flash',
        smartMealPlanningEnabled: aiSettings.smartMealPlanningEnabled,
        smartRecommendationsEnabled: aiSettings.smartRecommendationsEnabled,
      });
      if (success) {
        setAiSettingsSaved(true);
        setTimeout(() => setAiSettingsSaved(false), 2000);
      } else {
        setAiSettingsError('Failed to save AI settings.');
      }
    } catch (err: any) {
      setAiSettingsError('Failed to save AI settings.');
    } finally {
      setAiSettingsSaving(false);
    }
  };

  // Always call hooks before any return
  if (!session || !session.user) {
    // Still call all hooks above, then render this fallback
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Please sign in to view your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { user } = session;

  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditedProfile({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
  }, [profile, isEditing]);

  // Pre-populate health data when modal opens
  React.useEffect(() => {
    if (showHealthModal && profile) {
      setHealthData({
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
  }, [showHealthModal, profile]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({
      displayName: profile?.displayName || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await updateProfile(editedProfile);
      if (success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({
      displayName: profile?.displayName || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError(null);
            try {
              await signOut();
            } catch (err: any) {
              setError(err.message || 'Sign out failed');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const updateSetting = async (key: string, value: any) => {
    await updateProfile({ [key]: value });
  };

  const handleSaveHealthData = async () => {
    if (!healthData.age || !healthData.weight || !healthData.height) {
      Alert.alert('Missing Information', 'Please fill in age, weight, and height.');
      return;
    }

    setLoading(true);
    try {
      // Calculate recommended calorie target if not provided
      let calculatedCalorieTarget = healthData.dailyCalorieTarget ? parseInt(healthData.dailyCalorieTarget) : undefined;
      
      if (!calculatedCalorieTarget) {
        // Calculate BMR and daily calorie needs
        const { calculateBMR, calculateDailyCalorieNeeds } = await import('../utils/healthCalculations');
        const gender = (healthData.gender === 'male' || healthData.gender === 'female') ? healthData.gender : 'male';
        const units = profile?.preferredUnits || 'metric';
        
        const bmr = calculateBMR(
          parseFloat(healthData.weight),
          parseFloat(healthData.height),
          parseInt(healthData.age),
          gender,
          units
        );
        
        let dailyCalories = calculateDailyCalorieNeeds(bmr, healthData.activityLevel);
        
        // Adjust for weight goal
        if (healthData.weightGoal === 'lose') {
          dailyCalories -= 500; // 500 calorie deficit for 1lb/week loss
        } else if (healthData.weightGoal === 'gain') {
          dailyCalories += 300; // 300 calorie surplus for gradual gain
        }
        
        calculatedCalorieTarget = dailyCalories;
      }

      const success = await updateProfile({
        age: parseInt(healthData.age),
        weight: parseFloat(healthData.weight),
        height: parseFloat(healthData.height),
        gender: healthData.gender,
        activityLevel: healthData.activityLevel,
        weightGoal: healthData.weightGoal,
        targetWeight: healthData.targetWeight ? parseFloat(healthData.targetWeight) : undefined,
        dailyCalorieTarget: calculatedCalorieTarget,
      });

      if (success) {
        setShowHealthModal(false);
        Alert.alert('Success', 'Health data and goals saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save health data.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save health data.');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Profile</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Health Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Summary</Text>
            <View style={styles.headerRight}>
              <View style={styles.completionBadge}>
                <Text style={styles.completionText}>{getProfileCompleteness()}% Complete</Text>
              </View>
              {isHealthProfileComplete() && (
                <TouchableOpacity
                  style={styles.editHealthButton}
                  onPress={() => setShowHealthModal(true)}
                >
                  <Ionicons name="create-outline" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {isHealthProfileComplete() ? (
            <View style={styles.healthSummary}>
              {(() => {
                const healthMetrics = getHealthMetrics();
                const macroTargets = getMacroTargets();
                return healthMetrics ? (
                  <>
                    <View style={styles.healthRow}>
                      <View style={styles.healthMetric}>
                        <Text style={[styles.metricValue, { color: getBMIColor(healthMetrics.bmi) }]}>
                          {healthMetrics.bmi}
                        </Text>
                        <Text style={styles.metricLabel}>BMI</Text>
                        <Text style={styles.metricCategory}>{healthMetrics.bmiCategory}</Text>
                      </View>
                      <View style={styles.healthMetric}>
                        <Text style={styles.metricValue}>{healthMetrics.dailyCalorieNeeds}</Text>
                        <Text style={styles.metricLabel}>Daily Calories</Text>
                      </View>
                      <View style={styles.healthMetric}>
                        <Text style={styles.metricValue}>{profile?.age}</Text>
                        <Text style={styles.metricLabel}>Age</Text>
                      </View>
                    </View>
                    {macroTargets && (
                      <View style={styles.macroRow}>
                        <Text style={styles.macroTitle}>Daily Macro Targets</Text>
                        <View style={styles.macroTargets}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{macroTargets.protein}g</Text>
                            <Text style={styles.macroLabel}>Protein</Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{macroTargets.carbs}g</Text>
                            <Text style={styles.macroLabel}>Carbs</Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{macroTargets.fat}g</Text>
                            <Text style={styles.macroLabel}>Fat</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {/* Goal Progress */}
                    {profile?.weightGoal && profile?.weightGoal !== 'maintain' && profile?.weight && profile?.targetWeight && (
                      (() => {
                        const progress = calculateWeightGoalProgress(
                          profile.weight,
                          profile.targetWeight,
                          profile.weightGoal
                        );
                        const motivation = getProgressMotivation(progress);
                        const timeline = formatTimelineText(progress.estimatedWeeksToGoal);
                        
                        return (
                          <View style={styles.goalRow}>
                            <Text style={styles.goalTitle}>
                              {profile.weightGoal === 'lose' ? 'Weight Loss Goal' : 'Weight Gain Goal'}
                            </Text>
                            <View style={styles.goalProgress}>
                              <View style={styles.goalStats}>
                                <Text style={styles.goalText}>
                                  Current: {profile.weight}{profile.preferredUnits === 'metric' ? 'kg' : 'lbs'}
                                </Text>
                                <Text style={styles.goalText}>
                                  Target: {profile.targetWeight}{profile.preferredUnits === 'metric' ? 'kg' : 'lbs'}
                                </Text>
                                <Text style={styles.goalRemaining}>
                                  {progress.remainingWeight.toFixed(1)}{profile.preferredUnits === 'metric' ? 'kg' : 'lbs'} to go
                                </Text>
                              </View>
                              <View style={styles.goalTimeline}>
                                <Text style={styles.goalTimelineText}>
                                  Est. {timeline} to goal
                                </Text>
                                <Text style={styles.goalMotivation}>
                                  {motivation}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })()
                    )}
                  </>
                ) : null;
              })()}
            </View>
          ) : (
            <View style={styles.incompleteHealth}>
              <Ionicons name="fitness-outline" size={48} color="#ccc" />
              <Text style={styles.incompleteTitle}>Complete Your Health Profile</Text>
              <Text style={styles.incompleteText}>
                Add your health data to get personalized meal recommendations and nutrition tracking.
              </Text>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => setShowHealthModal(true)}
              >
                <Text style={styles.completeButtonText}>Add Health Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedProfile.displayName}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, displayName: text })}
                placeholder="Enter display name"
              />
            ) : (
              <Text style={styles.value}>{profile?.displayName || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedProfile.username}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, username: text })}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{profile?.username || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedProfile.bio}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.value}>{profile?.bio || 'No bio added'}</Text>
            )}
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={profile?.pushNotificationsEnabled || false}
              onValueChange={(value) => updateSetting('pushNotificationsEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile?.pushNotificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Switch
              value={profile?.emailNotificationsEnabled || false}
              onValueChange={(value) => updateSetting('emailNotificationsEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile?.emailNotificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Public Profile</Text>
            <Switch
              value={profile?.privacyProfilePublic || false}
              onValueChange={(value) => updateSetting('privacyProfilePublic', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile?.privacyProfilePublic ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Share Usage Data</Text>
            <Switch
              value={profile?.privacyShareData || false}
              onValueChange={(value) => updateSetting('privacyShareData', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={profile?.privacyShareData ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* AI Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Settings</Text>
          
          {/* Gemini API Key Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Google Gemini API Key</Text>
            <TextInput
              style={styles.input}
              value={aiSettings.geminiApiKey}
              onChangeText={(text) => setAiSettings((prev) => ({ ...prev, geminiApiKey: text }))}
              placeholder="Enter your Gemini API key"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Model Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gemini Model</Text>
            <View style={styles.optionGrid}>
              {[
                { value: 'gemini_2_0_flash' as const, label: 'Gemini 2.0 Flash' },
                { value: 'gemini_1_5_pro' as const, label: 'Gemini 1.5 Pro' },
                { value: 'gemini_1_5_flash' as const, label: 'Gemini 1.5 Flash' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    aiSettings.aiModel === option.value && styles.selectedOption
                  ]}
                  onPress={() => setAiSettings((prev) => ({
                    ...prev,
                    aiModel: option.value
                  }))}
                >
                  <Text style={[
                    styles.optionText,
                    aiSettings.aiModel === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Smart Features */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Smart Meal Planning</Text>
            <Switch
              value={aiSettings.smartMealPlanningEnabled}
              onValueChange={(value) => setAiSettings((prev) => ({
                ...prev,
                smartMealPlanningEnabled: value
              }))}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={aiSettings.smartMealPlanningEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Smart Recommendations</Text>
            <Switch
              value={aiSettings.smartRecommendationsEnabled}
              onValueChange={(value) => setAiSettings((prev) => ({
                ...prev,
                smartRecommendationsEnabled: value
              }))}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={aiSettings.smartRecommendationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          {/* Save Button */}
          <View style={styles.saveContainer}>
            <TouchableOpacity
              style={[styles.saveButton, aiSettingsSaving && styles.saveButtonDisabled]}
              onPress={handleSaveAiSettings}
              disabled={aiSettingsSaving}
            >
              <Text style={styles.saveButtonText}>
                {aiSettingsSaving ? 'Saving...' : 'Save AI Settings'}
              </Text>
            </TouchableOpacity>
            {aiSettingsError && (
              <Text style={styles.errorText}>{aiSettingsError}</Text>
            )}
            {aiSettingsSaved && (
              <Text style={styles.successText}>AI settings saved!</Text>
            )}
          </View>
        </View>

        {/* Dietary Preferences */}
        <DietaryPreferencesSection profile={profile} updateProfile={updateProfile} />

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showHealthModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHealthModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHealthModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Health Data</Text>
            <TouchableOpacity onPress={handleSaveHealthData} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={healthData.age}
                  onChangeText={(text) => setHealthData({ ...healthData, age: text })}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Weight ({profile?.preferredUnits === 'metric' ? 'kg' : 'lbs'})</Text>
                  <TextInput
                    style={styles.input}
                    value={healthData.weight}
                    onChangeText={(text) => setHealthData({ ...healthData, weight: text })}
                    placeholder={profile?.preferredUnits === 'metric' ? '70' : '154'}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Height ({profile?.preferredUnits === 'metric' ? 'cm' : 'inches'})</Text>
                  <TextInput
                    style={styles.input}
                    value={healthData.height}
                    onChangeText={(text) => setHealthData({ ...healthData, height: text })}
                    placeholder={profile?.preferredUnits === 'metric' ? '175' : '69'}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.optionGrid}>
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        healthData.gender === option.value && styles.selectedOption
                      ]}
                      onPress={() => setHealthData({ ...healthData, gender: option.value as any })}
                    >
                      <Text style={[
                        styles.optionText,
                        healthData.gender === option.value && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Activity Level</Text>
                <View style={styles.activityOptions}>
                  {[
                    { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                    { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                    { value: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                    { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                    { value: 'extremely_active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' },
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.activityOption,
                        healthData.activityLevel === level.value && styles.selectedActivityOption
                      ]}
                      onPress={() => setHealthData({ ...healthData, activityLevel: level.value as any })}
                    >
                      <View style={styles.activityContent}>
                        <Text style={[
                          styles.activityLabel,
                          healthData.activityLevel === level.value && styles.selectedActivityLabel
                        ]}>
                          {level.label}
                        </Text>
                        <Text style={styles.activityDescription}>{level.desc}</Text>
                      </View>
                      {healthData.activityLevel === level.value && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Goals Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Health Goals</Text>
                <View style={styles.optionGrid}>
                  {[
                    { value: 'lose', label: 'Lose Weight' },
                    { value: 'maintain', label: 'Maintain Weight' },
                    { value: 'gain', label: 'Gain Weight' },
                  ].map((goal) => (
                    <TouchableOpacity
                      key={goal.value}
                      style={[
                        styles.optionButton,
                        healthData.weightGoal === goal.value && styles.selectedOption
                      ]}
                      onPress={() => setHealthData({ ...healthData, weightGoal: goal.value as any })}
                    >
                      <Text style={[
                        styles.optionText,
                        healthData.weightGoal === goal.value && styles.selectedOptionText
                      ]}>
                        {goal.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {healthData.weightGoal !== 'maintain' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Target Weight ({profile?.preferredUnits === 'metric' ? 'kg' : 'lbs'})</Text>
                  <TextInput
                    style={styles.input}
                    value={healthData.targetWeight}
                    onChangeText={(text) => setHealthData({ ...healthData, targetWeight: text })}
                    placeholder="Enter target weight"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Daily Calorie Target (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={healthData.dailyCalorieTarget}
                  onChangeText={(text) => setHealthData({ ...healthData, dailyCalorieTarget: text })}
                  placeholder="Leave blank for automatic calculation"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  We'll calculate this based on your data if left blank
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
  value: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveContainer: {
    marginTop: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 180,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 18,
    marginBottom: 10,
  },
  // Health Summary Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  healthSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  healthMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricCategory: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  macroRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  macroTargets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  incompleteHealth: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  incompleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  incompleteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  activityOptions: {
    gap: 8,
  },
  activityOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
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
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  goalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 16,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  goalProgress: {
    gap: 12,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 14,
    color: '#666',
  },
  goalRemaining: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  goalTimeline: {
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 8,
  },
  goalTimelineText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  goalMotivation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editHealthButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
  },
});