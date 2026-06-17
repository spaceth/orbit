"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export const THEME_COLOR_LIGHT = "#ffffff";
export const THEME_COLOR_DARK = "#000000";

export function setThemeColorMeta(isDark: boolean) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
}

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setThemeColorMeta(resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}
