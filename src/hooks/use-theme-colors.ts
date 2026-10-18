"use client";

import { useEffect, useState } from "react";

import { DARK_THEME, readThemeColors, type ThemeColors } from "@/lib/theme";

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(DARK_THEME);

  useEffect(() => {
    setColors(readThemeColors());
  }, []);

  return colors;
}
