// src/lib/theme-loader.ts
import { prisma } from './prisma';
import { THEME_PRESETS, ThemeOption } from './themes';

export async function getThemeSettings() {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      return null;
    }
    
    // If using a preset theme, get colors from theme
    if (settings.theme !== 'custom' && settings.theme in THEME_PRESETS) {
      const themeColors = THEME_PRESETS[settings.theme as ThemeOption];
      
      return {
        ...settings,
        ...themeColors
      };
    }
    
    return settings;
  } catch (error) {
    console.error('Failed to load theme settings:', error);
    return null;
  }
}