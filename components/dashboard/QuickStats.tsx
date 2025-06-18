import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';

interface NutritionStats {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

interface QuickStatsProps {
  stats?: NutritionStats;
  streak?: number;
  recipesCount?: number;
}

const ProgressCircle: React.FC<{
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  children: React.ReactNode;
}> = ({ percentage, size, strokeWidth, color, children }) => {
  // Simple circular progress indicator without SVG for React Native compatibility
  const radius = (size - strokeWidth) / 2;
  
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: Colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }}>
      <View style={{
        width: size - strokeWidth,
        height: size - strokeWidth,
        borderRadius: (size - strokeWidth) / 2,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {children}
      </View>
      {/* Progress indicator */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: percentage > 75 ? color : percentage > 50 ? Colors.warning : Colors.borderLight,
        opacity: percentage > 0 ? 0.8 : 0.3,
      }} />
    </View>
  );
};

export default function QuickStats({ stats, streak = 0, recipesCount = 0 }: QuickStatsProps) {
  const router = useRouter();

  const caloriePercentage = stats ? Math.min((stats.calories.current / stats.calories.target) * 100, 100) : 0;
  const proteinPercentage = stats ? Math.min((stats.protein.current / stats.protein.target) * 100, 100) : 0;

  const handleViewProfile = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Progress</Text>
        <TouchableOpacity style={styles.viewButton} onPress={handleViewProfile}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {/* Calories Progress */}
        <View style={styles.statCard}>
          <ProgressCircle
            percentage={caloriePercentage}
            size={60}
            strokeWidth={4}
            color={Colors.primary}
          >
            <Text style={styles.progressValue}>
              {stats?.calories.current || 0}
            </Text>
          </ProgressCircle>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statTarget}>
            / {stats?.calories.target || 2000}
          </Text>
        </View>

        {/* Protein Progress */}
        <View style={styles.statCard}>
          <ProgressCircle
            percentage={proteinPercentage}
            size={60}
            strokeWidth={4}
            color={Colors.secondary}
          >
            <Text style={styles.progressValue}>
              {stats?.protein.current || 0}g
            </Text>
          </ProgressCircle>
          <Text style={styles.statLabel}>Protein</Text>
          <Text style={styles.statTarget}>
            / {stats?.protein.target || 150}g
          </Text>
        </View>

        {/* Streak */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${Colors.warning}15` }]}>
            <Ionicons name="flash" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* Recipes Count */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${Colors.accent}15` }]}>
            <Ionicons name="restaurant" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.statValue}>{recipesCount}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  viewButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  statTarget: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});