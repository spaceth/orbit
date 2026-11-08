"use client";

import { GroundLocation } from "@/components/ground-location";
import { LocaleToggle } from "@/components/locale-toggle";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";

interface AppTogglesProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function AppToggles({ viewMode, onViewModeChange }: AppTogglesProps) {
  return (
    <div className="fixed top-0 right-5 z-30 flex flex-col items-end gap-2 pt-5 text-foreground">
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="order-2 sm:order-1">
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
        <div className="order-1 sm:order-2">
          <LocaleToggle />
        </div>
      </div>
      {viewMode === "ground" ? <GroundLocation /> : null}
    </div>
  );
}
