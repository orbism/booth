// src/context/ThemeContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';

// Define the theme types
export type ThemeOption = 'midnight' | 'pastel' | 'bw' | 'custom';

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonColor: string;
  textColor: string;
}

export const THEMES: Record<Exclude<ThemeOption, 'custom'>, ThemeColors> = {
  midnight: {
    primaryColor: '#5b21b6', // purple-800
    secondaryColor: '#7c3aed', // purple-600
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#c026d3', // fuchsia-600
    buttonColor: '#fbbf24', // amber-400
    textColor: '#f8fafc' // slate-50
  },
  pastel: {
    primaryColor: '#60a5fa', // blue-400
    secondaryColor: '#a78bfa', // violet-400
    backgroundColor: '#f0f9ff', // sky-50
    borderColor: '#f9a8d4', // pink-300
    buttonColor: '#34d399', // emerald-400
    textColor: '#1e293b' // slate-800
  },
  bw: {
    primaryColor: '#000000',
    secondaryColor: '#4b5563', // gray-600
    backgroundColor: '#f0e6d2', // even brighter beige for main background
    borderColor: '#d1d5db', // gray-300
    buttonColor: '#111827', // gray-900
    textColor: '#111827' // gray-900
  }
};

interface ThemeContextProps {
  currentTheme: ThemeOption;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonColor: string;
  textColor: string;
  setTheme: (theme: ThemeOption) => void;
  handleThemeChange: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme: ThemeOption;
  currentColors: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    borderColor: string;
    buttonColor: string;
    textColor: string;
  };
  onThemeChange: (theme: ThemeOption, colors: ThemeColors) => void;
}

export function ThemeProvider({
  children,
  initialTheme,
  currentColors,
  onThemeChange
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = React.useState<ThemeOption>(initialTheme);
  
  // Apply theme when changed
  const handleThemeChange = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    
    if (theme !== 'custom') {
      const themeColors = THEMES[theme];
      onThemeChange(theme, themeColors);
    }
  };
  
  const value = {
    currentTheme,
    primaryColor: currentColors.primaryColor,
    secondaryColor: currentColors.secondaryColor,
    backgroundColor: currentColors.backgroundColor,
    borderColor: currentColors.borderColor,
    buttonColor: currentColors.buttonColor,
    textColor: currentColors.textColor,
    setTheme: setCurrentTheme,
    handleThemeChange
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}