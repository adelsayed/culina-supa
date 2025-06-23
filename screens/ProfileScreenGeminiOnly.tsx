console.log('LOADED: ProfileScreenGeminiOnly.tsx');
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
import { Colors, Typography, Spacing, BorderRadius, Shadows, ComponentStyles } from '../constants/DesignSystem';

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

  React.useEffect(() => {
    if (profile) {
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
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!editedProfile.displayName.trim() || !editedProfile.username.trim()) {
      setError('Display name and username are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await updateProfile({
        displayName: editedProfile.displayName.trim(),
        username: editedProfile.username.trim(),
        bio: editedProfile.bio.trim(),
      });

      if (success) {
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHealthData = async () => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        age: healthData.age ? parseInt(healthData.age) : null,
        weight: healthData.weight ? parseFloat(healthData.weight) : null,
        height: healthData.height ? parseFloat(healthData.height) : null,
        gender: healthData.gender,
        activityLevel: healthData.activityLevel,
        weightGoal: healthData.weightGoal,
        targetWeight: healthData.targetWeight ? parseFloat(healthData.targetWeight) : null,
        dailyCalorieTarget: healthData.dailyCalorieTarget ? parseInt(healthData.dailyCalorieTarget) : null,
      };

      const success = await updateProfile(updateData);

      if (success) {
        setShowHealthModal(false);
        Alert.alert('Success', 'Health profile updated successfully!');
      } else {
        setError('Failed to update health profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
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
          onPress: () => signOut(),
        },
      ]
    );
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completenessPercentage = getProfileCompleteness();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={80} color="#007AFF" />
          </View>
          
          {!isEditing ? (
            <>
              <Text style={styles.displayName}>{profile.displayName || 'No name set'}</Text>
              <Text style={styles.username}>@{profile.username || 'No username'}</Text>
              <Text style={styles.bio}>{profile.bio || 'No bio set'}</Text>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={16} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                value={editedProfile.displayName}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, displayName: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={editedProfile.username}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Bio"
                value={editedProfile.bio}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={3}
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Profile Completeness */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Completeness</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completenessPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{completenessPercentage}% complete</Text>
        </View>

        {/* Health Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Overview</Text>
            <TouchableOpacity
              style={styles.editHealthButton}
              onPress={() => setShowHealthModal(true)}
            >
              <Ionicons name="fitness" size={16} color="#007AFF" />
              <Text style={styles.editHealthButtonText}>Edit Health Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.incompleteHealth}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.incompleteHealthText}>
              Complete your health profile to see personalized metrics and recommendations.
            </Text>
          </View>
        </View>

        {/* Dietary Preferences */}
        <DietaryPreferencesSection />

        {/* AI Settings */}
        <View style={styles.aiSection}>
          <View style={styles.aiSectionHeader}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
            </View>
            <View style={styles.aiHeaderText}>
              <Text style={styles.aiSectionTitle}>AI Settings</Text>
              <Text style={styles.aiSectionSubtitle}>Configure Google Gemini AI features</Text>
            </View>
          </View>
          
          <View style={styles.aiCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.aiLabel}>
                <Ionicons name="key" size={16} color={Colors.textSecondary} />
                {' '}Google Gemini API Key
              </Text>
              <TextInput
                style={styles.aiInput}
                value={aiSettings.geminiApiKey}
                onChangeText={(text) => setAiSettings((prev) => ({ ...prev, geminiApiKey: text }))}
                placeholder="Enter your Gemini API key"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>Get your free API key from Google AI Studio</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.aiLabel}>
                <Ionicons name="settings" size={16} color={Colors.textSecondary} />
                {' '}AI Model Selection
              </Text>
              <View style={styles.aiModelGrid}>
                {[
                  {
                    value: 'gemini_2_0_flash',
                    label: 'Gemini 2.0 Flash',
                    subtitle: 'Latest & fastest',
                    recommended: true
                  },
                  {
                    value: 'gemini_1_5_pro',
                    label: 'Gemini 1.5 Pro',
                    subtitle: 'More detailed responses',
                    recommended: false
                  },
                  {
                    value: 'gemini_1_5_flash',
                    label: 'Gemini 1.5 Flash',
                    subtitle: 'Quick responses',
                    recommended: false
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.aiModelOption,
                      aiSettings.aiModel === option.value && styles.selectedAiModel
                    ]}
                    onPress={() => setAiSettings((prev) => ({ ...prev, aiModel: option.value }))}
                  >
                    <View style={styles.modelOptionContent}>
                      <Text style={[
                        styles.modelOptionTitle,
                        aiSettings.aiModel === option.value && styles.selectedModelTitle
                      ]}>
                        {option.label}
                        {option.recommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>RECOMMENDED</Text>
                          </View>
                        )}
                      </Text>
                      <Text style={[
                        styles.modelOptionSubtitle,
                        aiSettings.aiModel === option.value && styles.selectedModelSubtitle
                      ]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    {aiSettings.aiModel === option.value && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.aiFeatureSection}>
              <Text style={styles.aiLabel}>
                <Ionicons name="flash" size={16} color={Colors.textSecondary} />
                {' '}Smart Features
              </Text>
              
              <View style={styles.aiSwitchContainer}>
                <View style={styles.aiSwitchItem}>
                  <View style={styles.switchContent}>
                    <View style={styles.switchIconContainer}>
                      <Ionicons name="calendar" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.switchTextContainer}>
                      <Text style={styles.aiSwitchLabel}>Smart Meal Planning</Text>
                      <Text style={styles.aiSwitchDescription}>AI-powered meal suggestions based on your preferences</Text>
                    </View>
                  </View>
                  <Switch
                    value={aiSettings.smartMealPlanningEnabled}
                    onValueChange={(value) => setAiSettings((prev) => ({ ...prev, smartMealPlanningEnabled: value }))}
                    trackColor={{ false: Colors.borderLight, true: `${Colors.primary}40` }}
                    thumbColor={aiSettings.smartMealPlanningEnabled ? Colors.primary : Colors.surface}
                    ios_backgroundColor={Colors.borderLight}
                  />
                </View>

                <View style={styles.aiSwitchDivider} />

                <View style={styles.aiSwitchItem}>
                  <View style={styles.switchContent}>
                    <View style={styles.switchIconContainer}>
                      <Ionicons name="star" size={20} color={Colors.secondary} />
                    </View>
                    <View style={styles.switchTextContainer}>
                      <Text style={styles.aiSwitchLabel}>Smart Recipe Recommendations</Text>
                      <Text style={styles.aiSwitchDescription}>Personalized recipe suggestions tailored to you</Text>
                    </View>
                  </View>
                  <Switch
                    value={aiSettings.smartRecommendationsEnabled}
                    onValueChange={(value) => setAiSettings((prev) => ({ ...prev, smartRecommendationsEnabled: value }))}
                    trackColor={{ false: Colors.borderLight, true: `${Colors.secondary}40` }}
                    thumbColor={aiSettings.smartRecommendationsEnabled ? Colors.secondary : Colors.surface}
                    ios_backgroundColor={Colors.borderLight}
                  />
                </View>
              </View>
            </View>

            {aiSettingsError && (
              <View style={styles.aiErrorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.danger} />
                <Text style={styles.aiErrorText}>{aiSettingsError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.aiSaveButton,
                { opacity: aiSettingsSaving ? 0.8 : 1 },
                aiSettingsSaved && styles.aiSaveButtonSuccess
              ]}
              onPress={handleSaveAiSettings}
              disabled={aiSettingsSaving}
            >
              <View style={styles.saveButtonContent}>
                {aiSettingsSaving ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : aiSettingsSaved ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.surface} />
                    <Text style={styles.aiSaveButtonText}>Settings Saved!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save" size={20} color={Colors.surface} />
                    <Text style={styles.aiSaveButtonText}>Save AI Settings</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Health Data Modal */}
      <Modal
        visible={showHealthModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHealthModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Health Profile</Text>
            <TouchableOpacity onPress={handleUpdateHealthData} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={healthData.age}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, age: text }))}
                placeholder="Enter your age"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={healthData.weight}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, weight: text }))}
                placeholder="Enter your weight"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={healthData.height}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, height: text }))}
                placeholder="Enter your height"
                keyboardType="numeric"
              />
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
                    onPress={() => setHealthData(prev => ({ ...prev, gender: option.value as any }))}
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
              <View style={styles.optionGrid}>
                {[
                  { value: 'sedentary', label: 'Sedentary' },
                  { value: 'lightly_active', label: 'Lightly Active' },
                  { value: 'moderately_active', label: 'Moderately Active' },
                  { value: 'very_active', label: 'Very Active' },
                  { value: 'extremely_active', label: 'Extremely Active' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      healthData.activityLevel === option.value && styles.selectedOption
                    ]}
                    onPress={() => setHealthData(prev => ({ ...prev, activityLevel: option.value as any }))}
                  >
                    <Text style={[
                      styles.optionText,
                      healthData.activityLevel === option.value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight Goal</Text>
              <View style={styles.optionGrid}>
                {[
                  { value: 'maintain', label: 'Maintain' },
                  { value: 'lose', label: 'Lose Weight' },
                  { value: 'gain', label: 'Gain Weight' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      healthData.weightGoal === option.value && styles.selectedOption
                    ]}
                    onPress={() => setHealthData(prev => ({ ...prev, weightGoal: option.value as any }))}
                  >
                    <Text style={[
                      styles.optionText,
                      healthData.weightGoal === option.value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {healthData.weightGoal !== 'maintain' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={healthData.targetWeight}
                  onChangeText={(text) => setHealthData(prev => ({ ...prev, targetWeight: text }))}
                  placeholder="Enter your target weight"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Calorie Target</Text>
              <TextInput
                style={styles.input}
                value={healthData.dailyCalorieTarget}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, dailyCalorieTarget: text }))}
                placeholder="Enter daily calorie target"
                keyboardType="numeric"
              />
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
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  editHealthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editHealthButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  missingFieldsText: {
    color: '#FF3B30',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  healthMetrics: {
    marginTop: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  weightProgress: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  weightProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  weightProgressText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
  },
  motivationalText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  timelineText: {
    fontSize: 12,
    color: '#666',
  },
  macroTargets: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  incompleteHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
  },
  incompleteHealthText: {
    flex: 1,
    marginLeft: 10,
    color: '#007AFF',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: Spacing['3xl'],
  },
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  selectedOptionText: {
    color: Colors.surface,
  },
  switchGroup: {
    marginBottom: Spacing['3xl'],
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  switchLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  // New AI Settings Styles
  aiSection: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    overflow: 'hidden',
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: `${Colors.primary}08`,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiSectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  aiSectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  aiCard: {
    padding: Spacing['2xl'],
  },
  aiLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiInput: {
    ...ComponentStyles.input,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  aiModelGrid: {
    gap: Spacing.md,
  },
  aiModelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  selectedAiModel: {
    backgroundColor: `${Colors.primary}08`,
    borderColor: Colors.primary,
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedModelTitle: {
    color: Colors.primary,
  },
  modelOptionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  selectedModelSubtitle: {
    color: Colors.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
  },
  aiFeatureSection: {
    marginTop: Spacing['2xl'],
  },
  aiSwitchContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  aiSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  switchTextContainer: {
    flex: 1,
  },
  aiSwitchLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  aiSwitchDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  aiSwitchDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  aiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.danger}10`,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  aiErrorText: {
    flex: 1,
    marginLeft: Spacing.md,
    color: Colors.danger,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  aiSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing['2xl'],
    ...Shadows.md,
  },
  aiSaveButtonSuccess: {
    backgroundColor: Colors.success,
  },
  saveButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSaveButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSave: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});