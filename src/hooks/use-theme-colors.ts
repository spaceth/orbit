"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { LIGHT_THEME_FALLBACK, readThemeColors, type ThemeColors } from "@/lib/theme";

function getInitialColors(): ThemeColors {
  if (typeof window === "undefined") {
    return LIGHT_THEME_FALLBACK;
  }
  return readThemeColors();
}

export function useThemeColors(): ThemeColors {
  const { resolvedTheme, theme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>(getInitialColors);

  useEffect(() => {
    const update = () => setColors(readThemeColors());

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (theme === "system") {
        update();
      }
    };
    media.addEventListener("change", onSystemChange);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onSystemChange);
    };
  }, [resolvedTheme, theme]);

  return colors;
}
