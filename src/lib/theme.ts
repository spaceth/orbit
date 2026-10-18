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

export const DARK_THEME: ThemeColors = {
  background: "#000000",
  foreground: "#f5f5f7",
  muted: "#a1a1a6",
  canvasBackground: "#000000",
  marker: "#ffffff",
  orbitTrail: "#ffffff",
  earthOcean: "#111111",
  earthLand: "#b5b5b5",
  error: "#ff453a",
};

export function readThemeColors(root: HTMLElement = document.documentElement): ThemeColors {
  const styles = getComputedStyle(root);
  const colors = { ...DARK_THEME };

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
