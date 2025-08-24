import { colors } from '../tokens/colors';

export const lightTheme = {
  name: 'light',
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    
    card: colors.neutral[100],
    cardForeground: colors.neutral[900],
    
    popover: colors.neutral[50],
    popoverForeground: colors.neutral[900],
    
    primary: colors.brand[600],
    primaryForeground: colors.neutral[50],
    
    secondary: colors.neutral[200],
    secondaryForeground: colors.neutral[900],
    
    muted: colors.neutral[200],
    mutedForeground: colors.neutral[600],
    
    accent: colors.neutral[200],
    accentForeground: colors.neutral[900],
    
    destructive: colors.error[600],
    destructiveForeground: colors.neutral[50],
    
    border: colors.neutral[300],
    input: colors.neutral[300],
    ring: colors.brand[600],
    
    success: colors.success[600],
    warning: colors.warning[600],
    error: colors.error[600],
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;

export const darkTheme = {
  name: 'dark',
  colors: {
    background: colors.neutral[950],
    foreground: colors.neutral[50],
    
    card: colors.neutral[900],
    cardForeground: colors.neutral[50],
    
    popover: colors.neutral[950],
    popoverForeground: colors.neutral[50],
    
    primary: colors.brand[500],
    primaryForeground: colors.neutral[950],
    
    secondary: colors.neutral[800],
    secondaryForeground: colors.neutral[50],
    
    muted: colors.neutral[800],
    mutedForeground: colors.neutral[400],
    
    accent: colors.neutral[800],
    accentForeground: colors.neutral[50],
    
    destructive: colors.error[500],
    destructiveForeground: colors.neutral[50],
    
    border: colors.neutral[700],
    input: colors.neutral[700],
    ring: colors.brand[500],
    
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
  },
} as const;

export type Theme = typeof lightTheme;