import { useState, useEffect, useCallback } from 'react';
import { amplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';
import { calculateHealthMetrics, calculateMacroTargets, type HealthMetrics, type MacroTargets } from '../utils/healthCalculations';

type UserProfile = Schema['UserProfile']['type'];

export const useUserProfile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data: profiles } = await amplifyClient.models.UserProfile.list({
        filter: { userId: { eq: session.user.id } }
      });

      if (profiles && profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        // Create default profile if none exists
        const defaultProfile = await createDefaultProfile();
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Create default profile
  const createDefaultProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!session?.user?.id) return null;

    try {
      const { data: newProfile } = await amplifyClient.models.UserProfile.create({
        userId: session.user.id,
        username: session.user.email?.split('@')[0] || 'user',
        displayName: session.user.user_metadata?.full_name || 'User',
        // Settings
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        privacyProfilePublic: false,
        privacyShareData: false,
        // Preferences
        preferredUnits: 'metric',
        theme: 'system',
        language: 'en',
        // AI Settings - defaults to disabled
        aiModel: 'gpt35turbo',
        aiFeaturesEnabled: false,
        smartMealPlanningEnabled: false,
        smartRecommendationsEnabled: false,
      });

      return newProfile;
    } catch (err) {
      console.error('Error creating default profile:', err);
      return null;
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => {
    if (!profile?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const { data: updatedProfile } = await amplifyClient.models.UserProfile.update({
        id: profile.id,
        ...updates
      });

      if (updatedProfile) {
        setProfile(updatedProfile);
        return true;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }

    return false;
  }, [profile?.id]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    if (!profile?.id) return false;

    try {
      await amplifyClient.models.UserProfile.delete({ id: profile.id });
      setProfile(null);
      return true;
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
      return false;
    }
  }, [profile?.id]);

  // Load profile when component mounts or user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Calculate health metrics based on current profile data
  const getHealthMetrics = useCallback((): HealthMetrics | null => {
    if (!profile?.weight || !profile?.height || !profile?.age || !profile?.gender || !profile?.activityLevel) {
      return null;
    }

    // Convert gender for health calculations - default to 'male' for non-binary options
    const calculationGender = (profile.gender === 'male' || profile.gender === 'female')
      ? profile.gender
      : 'male'; // Default for 'other' and 'prefer_not_to_say'

    return calculateHealthMetrics(
      profile.weight,
      profile.height,
      profile.age,
      calculationGender,
      profile.activityLevel,
      profile.preferredUnits || 'metric'
    );
  }, [profile]);

  // Calculate macro targets based on health data and goals
  const getMacroTargets = useCallback((): MacroTargets | null => {
    if (!profile?.weight || !profile?.dailyCalorieTarget || !profile?.weightGoal) {
      return null;
    }

    return calculateMacroTargets(
      profile.dailyCalorieTarget,
      profile.weightGoal,
      profile.weight,
      profile.preferredUnits || 'metric'
    );
  }, [profile]);

  // Check if health profile is complete
  const isHealthProfileComplete = useCallback((): boolean => {
    return !!(
      profile?.age &&
      profile?.weight &&
      profile?.height &&
      profile?.gender &&
      profile?.activityLevel
    );
  }, [profile]);

  // Get completion percentage of profile
  const getProfileCompleteness = useCallback((): number => {
    if (!profile) return 0;

    const requiredFields = [
      'username', 'displayName', 'age', 'weight', 'height',
      'gender', 'activityLevel', 'weightGoal', 'dailyCalorieTarget'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [profile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    deleteProfile,
    refreshProfile: loadProfile,
    // Health calculation utilities
    getHealthMetrics,
    getMacroTargets,
    isHealthProfileComplete,
    getProfileCompleteness,
  };
};