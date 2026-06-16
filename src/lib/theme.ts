/** Semantic color tokens shared by the UI and WebGL scene. Values come from CSS variables in globals.css. */

export interface ThemeColors {
  background: string;
  foreground: string;
  muted: string;
  canvasBackground: string;
  marker: string;
  orbitTrail: string;
  earthOcean: string;
  earthLand: string;
  error: string;
}

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  muted: "--muted",
  canvasBackground: "--canvas-background",
  marker: "--marker",
  orbitTrail: "--orbit-trail",
  earthOcean: "--earth-ocean",
  earthLand: "--earth-land",
  error: "--error",
};

export const LIGHT_THEME_FALLBACK: ThemeColors = {
  background: "#ffffff",
  foreground: "#1d1d1f",
  muted: "#6e6e73",
  canvasBackground: "#ffffff",
  marker: "#000000",
  orbitTrail: "#000000",
  earthOcean: "#f2f2f2",
  earthLand: "#d1d1d1",
  error: "#ef4444",
};

export function readThemeColors(root: HTMLElement = document.documentElement): ThemeColors {
  const styles = getComputedStyle(root);
  const colors = { ...LIGHT_THEME_FALLBACK };

  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as Array<
    [keyof ThemeColors, string]
  >) {
    const value = styles.getPropertyValue(cssVar).trim();
    if (value) {
      colors[key] = value;
    }
  }

  return colors;
}
