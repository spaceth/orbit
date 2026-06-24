"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/localization";

export function LocaleToggle() {
  const { locale, setLocale, ui } = useLocale();

  return (
    <div
      className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs"
      role="group"
      aria-label={locale === "en" ? ui.switchToThai : ui.switchToEnglish}
    >
      {(["en", "th"] as const satisfies readonly Locale[]).map((value) => {
        const isActive = locale === value;
        const label = value === "en" ? ui.languageEnglish : ui.languageThai;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLocale(value)}
            className={[
              "px-1.5 py-0.5 transition-opacity",
              isActive ? "text-foreground opacity-100" : "text-muted opacity-60 hover:opacity-100",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
