import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/DesignSystem';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.borderLight, Colors.surfaceSecondary],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.cardSkeleton, style]}>
    <View style={styles.cardHeader}>
      <Skeleton width={120} height={16} />
      <Skeleton width={60} height={12} />
    </View>
    <View style={styles.cardContent}>
      <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={12} />
    </View>
  </View>
);

export const MealPlanSkeleton: React.FC = () => (
  <View style={styles.mealPlanSkeleton}>
    <View style={styles.mealPlanHeader}>
      <Skeleton width={150} height={20} />
      <Skeleton width={80} height={16} />
    </View>
    <View style={styles.mealsList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.mealItem}>
          <Skeleton width={40} height={40} borderRadius={8} />
          <View style={styles.mealInfo}>
            <Skeleton width={100} height={14} style={{ marginBottom: 4 }} />
            <Skeleton width={150} height={12} />
          </View>
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  </View>
);

export const StatsSkeleton: React.FC = () => (
  <View style={styles.statsSkeleton}>
    <View style={styles.statsHeader}>
      <Skeleton width={140} height={20} />
      <Skeleton width={70} height={16} />
    </View>
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statItem}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
          <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

export const AchievementsSkeleton: React.FC = () => (
  <View style={styles.achievementsSkeleton}>
    <View style={styles.achievementsHeader}>
      <Skeleton width={120} height={20} />
      <Skeleton width={100} height={16} />
    </View>
    <View style={styles.badgesList}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.badgeItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
    <View style={styles.progressSection}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.progressInfo}>
        <Skeleton width={120} height={14} style={{ marginBottom: 4 }} />
        <Skeleton width={180} height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={4} borderRadius={2} />
      </View>
    </View>
  </View>
);

export const SuggestionsSkeleton: React.FC = () => (
  <View style={styles.suggestionsSkeleton}>
    <View style={styles.suggestionsHeader}>
      <Skeleton width={140} height={20} />
      <Skeleton width={200} height={16} />
    </View>
    <View style={styles.suggestionsList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Skeleton width={36} height={36} borderRadius={8} />
            <Skeleton width={60} height={12} />
          </View>
          <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={12} style={{ marginBottom: 12 }} />
          <Skeleton width={100} height={24} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  cardContent: {
    gap: Spacing.sm,
  },
  
  mealPlanSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  mealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mealsList: {
    gap: Spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  mealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  
  statsSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  
  achievementsSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  badgesList: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  badgeItem: {
    alignItems: 'center',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  progressInfo: {
    flex: 1,
  },
  
  suggestionsSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  suggestionCard: {
    width: 280,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.borderLight,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});