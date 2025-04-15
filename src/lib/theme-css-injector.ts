// src/lib/theme-css-injector.ts
import { ThemeColors } from './themes';

/**
 * Generate comprehensive CSS overrides for Tailwind classes
 * based on the current theme settings
 */
export function generateThemeCssOverrides(theme: ThemeColors): string {
  const primaryColor = theme.primaryColor;
  const secondaryColor = theme.secondaryColor;
  const bgColor = theme.backgroundColor;
  const borderColor = theme.borderColor;
  const buttonColor = theme.buttonColor;
  const textColor = theme.textColor;
  
  // Generate text contrasting color based on background
  const getContrastColor = (hexColor: string): string => {
    // Simple contrast calculator
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };
  
  const primaryTextColor = getContrastColor(primaryColor);
  const buttonTextColor = getContrastColor(buttonColor);
  
  return `
    /* Base theme variables */
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${secondaryColor};
      --color-background: ${bgColor};
      --color-border: ${borderColor};
      --color-button: ${buttonColor};
      --color-text: ${textColor};
    }
    
    /* Base element styling */
    body {
      background-color: ${bgColor};
      color: ${textColor};
    }
    
    /* Tailwind-specific overrides */
    .bg-blue-600, .bg-blue-500, .bg-blue-700, .bg-blue-800 {
      background-color: ${primaryColor} !important;
    }
    
    .text-blue-600, .text-blue-500, .text-blue-700, .text-blue-800 {
      color: ${primaryColor} !important;
    }
    
    .border-blue-500, .border-blue-600, .border-blue-700 {
      border-color: ${primaryColor} !important;
    }
    
    /* Override button styling */
    button[type="submit"],
    .btn-primary,
    button.primary,
    .bg-blue-600, 
    .hover\\:bg-blue-700:hover {
      background-color: ${buttonColor} !important;
      color: ${buttonTextColor} !important;
    }
    
    /* Header styling */
    header, .header-primary {
      background-color: ${primaryColor} !important;
      color: ${primaryTextColor} !important;
    }
    
    /* Form elements */
    .focus\\:ring-blue-500:focus {
      --tw-ring-color: ${primaryColor} !important;
    }
    
    .focus\\:border-blue-500:focus {
      border-color: ${primaryColor} !important;
    }
  `;
}