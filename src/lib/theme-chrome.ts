export const THEME_COLOR_LIGHT = "#ffffff";
export const THEME_COLOR_DARK = "#000000";

function getOrCreateMeta(name: string): HTMLMetaElement {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  return meta as HTMLMetaElement;
}

export function syncThemeChrome(isDark: boolean) {
  const color = isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;

  getOrCreateMeta("theme-color").setAttribute("content", color);
  getOrCreateMeta("apple-mobile-web-app-status-bar-style").setAttribute(
    "content",
    isDark ? "black" : "default",
  );

  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}
