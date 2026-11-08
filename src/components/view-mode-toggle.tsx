"use client";

import { useLocale } from "@/components/locale-provider";

export type ViewMode = "space" | "ground";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  const { ui } = useLocale();
  const options = [
    { id: "space" as const, label: ui.viewSpace, name: ui.viewSpaceLabel },
    { id: "ground" as const, label: ui.viewGround, name: ui.viewGroundLabel },
  ];

  return (
    <div
      className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs"
      role="group"
      aria-label={ui.viewMode}
    >
      {options.map((option) => {
        const isActive = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            aria-label={option.name}
            onClick={() => onChange(option.id)}
            className={[
              "round-control pressable px-2 py-0.5 transition-opacity",
              isActive ? "text-foreground opacity-100" : "text-muted opacity-60 hover:opacity-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
