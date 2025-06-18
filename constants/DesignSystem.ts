export const Colors = {
  // Primary colors
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#8B5CF6',
  warning: '#F59E0B',
  error: '#EF4444',
  success: '#10B981',
  danger: '#EF4444', // Alias for error

  // Surface colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',

  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Border colors
  border: '#E5E7EB', // Default border color
  borderLight: '#E5E7EB',
  borderMedium: '#D1D5DB',
  borderDark: '#9CA3AF',
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 20,
    normal: 24,
    relaxed: 28,
  },
};

// Component styles for backward compatibility - defined after all constants
export const ComponentStyles = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12, // BorderRadius.lg
    padding: 16, // Spacing.lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    paddingVertical: 12, // Spacing.md
    paddingHorizontal: 16, // Spacing.lg
    borderRadius: 8, // BorderRadius.md
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8, // BorderRadius.md
    padding: 12, // Spacing.md
    fontSize: 16, // Typography.sizes.base
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
};