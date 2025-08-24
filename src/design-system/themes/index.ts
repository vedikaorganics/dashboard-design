export * from './default';

export const themes = {
  light: 'light',
  dark: 'dark',
} as const;

export type ThemeName = keyof typeof themes;