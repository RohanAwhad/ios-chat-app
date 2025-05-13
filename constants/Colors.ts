/**
 * Enhanced color palette with richer dark theme and better contrasts
 */

// Light theme colors
const tintColorLight = '#0a7ea4';

// Dark theme colors - richer palette with signature teal accent
const tintColorDark = '#2DD4BF';  // Vibrant teal accent
const darkBackground = '#0F172A';  // Deep blue-black
const darkSurface = '#1E293B';    // Slightly lighter surface
const darkBorder = '#334155';     // Subtle border color
const darkText = '#F1F5F9';       // Crisp white text with slight blue tint

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#F8FAFC',
    border: '#E2E8F0',
    userBubble: '#E6F7FF',
    aiBubble: '#F1F5F9',
  },
  dark: {
    text: darkText,
    background: darkBackground,
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
    surface: darkSurface,
    border: darkBorder,
    userBubble: '#0D9488',  // Brighter teal for better contrast
    aiBubble: '#8EADC2',    // Lighter slate for better readability

  },
};

