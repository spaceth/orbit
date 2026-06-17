"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="fixed top-5 right-5 z-30 h-8 w-8" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
      return;
    }
    if (theme === "dark") {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed top-5 right-5 z-30 flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-60"
      aria-label={
        theme === "system"
          ? `Using system appearance (${isDark ? "dark" : "light"}). Switch to ${isDark ? "light" : "dark"} mode.`
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
