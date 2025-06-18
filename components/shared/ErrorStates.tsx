import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  icon = 'alert-circle-outline',
  style,
}) => (
  <View style={[styles.errorContainer, style]}>
    <View style={styles.errorIcon}>
      <Ionicons name={icon as any} size={48} color={Colors.error} />
    </View>
    <Text style={styles.errorTitle}>{title}</Text>
    <Text style={styles.errorMessage}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh" size={16} color={Colors.surface} />
        <Text style={styles.retryText}>{retryText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface NetworkErrorProps {
  onRetry?: () => void;
  style?: any;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, style }) => (
  <ErrorState
    title="Connection Problem"
    message="Please check your internet connection and try again."
    onRetry={onRetry}
    icon="wifi-outline"
    style={style}
  />
);

interface EmptyStateProps {
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message,
  actionText,
  onAction,
  icon = 'document-outline',
  style,
}) => (
  <View style={[styles.emptyContainer, style]}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon as any} size={48} color={Colors.textTertiary} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {onAction && actionText && (
      <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
        <Text style={styles.actionText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  style?: any;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, onDismiss, style }) => (
  <View style={[styles.inlineError, style]}>
    <View style={styles.inlineErrorContent}>
      <Ionicons name="warning" size={16} color={Colors.error} />
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
    {onDismiss && (
      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Ionicons name="close" size={16} color={Colors.error} />
      </TouchableOpacity>
    )}
  </View>
);

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 4000,
}) => {
  React.useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const config = {
    success: { icon: 'checkmark-circle', color: Colors.success },
    error: { icon: 'close-circle', color: Colors.error },
    warning: { icon: 'warning', color: Colors.warning },
    info: { icon: 'information-circle', color: Colors.primary },
  };

  const { icon, color } = config[type];

  return (
    <View style={[styles.toast, { borderLeftColor: color }]}>
      <View style={styles.toastContent}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.toastText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.toastDismiss}>
        <Ionicons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
    margin: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  errorIcon: {
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  retryText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
    margin: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  actionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.error}10`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  inlineErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  inlineErrorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    flex: 1,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  
  toast: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    zIndex: 1000,
    ...Shadows.lg,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  toastText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  toastDismiss: {
    padding: Spacing.xs,
  },
});