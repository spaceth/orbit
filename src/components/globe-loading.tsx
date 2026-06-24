"use client";

import { useLocale } from "@/components/locale-provider";

export function GlobeLoading() {
  const { ui } = useLocale();

  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      {ui.loadingGlobe}
    </div>
  );
}
