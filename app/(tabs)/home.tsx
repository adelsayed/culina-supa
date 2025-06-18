import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '../../lib/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import GeminiRecommendedRecipes from '../../components/GeminiRecommendedRecipes';
import TodaysMealPlan from '../../components/dashboard/TodaysMealPlan';
import QuickActions from '../../components/dashboard/QuickActions';
import QuickStats from '../../components/dashboard/QuickStats';
import AchievementBadges from '../../components/dashboard/AchievementBadges';
import SmartSuggestions from '../../components/dashboard/SmartSuggestions';
import RecentlyViewed from '../../components/dashboard/RecentlyViewed';
import {
  MealPlanSkeleton,
  StatsSkeleton,
  AchievementsSkeleton,
  SuggestionsSkeleton
} from '../../components/shared/LoadingStates';
import { ErrorState } from '../../components/shared/ErrorStates';

export default function HomeScreen() {
  const { profile } = useUserProfile();
  const { session } = useAuth();
  const router = useRouter();
  const dashboardData = useDashboardData();
  
  const currentHour = new Date().getHours();
  const baseGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  
  // Get user's name from profile or session
  const userName = profile?.displayName ||
                   profile?.username ||
                   session?.user?.email?.split('@')[0] ||
                   'there';
  
  const greeting = `${baseGreeting}, ${userName}`;

  const handleAddMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    router.push(`/(tabs)/meal-planner?addMeal=${mealType}`);
  };


  const greetingIcons = {
    morning: 'sunny-outline',
    afternoon: 'partly-sunny-outline',
    evening: 'moon-outline',
  } as const;
  const greetingIcon =
    currentHour < 12
      ? greetingIcons.morning
      : currentHour < 18
      ? greetingIcons.afternoon
      : greetingIcons.evening;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingContainer}>
                <Ionicons name={greetingIcon} size={18} color="#FEF3C7" />
                <Text style={styles.greeting}>{greeting}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Welcome to Culina</Text>
            <Text style={styles.heroSubtitle}>
              Your personal culinary journey starts here. Discover amazing recipes tailored to your taste.
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="restaurant" size={16} color="#FEF3C7" />
                <Text style={styles.statText}>AI-Powered</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color="#FEF3C7" />
                <Text style={styles.statText}>Personalized</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flash" size={16} color="#FEF3C7" />
                <Text style={styles.statText}>Quick & Easy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dashboard Components with Loading States and Error Handling */}
        {dashboardData.loading ? (
          <>
            <MealPlanSkeleton />
            <StatsSkeleton />
            <AchievementsSkeleton />
            <SuggestionsSkeleton />
          </>
        ) : dashboardData.error ? (
          <ErrorState
            message={dashboardData.error}
            onRetry={() => window.location.reload()}
            title="Dashboard Error"
          />
        ) : (
          <>
            <TodaysMealPlan
              breakfast={dashboardData.todaysMeals.breakfast}
              lunch={dashboardData.todaysMeals.lunch}
              dinner={dashboardData.todaysMeals.dinner}
              onAddMeal={handleAddMeal}
            />

            <QuickStats
              stats={dashboardData.nutritionStats}
              streak={dashboardData.streak}
              recipesCount={dashboardData.recipesCount}
            />

            <AchievementBadges />

            <SmartSuggestions />

            <RecentlyViewed />
          </>
        )}

        <QuickActions />

        <GeminiRecommendedRecipes />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingBottom: 25,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#764ba2',
    opacity: 0.8,
  },
  heroContent: {
    alignItems: 'flex-start',
    zIndex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#FEF3C7',
    marginLeft: 6,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    lineHeight: 22,
    maxWidth: '100%',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#FEF3C7',
    marginLeft: 4,
    fontWeight: '600',
  },
});