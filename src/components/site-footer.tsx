"use client";

import { useLocale } from "@/components/locale-provider";
import { formatTemplate, UI_TEXT } from "@/lib/localization";

export function SiteFooter() {
  const { ui } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer
      className={[
        "z-10 flex items-center justify-between gap-3 px-5 text-[10px] text-muted max-sm:text-[9px]",
        "max-sm:absolute max-sm:bottom-full max-sm:left-0 max-sm:right-0 max-sm:mb-2",
        "sm:fixed sm:bottom-3 sm:left-0 sm:right-0",
      ].join(" ")}
    >
      <p className="pointer-events-none min-w-0 uppercase tracking-[0.14em] max-sm:normal-case max-sm:tracking-normal">
        {formatTemplate(UI_TEXT.en.footerCopyright, { year })}
      </p>
      <a
        href="https://github.com/spaceth/orbit"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto shrink-0 normal-case tracking-normal transition-opacity hover:text-foreground hover:opacity-80"
      >
        {ui.footerHowItWorks}
      </a>
    </footer>
  );
}
