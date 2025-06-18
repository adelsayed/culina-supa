import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { Achievement } from '../../utils/achievementSystem';
import { useAchievements } from '../../hooks/useAchievements';

const AchievementBadge: React.FC<{
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}> = ({ achievement, size = 'medium', showTitle = true }) => {
  const sizeConfig = {
    small: { container: 40, icon: 16, fontSize: 10 },
    medium: { container: 48, icon: 20, fontSize: 12 },
    large: { container: 64, icon: 28, fontSize: 14 },
  };

  const config = sizeConfig[size];
  const opacity = achievement.isUnlocked ? 1 : 0.3;

  return (
    <View style={[styles.badgeContainer, { opacity }]}>
      <View style={[
        styles.badge,
        {
          width: config.container,
          height: config.container,
          backgroundColor: achievement.isUnlocked ? `${achievement.color}15` : Colors.surfaceSecondary,
          borderColor: achievement.isUnlocked ? achievement.color : Colors.borderLight,
        }
      ]}>
        <Ionicons 
          name={achievement.icon as any} 
          size={config.icon} 
          color={achievement.isUnlocked ? achievement.color : Colors.textTertiary} 
        />
      </View>
      {showTitle && (
        <Text style={[
          styles.badgeTitle,
          { fontSize: config.fontSize, color: achievement.isUnlocked ? Colors.textPrimary : Colors.textTertiary }
        ]}>
          {achievement.title}
        </Text>
      )}
    </View>
  );
};

const AchievementNotification: React.FC<{
  achievement: Achievement;
  visible: boolean;
  onDismiss: () => void;
}> = ({ achievement, visible, onDismiss }) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        dismissNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.notificationContainer,
      {
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
      }
    ]}>
      <TouchableOpacity 
        style={styles.notification}
        onPress={dismissNotification}
        activeOpacity={0.9}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationBadge, { backgroundColor: `${achievement.color}15` }]}>
            <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
          </View>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Achievement Unlocked!</Text>
            <Text style={styles.notificationSubtitle}>{achievement.title}</Text>
            <Text style={styles.notificationDescription}>{achievement.description}</Text>
            <Text style={styles.notificationPoints}>+{achievement.points} points</Text>
          </View>
        </View>
        <View style={styles.notificationClose}>
          <Ionicons name="close" size={16} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AchievementBadges() {
  const {
    achievements,
    newAchievements,
    clearNewAchievements,
    getRecentAchievements,
    getNextAchievementProgress,
    totalPoints,
    unlockedCount,
    totalCount,
  } = useAchievements();

  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Achievement | null>(null);

  const recentAchievements = getRecentAchievements(7);
  const nextProgress = getNextAchievementProgress();

  // Show notification for new achievements
  useEffect(() => {
    if (newAchievements.length > 0 && !currentNotification) {
      setCurrentNotification(newAchievements[0]);
    }
  }, [newAchievements, currentNotification]);

  const handleNotificationDismiss = () => {
    setCurrentNotification(null);
    clearNewAchievements();
  };

  const handleViewAll = () => {
    setShowModal(true);
  };

  if (recentAchievements.length === 0 && !nextProgress.achievement) {
    return null; // Don't show section if no achievements
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>
              {unlockedCount} of {totalCount} unlocked • {totalPoints} points
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Unlocks</Text>
            <View style={styles.badgeGrid}>
              {recentAchievements.slice(0, 4).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="medium"
                  showTitle={false}
                />
              ))}
            </View>
          </View>
        )}

        {/* Next Achievement Progress */}
        {nextProgress.achievement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            <View style={styles.progressCard}>
              <AchievementBadge
                achievement={nextProgress.achievement}
                size="small"
                showTitle={false}
              />
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>{nextProgress.achievement.title}</Text>
                <Text style={styles.progressDescription}>
                  {nextProgress.achievement.description}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${nextProgress.progress}%`,
                        backgroundColor: nextProgress.achievement.color,
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {nextProgress.remaining} remaining
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={currentNotification!}
        visible={!!currentNotification}
        onDismiss={handleNotificationDismiss}
      />

      {/* All Achievements Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Achievements</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalStats}>
              <Text style={styles.modalStatsText}>
                {unlockedCount} of {totalCount} achievements • {totalPoints} total points
              </Text>
            </View>
            
            <View style={styles.allBadgesGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.modalBadgeItem}>
                  <AchievementBadge
                    achievement={achievement}
                    size="large"
                    showTitle={true}
                  />
                  <Text style={styles.modalBadgeDescription}>
                    {achievement.description}
                  </Text>
                  <Text style={styles.modalBadgePoints}>
                    {achievement.points} points • {achievement.rarity}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  badgeContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTitle: {
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    maxWidth: 60,
  },
  progressCard: {
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
  progressTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  progressDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  
  // Notification styles
  notificationContainer: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  notificationSubtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  notificationDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  notificationPoints: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  notificationClose: {
    padding: Spacing.sm,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  modalStats: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  modalStatsText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  allBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  modalBadgeItem: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  modalBadgeDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalBadgePoints: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});