"use client";

import type { SatelliteRecord, SatelliteTelemetry, TleData } from "@/types/satellite";

import { VisibilityIcon } from "./visibility-icon";

interface SatellitePanelProps {
  satellites: readonly SatelliteRecord[];
  availableNoradIds: number[];
  hiddenNoradIds: ReadonlySet<number>;
  activeNoradId: number | null;
  highlightedNoradId: number | null;
  activeSatellite: SatelliteRecord | null;
  activeTle: TleData | null;
  activeTelemetry: SatelliteTelemetry | null;
  onSelectNoradId: (noradId: number) => void;
  onHoverNoradId: (noradId: number | null) => void;
  onToggleVisibility: (noradId: number) => void;
  loading: boolean;
  error: string | null;
}

function formatCoord(value: number, positive: string, negative: string): string {
  const suffix = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(2)}° ${suffix}`;
}

function formatTleAge(date: string): string {
  const epoch = new Date(date);
  const hours = Math.max(0, (Date.now() - epoch.getTime()) / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours.toFixed(1)}h ago`;
  }
  return `${(hours / 24).toFixed(1)}d ago`;
}

function formatLaunchDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function SatellitePanel({
  satellites,
  availableNoradIds,
  hiddenNoradIds,
  activeNoradId,
  highlightedNoradId,
  activeSatellite,
  activeTle,
  activeTelemetry,
  onSelectNoradId,
  onHoverNoradId,
  onToggleVisibility,
  loading,
  error,
}: SatellitePanelProps) {
  const availableSet = new Set(availableNoradIds);

  return (
    <aside className="glass-panel fixed top-5 left-5 z-20 w-[min(92vw,22rem)] p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-panel-heading">
        Orbit
      </p>

      <div className="mt-4 space-y-1">
        {satellites.map((satellite) => {
          const isAvailable = availableSet.has(satellite.noradId);
          const isActive = activeNoradId !== null && satellite.noradId === activeNoradId;
          const isHighlighted =
            highlightedNoradId !== null &&
            isAvailable &&
            satellite.noradId === highlightedNoradId;

          const isVisible = !hiddenNoradIds.has(satellite.noradId);

          return (
            <div
              key={satellite.noradId}
              className={[
                "flex items-center transition-colors",
                isActive ? "bg-surface-active" : isHighlighted ? "bg-surface-hover" : "",
                isAvailable ? "opacity-100" : "opacity-65",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => {
                  if (!isAvailable) {
                    return;
                  }
                  onSelectNoradId(satellite.noradId);
                }}
                onMouseEnter={() => {
                  if (!isAvailable) {
                    return;
                  }
                  onHoverNoradId(satellite.noradId);
                }}
                onMouseLeave={() => onHoverNoradId(null)}
                className={[
                  "flex min-w-0 flex-1 items-center justify-between px-2 py-1 text-left text-sm",
                  isAvailable ? "cursor-pointer" : "cursor-default",
                  !isVisible ? "opacity-50" : "",
                ].join(" ")}
              >
                <span className="font-medium text-foreground">
                  {satellite.name}
                  {!isAvailable ? (
                    <span className="ml-1 font-normal text-muted opacity-70">Unavailable</span>
                  ) : null}
                </span>
                <span className="ml-2 shrink-0 text-xs text-muted">{satellite.purpose}</span>
              </button>
              {isAvailable ? (
                <button
                  type="button"
                  onClick={() => onToggleVisibility(satellite.noradId)}
                  className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                  aria-label={isVisible ? `Hide ${satellite.name}` : `Show ${satellite.name}`}
                >
                  <VisibilityIcon visible={isVisible} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          <div className="h-6 w-40 animate-pulse bg-surface-skeleton" />
          <div className="h-4 w-28 animate-pulse bg-surface-skeleton" />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      {!loading && !error && activeSatellite && activeTle && (
        <>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {activeSatellite.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {activeSatellite.purpose}
            {activeSatellite.launchDate
              ? ` · Launched ${formatLaunchDate(activeSatellite.launchDate)}`
              : null}
          </p>
          <p className="mt-1 text-sm text-muted">
            NORAD {activeTle.noradId} · TLE {formatTleAge(activeTle.date)}
          </p>

          {activeSatellite.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {activeSatellite.description}
            </p>
          ) : null}

          {activeTelemetry ? (
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted">Latitude</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {formatCoord(activeTelemetry.latitude, "N", "S")}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Longitude</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {formatCoord(activeTelemetry.longitude, "E", "W")}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Altitude</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {activeTelemetry.altitudeKm.toFixed(1)} km
                </dd>
              </div>
              <div>
                <dt className="text-muted">Velocity</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {activeTelemetry.velocityKmS.toFixed(2)} km/s
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm text-muted">Computing position…</p>
          )}
        </>
      )}
    </aside>
  );
}
