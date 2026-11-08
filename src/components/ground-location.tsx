"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import {
  CITIES,
  getObserver,
  markAutoLocateAttempted,
  setObserverLocation,
  shouldAutoLocate,
  useObserverLocation,
} from "@/lib/observer-location";

function formatCoord(value: number): string {
  return String(Math.round(value * 10000) / 10000);
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
    <div className="material-chip w-[min(18rem,calc(100vw-2.5rem))] p-3 text-foreground">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {ui.groundLocation}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {CITIES.map((city) => {
          const isActive = location.cityId === city.id;
          return (
            <button
              key={city.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setFailed(false);
                setObserverLocation({
                  lat: city.lat,
                  lon: city.lon,
                  cityId: city.id,
                  nonce: getObserver().nonce + 1,
                });
              }}
              className={[
                "round-control pressable px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                isActive ? "text-foreground" : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              {city.name[locale]}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => locate(setFailed)}
          className="round-control pressable px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted hover:text-foreground"
        >
          {ui.groundUseLocation}
        </button>
      </div>
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
  );
}

function locate(onFail?: (failed: boolean) => void) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onFail?.(true);
    return;
  }
  onFail?.(false);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      onFail?.(false);
      setObserverLocation({
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
