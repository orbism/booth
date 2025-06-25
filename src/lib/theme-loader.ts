// src/lib/theme-loader.ts
import { prisma } from './prisma';
import { THEME_PRESETS, ThemeOption, ThemeColors } from './themes';

/**
 * Get theme settings from the database and apply theme presets if applicable
 */
export async function getThemeSettings(): Promise<ThemeColors | null> {
    try {
      const settings = await prisma.settings.findFirst();

      // console.log('Theme settings loaded from DB:', {
      //   theme: settings?.theme,
      //   primaryColor: settings?.primaryColor,
      //   secondaryColor: settings?.secondaryColor,
      //   backgroundColor: settings?.backgroundColor,
      //   borderColor: settings?.borderColor,
      //   buttonColor: settings?.buttonColor,
      //   textColor: settings?.textColor
      // });
      
      if (!settings) {
        return {
          ...THEME_PRESETS.custom,
          companyName: 'Bureau of Internet Culture', // Default company name
          companyLogo: null
        };
      }
      
      // If using a preset theme, merge with theme presets
      const themeOption = settings.theme as ThemeOption;
      
      if (themeOption && themeOption !== 'custom' && themeOption in THEME_PRESETS) {
        const themeColors = THEME_PRESETS[themeOption];
        
        const finalTheme = {
          ...themeColors,
          // Allow database values to override if explicitly set
          primaryColor: settings.primaryColor || themeColors.primaryColor,
          secondaryColor: settings.secondaryColor || themeColors.secondaryColor,
          backgroundColor: settings.backgroundColor || themeColors.backgroundColor,
          borderColor: settings.borderColor || themeColors.borderColor,
          buttonColor: settings.buttonColor || themeColors.buttonColor,
          textColor: settings.textColor || themeColors.textColor,
          // Add company info
          companyName: settings.companyName || 'BoothBoss',
          companyLogo: settings.companyLogo,
        };
        
        // console.log('Final theme settings for preset theme:', finalTheme);
        return finalTheme;
      }
      
      // For custom theme, use stored values with fallbacks
      return {
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        backgroundColor: settings.backgroundColor || '#ffffff',
        borderColor: settings.borderColor || '#e5e7eb',
        buttonColor: settings.buttonColor || settings.primaryColor,
        textColor: settings.textColor || '#111827',
        companyName: settings.companyName || 'BoothBoss',
        companyLogo: settings.companyLogo,
      };
    } catch (error) {
      console.error('Failed to load theme settings:', error);
      // Return default theme colors with company info as fallback
      return {
        ...THEME_PRESETS.custom,
        companyName: 'Bureau of Internet Culture',
        companyLogo: null
      };
    }
  }

/**
 * Generate CSS variables for the current theme
 */
export function generateThemeCSS(themeColors: ThemeColors): string {
  return `
    :root {
      --color-primary: ${themeColors.primaryColor};
      --color-secondary: ${themeColors.secondaryColor};
      --color-background: ${themeColors.backgroundColor};
      --color-border: ${themeColors.borderColor};
      --color-button: ${themeColors.buttonColor};
      --color-text: ${themeColors.textColor};
    }
  `;
}