import { Platform } from 'react-native';

// Core type scale with semantic naming
export const Typography = {
  // Headings
  headingLarge: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  headingMedium: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  headingSmall: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 19,
  },
  
  // Labels and UI elements
  labelLarge: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  labelMedium: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};
