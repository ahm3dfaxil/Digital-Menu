/**
 * Converts a hex color code to HSL values.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generates custom brand colors as CSS Custom Properties and applies them to a target element.
 */
export function applyThemeColor(hexColor: string, element: HTMLElement = document.documentElement) {
  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
    // Default fallback to purple
    hexColor = "#8b5cf6";
  }

  const { h, s } = hexToHsl(hexColor);

  const shades = {
    50: 97,
    100: 93,
    200: 85,
    300: 75,
    400: 62,
    500: 50,
    600: 43,
    700: 35,
    800: 27,
    900: 20,
    950: 10,
  };

  Object.entries(shades).forEach(([shade, lightness]) => {
    element.style.setProperty(
      `--brand-${shade}`,
      `hsl(${h}, ${s}%, ${lightness}%)`
    );
  });
}
