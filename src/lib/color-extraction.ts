import { Vibrant } from 'node-vibrant/browser';

export interface ExtractedColors {
  vibrant?: string;
  muted?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  darkMuted?: string;
  lightMuted?: string;
}

export interface GradientOptions {
  angle?: number; // Default 135 degrees
  opacity?: number; // Default 0.8
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light';
}

/**
 * Extracts dominant colors from an image URL using node-vibrant
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    
    return {
      vibrant: palette.Vibrant?.getHex(),
      muted: palette.Muted?.getHex(),
      darkVibrant: palette.DarkVibrant?.getHex(),
      lightVibrant: palette.LightVibrant?.getHex(),
      darkMuted: palette.DarkMuted?.getHex(),
      lightMuted: palette.LightMuted?.getHex(),
    };
  } catch (error) {
    console.warn('Failed to extract colors from image:', error);
    return {};
  }
}

/**
 * Converts hex color to HSL format for better blending
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generates a CSS gradient string from extracted colors
 */
export function generateGradient(
  colors: ExtractedColors, 
  options: GradientOptions = {}
): string {
  const { angle = 135, opacity = 0.8, blendMode = 'normal' } = options;
  
  // Fallback gradient colors
  const fallbackColors = {
    primary: 'hsl(222.2 47.4% 11.2%)',
    secondary: 'hsl(210 40% 96.1%)',
  };
  
  // Select two complementary colors for the gradient
  let color1 = fallbackColors.primary;
  let color2 = fallbackColors.secondary;
  
  // Try to use vibrant colors first, fallback to muted
  if (colors.vibrant && colors.darkVibrant) {
    color1 = `hsl(${hexToHsl(colors.vibrant)} / ${opacity})`;
    color2 = `hsl(${hexToHsl(colors.darkVibrant)} / ${opacity})`;
  } else if (colors.lightVibrant && colors.darkMuted) {
    color1 = `hsl(${hexToHsl(colors.lightVibrant)} / ${opacity})`;
    color2 = `hsl(${hexToHsl(colors.darkMuted)} / ${opacity})`;
  } else if (colors.muted && colors.darkMuted) {
    color1 = `hsl(${hexToHsl(colors.muted)} / ${opacity})`;
    color2 = `hsl(${hexToHsl(colors.darkMuted)} / ${opacity})`;
  } else if (colors.vibrant) {
    // Single color - create a lighter version for the gradient
    const hsl = hexToHsl(colors.vibrant);
    const [h, s, l] = hsl.split(' ');
    const lightL = Math.max(parseInt(l), 85); // Ensure it's light enough
    color1 = `hsl(${h} ${s} ${lightL} / ${opacity})`;
    color2 = `hsl(${h} ${s} ${l} / ${opacity})`;
  }
  
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

/**
 * Main function to get gradient from poster image
 */
export async function getGradientFromPoster(
  posterUrl: string | null | undefined,
  options: GradientOptions = {}
): Promise<string> {
  if (!posterUrl) {
    // Return default gradient
    return generateGradient({}, options);
  }
  
  try {
    const colors = await extractColorsFromImage(posterUrl);
    return generateGradient(colors, options);
  } catch (error) {
    console.warn('Failed to generate gradient from poster:', error);
    return generateGradient({}, options);
  }
}

/**
 * Determines if text should be light or dark based on background brightness
 */
export function getTextColorForBackground(hexColor: string): 'light' | 'dark' {
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return light text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? 'dark' : 'light';
}

/**
 * Caches extracted colors to avoid re-processing the same images
 */
const colorCache = new Map<string, ExtractedColors>();

export async function getCachedColors(imageUrl: string): Promise<ExtractedColors> {
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }
  
  const colors = await extractColorsFromImage(imageUrl);
  colorCache.set(imageUrl, colors);
  return colors;
}
