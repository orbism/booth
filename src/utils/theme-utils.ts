// src/utils/theme-utils.ts
export function getContrastTextColor(hexColor: string): string {
    // Remove the hash
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
    
    // Calculate luminance - using a common formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors and black for light colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  export function adjustBrightness(hexColor: string, factor: number): string {
    // Remove the hash
    const hex = hexColor.replace('#', '');
    
    // Parse the color channels
    let r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    let g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    let b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.max(0, Math.round(r + (factor > 0 ? (255 - r) : r) * Math.abs(factor))));
    g = Math.min(255, Math.max(0, Math.round(g + (factor > 0 ? (255 - g) : g) * Math.abs(factor))));
    b = Math.min(255, Math.max(0, Math.round(b + (factor > 0 ? (255 - b) : b) * Math.abs(factor))));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }