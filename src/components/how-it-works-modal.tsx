"use client";

import { useEffect } from "react";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        className="relative z-10 max-h-[min(80dvh,32rem)] w-full max-w-md overflow-y-auto border border-panel-border bg-white p-5 dark:bg-black"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="how-it-works-title" className="text-sm font-semibold text-foreground">
            How&apos;s this website works?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted transition-opacity hover:opacity-60"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Orbit tracks Thailand&apos;s active spacecraft using live Two-Line Element (TLE)
            sets — compact orbital parameters published for each satellite.
          </p>
          <p>
            When you open the site, the browser requests TLE data for each in-orbit satellite
            from our API at{" "}
            <code className="text-foreground">/api/tle/[noradId]</code>. That route only
            accepts NORAD IDs listed in the registry, then fetches fresh TLE lines from{" "}
            <a
              href="https://tle.ivanstanojevic.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              tle.ivanstanojevic.me
            </a>
            . Responses are cached for one hour before being refreshed.
          </p>
          <p>
            If a satellite&apos;s TLE cannot be loaded, it stays in the list as
            &ldquo;Unavailable&rdquo; while the rest continue to load.
          </p>
          <p>
            Once TLE data arrives,{" "}
            <code className="text-foreground">satellite.js</code> runs SGP4 propagation to
            compute each spacecraft&apos;s position, velocity, and orbit trail in real time.
            The 3D globe updates on every frame from that math — no live telemetry feed is
            used.
          </p>
        </div>
      </div>
    </div>
  );
}
