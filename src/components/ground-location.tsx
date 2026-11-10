"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import {
  CITIES,
  getObserver,
  markAutoLocateAttempted,
  placeGroups,
  selectObserverLocation,
  setObserverLocation,
  shouldAutoLocate,
  useObserverLocation,
} from "@/lib/observer-location";

function formatCoord(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

function parseCoord(value: string, min: number, max: number): number | null {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

export function GroundLocation() {
  const location = useObserverLocation();
  const { locale, ui } = useLocale();
  const [latDraft, setLatDraft] = useState(() => formatCoord(location.lat));
  const [lonDraft, setLonDraft] = useState(() => formatCoord(location.lon));
  const [seenNonce, setSeenNonce] = useState(location.nonce);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const city = CITIES.find((item) => item.id === location.cityId);
  const chipLabel = city
    ? city.name[locale]
    : `${formatCoord(location.lat)}, ${formatCoord(location.lon)}`;

  if (location.nonce !== seenNonce) {
    setSeenNonce(location.nonce);
    setLatDraft(formatCoord(location.lat));
    setLonDraft(formatCoord(location.lon));
  }

  useEffect(() => {
    if (!shouldAutoLocate()) {
      return;
    }
    markAutoLocateAttempted();
    locate();
  }, []);

  return (
    <div className="pointer-events-none relative flex w-[min(22rem,calc(100vw-2.5rem))] justify-end">
      <button
        type="button"
        aria-expanded={open}
        aria-label={ui.groundLocationShow}
        onClick={() => setOpen(true)}
        className={[
          "timeline-surface pressable material-chip pointer-events-auto origin-top-right px-3 py-2 text-[11px] leading-none text-foreground tabular-nums",
          open ? "pointer-events-none absolute top-0 right-0 scale-95 opacity-0" : "",
        ].join(" ")}
      >
        {chipLabel}
      </button>
      <div
        inert={!open}
        className={[
          "timeline-surface material-chip pointer-events-auto max-h-[calc(100dvh-5.5rem)] w-full origin-top-right overflow-y-auto p-3 text-foreground",
          open
            ? ""
            : "pointer-events-none absolute inset-x-0 top-0 scale-[0.96] opacity-0 blur-[8px]",
        ].join(" ")}
      >
      <div className="relative">
        <p className="px-8 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          {ui.groundLocation}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-label={ui.timelineHide}
          onClick={() => setOpen(false)}
          className="round-control absolute top-1/2 right-0 -translate-y-1/2 px-2 py-0.5 text-[10px] leading-none tracking-[0.14em] text-muted uppercase"
        >
          {ui.timelineHide}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {placeGroups().map((group) => (
          <div key={group.id}>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              {ui.groundPlaceGroups[group.id]}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {group.places.map((place) => {
                const isActive = location.cityId === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setFailed(false);
                      selectObserverLocation({
                        lat: place.lat,
                        lon: place.lon,
                        cityId: place.id,
                        nonce: getObserver().nonce + 1,
                      });
                    }}
                    className={[
                      "round-control pressable px-2 py-0.5 text-left text-[10px] leading-snug uppercase tracking-[0.12em]",
                      isActive ? "text-foreground" : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {place.name[locale]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => locate(setFailed, true)}
        className="round-control pressable mt-3 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted hover:text-foreground"
      >
        {ui.groundUseLocation}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            {ui.groundLatitude}
          </span>
          <input
            value={latDraft}
            inputMode="decimal"
            aria-label={ui.groundLatitude}
            onChange={(event) => {
              const next = event.target.value;
              setLatDraft(next);
              const parsed = parseCoord(next, -90, 90);
              if (parsed === null) {
                return;
              }
              setObserverLocation({
                lat: parsed,
                lon: location.lon,
                cityId: null,
                nonce: location.nonce,
              });
            }}
            className="mt-1 w-full border border-[var(--material-edge)] bg-transparent px-2 py-1 text-xs text-foreground outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            {ui.groundLongitude}
          </span>
          <input
            value={lonDraft}
            inputMode="decimal"
            aria-label={ui.groundLongitude}
            onChange={(event) => {
              const next = event.target.value;
              setLonDraft(next);
              const parsed = parseCoord(next, -180, 180);
              if (parsed === null) {
                return;
              }
              setObserverLocation({
                lat: location.lat,
                lon: parsed,
                cityId: null,
                nonce: location.nonce,
              });
            }}
            className="mt-1 w-full border border-[var(--material-edge)] bg-transparent px-2 py-1 text-xs text-foreground outline-none"
          />
        </label>
      </div>
      {failed ? <p className="mt-2 text-xs text-muted">{ui.groundLocationFailed}</p> : null}
      </div>
    </div>
  );
}

function locate(onFail?: (failed: boolean) => void, focus = false) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onFail?.(true);
    return;
  }
  onFail?.(false);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      onFail?.(false);
      const commit = focus ? selectObserverLocation : setObserverLocation;
      commit({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        cityId: null,
        nonce: getObserver().nonce + 1,
      });
    },
    () => onFail?.(true),
    { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8000 },
  );
}
