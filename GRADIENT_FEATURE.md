# Event Gradient Feature

This feature extracts color palettes from event poster images and generates smooth gradients for event cards, similar to Luma.com's design approach.

## Features

### 🎨 Color Extraction
- Uses `node-vibrant` library to extract dominant colors from poster images
- Identifies key color swatches: Vibrant, Muted, Dark Vibrant, Light Vibrant, etc.
- Handles extraction failures gracefully with fallback gradients

### 🌈 Gradient Generation
- Creates smooth 135-degree linear gradients using complementary colors
- Converts colors to HSL format for better blending
- Provides fallback gradients when extraction fails

### 🎯 Event Card Integration
- Applies gradient backgrounds to event cards
- Maintains text readability with semi-transparent overlays
- Preserves existing UI design system consistency

### 💾 Persistence
- Stores extracted colors in database (`gradient_colors` JSON field)
- Caches pre-computed CSS gradients (`gradient_css` field)
- Avoids re-processing the same images on subsequent loads

### ♿ Accessibility
- Ensures text remains readable on all gradient backgrounds
- Uses contrast-aware overlays
- Maintains proper color contrast ratios

## Implementation

### Core Components

1. **Color Extraction Utility** (`src/lib/color-extraction.ts`)
   - `extractColorsFromImage()` - Extracts color palette from image URL
   - `generateGradient()` - Creates CSS gradient from color palette
   - `getGradientFromPoster()` - Main function combining extraction and generation

2. **Gradient Persistence** (`src/lib/gradient-persistence.ts`)
   - `saveGradientColors()` - Saves extracted colors to database
   - `loadGradientColors()` - Loads cached colors from database
   - `hasCachedGradientColors()` - Checks if colors are already cached

3. **EventCard Component** (`src/components/Events/EventCard.tsx`)
   - Enhanced event card with gradient background support
   - Automatic gradient loading and caching
   - Maintains all existing functionality

4. **Gradient Demo** (`src/components/Events/GradientDemo.tsx`)
   - Interactive demo showcasing the gradient feature
   - Available at `/gradient-demo` route
   - Allows testing with custom image URLs

### Database Schema

```sql
-- Added to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS gradient_colors JSONB,
ADD COLUMN IF NOT EXISTS gradient_css TEXT;
```

### Usage Example

```tsx
import EventCard from '@/components/Events/EventCard';

<EventCard
  event={eventData}
  posterUrl={event.event_image_url}
  onViewDetails={handleViewDetails}
  onEdit={handleEdit}
  canEdit={isAdmin}
/>
```

## API Reference

### `extractColorsFromImage(imageUrl: string): Promise<ExtractedColors>`

Extracts dominant colors from an image URL.

**Parameters:**
- `imageUrl` - URL of the image to analyze

**Returns:**
```typescript
interface ExtractedColors {
  vibrant?: string;
  muted?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  darkMuted?: string;
  lightMuted?: string;
}
```

### `generateGradient(colors: ExtractedColors, options?: GradientOptions): string`

Generates a CSS gradient string from extracted colors.

**Parameters:**
- `colors` - Extracted color palette
- `options` - Optional gradient configuration

**Returns:** CSS gradient string

### `getGradientFromPoster(posterUrl: string, options?: GradientOptions): Promise<string>`

Main function to get gradient from poster image with fallback handling.

## Styling

The feature integrates seamlessly with the existing design system:

- Uses HSL color format for consistency
- Maintains Tailwind CSS classes
- Preserves hover animations and transitions
- Respects dark/light theme preferences

### CSS Classes

- `.event-card-gradient` - Base gradient container
- `.event-card-content` - Content overlay for readability
- `.elevate-card` - Existing hover animations

## Performance

- Colors are cached in database to avoid re-processing
- Gradient generation is optimized with HSL conversion
- Fallback gradients load instantly when extraction fails
- Minimal impact on initial page load

## Browser Support

- Modern browsers with CSS gradient support
- Graceful degradation for older browsers
- Works with all major mobile browsers

## Future Enhancements

- [ ] Admin interface for gradient selection and locking
- [ ] Animated gradient backgrounds with Framer Motion
- [ ] Multiple gradient style options
- [ ] Batch processing for existing events
- [ ] Gradient preview in event creation form
