"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  FutureSatelliteRecord,
  SatelliteRecord,
  SatelliteTelemetry,
  TleData,
} from "@/types/satellite";

import { useMediaQuery } from "@/hooks/use-media-query";
import { MOBILE_MEDIA_QUERY } from "@/lib/mobile-layout";

import { OperationCounter } from "./operation-counter";
import { VisibilityIcon } from "./visibility-icon";

interface SatellitePanelProps {
  satellites: readonly SatelliteRecord[];
  futureSatellites: readonly FutureSatelliteRecord[];
  availableNoradIds: number[];
  hiddenNoradIds: ReadonlySet<number>;
  activeNoradId: number | null;
  activeFutureId: string | null;
  highlightedNoradId: number | null;
  hoverFutureId: string | null;
  activeSatellite: SatelliteRecord | null;
  activeFutureSatellite: FutureSatelliteRecord | null;
  activeTle: TleData | null;
  activeTelemetry: SatelliteTelemetry | null;
  onSelectNoradId: (noradId: number) => void;
  onSelectFutureId: (id: string) => void;
  onHoverNoradId: (noradId: number | null) => void;
  onHoverFutureId: (id: string | null) => void;
  onToggleVisibility: (noradId: number) => void;
  onMobileReadingModeChange: (readingMode: boolean) => void;
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={[
        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
        expanded ? "rotate-90" : "",
      ].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function SatellitePanel({
  satellites,
  futureSatellites,
  availableNoradIds,
  hiddenNoradIds,
  activeNoradId,
  activeFutureId,
  highlightedNoradId,
  hoverFutureId,
  activeSatellite,
  activeFutureSatellite,
  activeTle,
  activeTelemetry,
  onSelectNoradId,
  onSelectFutureId,
  onHoverNoradId,
  onHoverFutureId,
  onToggleVisibility,
  onMobileReadingModeChange,
  loading,
  error,
}: SatellitePanelProps) {
  const availableSet = new Set(availableNoradIds);
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const panelRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [readingMode, setReadingMode] = useState(false);
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);

  const hasDetail =
    !loading &&
    !error &&
    (activeFutureSatellite !== null || (activeSatellite !== null && activeTle !== null));

  const updateReadingMode = useCallback(
    (next: boolean) => {
      setReadingMode(next);
      onMobileReadingModeChange(next);
    },
    [onMobileReadingModeChange],
  );

  useEffect(() => {
    updateReadingMode(false);
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeNoradId, activeFutureId, updateReadingMode]);

  useEffect(() => {
    const panel = panelRef.current;
    const detail = detailRef.current;

    if (!isMobile || !panel || !detail || !hasDetail) {
      updateReadingMode(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        updateReadingMode(entry.isIntersecting);
      },
      { root: panel, threshold: 0.15 },
    );

    observer.observe(detail);
    return () => observer.disconnect();
  }, [hasDetail, isMobile, updateReadingMode]);

  return (
    <aside
      ref={panelRef}
      className={[
        "glass-panel satellite-panel fixed top-5 left-5 z-20 w-[min(92vw,22rem)] p-5 max-sm:relative max-sm:top-auto max-sm:left-auto max-sm:z-auto max-sm:w-full",
        isMobile && readingMode ? "satellite-panel--reading" : "",
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-panel-heading">
        In Orbit
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

      {futureSatellites.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setUpcomingExpanded((expanded) => !expanded)}
            className="mt-5 flex w-full items-center gap-1.5 text-left text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
            aria-expanded={upcomingExpanded}
          >
            <ChevronIcon expanded={upcomingExpanded} />
            Upcoming
          </button>
          {upcomingExpanded ? (
            <div className="mt-2 space-y-1">
              {futureSatellites.map((satellite) => {
                const isActive = activeFutureId === satellite.id;
                const isHighlighted = hoverFutureId === satellite.id;

                return (
                  <div
                    key={satellite.id}
                    className={[
                      "flex items-center transition-colors",
                      isActive ? "bg-surface-active" : isHighlighted ? "bg-surface-hover" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectFutureId(satellite.id)}
                      onMouseEnter={() => onHoverFutureId(satellite.id)}
                      onMouseLeave={() => onHoverFutureId(null)}
                      className="flex min-w-0 flex-1 items-center justify-between px-2 py-1 text-left text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {satellite.name}
                        <span className="ml-1 font-normal text-muted opacity-70">
                          {satellite.launchInfo}
                        </span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted">{satellite.purpose}</span>
                    </button>
                    <span className="mr-1 h-6 w-6 shrink-0" aria-hidden />
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}

      {loading && (
        <div className="mt-4 space-y-3">
          <div className="h-6 w-40 animate-pulse bg-surface-skeleton" />
          <div className="h-4 w-28 animate-pulse bg-surface-skeleton" />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      {hasDetail ? (
        <div ref={detailRef}>
          {activeFutureSatellite ? (
            <>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                {activeFutureSatellite.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{activeFutureSatellite.purpose}</p>
              <p className="mt-1 text-sm text-muted">
                {activeFutureSatellite.launchInfo}
                {activeFutureSatellite.operator
                  ? ` · ${activeFutureSatellite.operator}`
                  : null}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {activeFutureSatellite.description}
              </p>
              <p className="mt-5 text-sm text-muted">Not yet in orbit — tracking unavailable.</p>
            </>
          ) : null}

          {activeSatellite && activeTle && !activeFutureSatellite ? (
            <>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                {activeSatellite.name}
              </h1>
              {activeSatellite.launchDate ? (
                <OperationCounter launchDate={activeSatellite.launchDate} />
              ) : null}
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
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
