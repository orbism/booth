// src/lib/themes.ts

// Define theme types
export type ThemeOption = 'midnight' | 'pastel' | 'bw' | 'custom';

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonColor: string;
  textColor: string;
  companyName?: string;
  companyLogo?: string | null;
}

// Predefined themes
export const THEME_PRESETS: Record<ThemeOption, ThemeColors> = {
  midnight: {
    primaryColor: '#5b21b6', // purple-800
    secondaryColor: '#7c3aed', // purple-600
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#c026d3', // fuchsia-600
    buttonColor: '#fbbf24', // amber-400
    textColor: '#f8fafc', // slate-50
    companyName: undefined,
    companyLogo: null
  },
  pastel: {
    primaryColor: '#60a5fa', // blue-400
    secondaryColor: '#a78bfa', // violet-400
    backgroundColor: '#f0f9ff', // sky-50
    borderColor: '#f9a8d4', // pink-300
    buttonColor: '#34d399', // emerald-400
    textColor: '#1e293b', // slate-800
    companyName: undefined,
    companyLogo: null
  },
  bw: {
    primaryColor: '#000000',
    secondaryColor: '#4b5563', // gray-600
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db', // gray-300
    buttonColor: '#111827', // gray-900
    textColor: '#111827', // gray-900
    companyName: undefined,
    companyLogo: null
  },
  custom: {
    primaryColor: '#3B82F6', // blue-500
    secondaryColor: '#1E40AF', // blue-800
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb', // gray-200
    buttonColor: '#3B82F6', // blue-500
    textColor: '#111827', // gray-900
    companyName: undefined,
    companyLogo: null
  }
};

/**
 * Get theme colors based on selected theme or custom colors
 */
export function getThemeColors(
  theme: ThemeOption,
  customColors?: Partial<ThemeColors>
): ThemeColors {
  // If theme is custom and customColors are provided, merge with default custom theme
  if (theme === 'custom' && customColors) {
    return {
      ...THEME_PRESETS.custom,
      ...customColors
    };
  }
  
  // Otherwise return the selected theme preset
  return THEME_PRESETS[theme];
}

/**
 * Generate CSS variables for the selected theme
 */
export function generateThemeStyles(
  theme: ThemeOption,
  customColors?: Partial<ThemeColors>
): string {
  const colors = getThemeColors(theme, customColors);
  
  return `
    :root {
      --color-primary: ${colors.primaryColor};
      --color-secondary: ${colors.secondaryColor};
      --color-background: ${colors.backgroundColor};
      --color-border: ${colors.borderColor};
      --color-button: ${colors.buttonColor};
      --color-text: ${colors.textColor};
    }
  `;
}