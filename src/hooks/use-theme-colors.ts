"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { LIGHT_THEME_FALLBACK, readThemeColors, type ThemeColors } from "@/lib/theme";

export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>(LIGHT_THEME_FALLBACK);

  useEffect(() => {
    const update = () => setColors(readThemeColors());

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  return colors;
}
