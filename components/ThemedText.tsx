import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Typography } from '@/constants/Typography';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'headingLarge' | 'headingMedium' | 
         'headingSmall' | 'labelLarge' | 'labelMedium' | 'labelSmall' | 'link' | 
         'default' | 'title' | 'defaultSemiBold' | 'subtitle'; // Keep old types for backward compatibility
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'bodyMedium',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles[type] || Typography.bodyMedium,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // New typography styles
  bodyLarge: Typography.bodyLarge,
  bodyMedium: Typography.bodyMedium,
  bodySmall: Typography.bodySmall,
  headingLarge: Typography.headingLarge,
  headingMedium: Typography.headingMedium,
  headingSmall: Typography.headingSmall,
  labelLarge: Typography.labelLarge,
  labelMedium: Typography.labelMedium,
  labelSmall: Typography.labelSmall,
  link: {
    ...Typography.bodyMedium,
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  
  // Backward compatibility
  default: Typography.bodyMedium,
  defaultSemiBold: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  title: Typography.headingLarge,
  subtitle: Typography.headingSmall,
});

