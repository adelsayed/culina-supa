import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function QuickActions() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'add-recipe',
      title: 'Add Recipe',
      subtitle: 'Create new recipe',
      icon: 'add-circle',
      color: Colors.primary,
      onPress: () => router.push('/recipes/add'),
    },
    {
      id: 'meal-planner',
      title: 'Plan Meals',
      subtitle: 'Weekly planner',
      icon: 'calendar',
      color: Colors.secondary,
      onPress: () => router.push('/(tabs)/meal-planner'),
    },
    {
      id: 'shopping-list',
      title: 'Shopping',
      subtitle: 'Generate list',
      icon: 'basket',
      color: Colors.accent,
      onPress: () => router.push('/(tabs)/shopping-list'),
    },
    {
      id: 'browse-recipes',
      title: 'Browse',
      subtitle: 'Find recipes',
      icon: 'search',
      color: Colors.warning,
      onPress: () => router.push('/(tabs)/recipes'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { backgroundColor: `${action.color}08` }]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});