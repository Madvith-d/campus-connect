import { supabase } from '@/integrations/supabase/client';
import { ExtractedColors } from './color-extraction';

/**
 * Saves extracted gradient colors to the database for an event
 */
export async function saveGradientColors(
  eventId: string,
  colors: ExtractedColors,
  gradientCss: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        gradient_colors: colors,
        gradient_css: gradientCss,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      console.error('Failed to save gradient colors:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving gradient colors:', error);
    throw error;
  }
}

/**
 * Loads cached gradient colors from the database
 */
export async function loadGradientColors(eventId: string): Promise<{
  colors: ExtractedColors | null;
  gradientCss: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('gradient_colors, gradient_css')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Failed to load gradient colors:', error);
      return { colors: null, gradientCss: null };
    }

    return {
      colors: data.gradient_colors as ExtractedColors,
      gradientCss: data.gradient_css,
    };
  } catch (error) {
    console.error('Error loading gradient colors:', error);
    return { colors: null, gradientCss: null };
  }
}

/**
 * Checks if gradient colors are cached for an event
 */
export async function hasCachedGradientColors(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('gradient_css')
      .eq('id', eventId)
      .single();

    if (error) {
      return false;
    }

    return !!data.gradient_css;
  } catch (error) {
    return false;
  }
}



