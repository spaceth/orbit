"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { syncThemeChrome } from "@/lib/theme-chrome";

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) {
      return;
    }
    syncThemeChrome(resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}
