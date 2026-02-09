/**
 * Color detection utilities
 * Helps filter out non-purple robots
 */

export interface ColorAnalysis {
  hasPurple: boolean;
  purplePercentage: number;
  dominantColor: 'purple' | 'other';
  avgHue: number;
}

/**
 * Analyze if an image contains significant purple color
 * Purple hue range: ~270-320 degrees
 */
export function analyzePurpleContent(
  canvas: HTMLCanvasElement
): ColorAnalysis {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      hasPurple: false,
      purplePercentage: 0,
      dominantColor: 'other',
      avgHue: 0,
    };
  }

  // Get image data from canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let purplePixelCount = 0;
  let totalPixels = 0;
  let totalHue = 0;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    totalPixels++;

    // Convert RGB to HSL to detect purple
    const hsl = rgbToHsl(r, g, b);
    totalHue += hsl.h;

    // Purple hue range: 270-320 degrees (270=violet, 300=magenta)
    // Also check saturation > 30% and lightness 20-80%
    if (
      hsl.h >= 270 &&
      hsl.h <= 320 &&
      hsl.s > 0.3 &&
      hsl.l > 0.2 &&
      hsl.l < 0.8
    ) {
      purplePixelCount++;
    }
  }

  const purplePercentage =
    totalPixels > 0 ? purplePixelCount / totalPixels : 0;
  const avgHue = totalPixels > 0 ? totalHue / totalPixels : 0;

  // Require at least 10% purple pixels
  const hasPurple = purplePercentage > 0.1;
  const dominantColor = hasPurple ? 'purple' : 'other';

  return {
    hasPurple,
    purplePercentage,
    dominantColor,
    avgHue,
  };
}

/**
 * Convert RGB to HSL
 * Returns { h: [0-360], s: [0-1], l: [0-1] }
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360, // Convert to degrees
    s,
    l,
  };
}

/**
 * Check if detection should be filtered out based on color
 */
export function shouldFilterByColor(purplePercentage: number): boolean {
  // Require at least 10% purple in the frame
  const minPurpleThreshold = parseFloat(
    process.env.NEXT_PUBLIC_MIN_PURPLE_PERCENT || '0.05'
  );

  return purplePercentage < minPurpleThreshold;
}
