"use client";

import { useState } from "react";

import { HowItWorksModal } from "./how-it-works-modal";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <>
      <footer
        className={[
          "z-10 flex items-center justify-between gap-3 px-5 text-[10px] text-muted max-sm:text-[9px]",
          "max-sm:absolute max-sm:bottom-full max-sm:left-0 max-sm:right-0 max-sm:mb-2",
          "sm:fixed sm:bottom-3 sm:left-0 sm:right-0",
        ].join(" ")}
      >
        <p className="pointer-events-none min-w-0 uppercase tracking-[0.14em] max-sm:normal-case max-sm:tracking-normal">
          ©{year} SPACETH.CO. ALL RIGHTS RESERVED.
        </p>
        <button
          type="button"
          onClick={() => setHowItWorksOpen(true)}
          className="pointer-events-auto shrink-0 normal-case tracking-normal transition-opacity hover:text-foreground hover:opacity-80"
        >
          How&apos;s this website works?
        </button>
      </footer>
      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
    </>
  );
}
