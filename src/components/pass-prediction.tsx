"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { useSimulationTime } from "@/components/simulation-time-provider";
import { formatTemplate, type Locale } from "@/lib/localization";
import { CITIES, useObserverLocation } from "@/lib/observer-location";
import { ommToJsonObject } from "@/lib/omm";
import { compassPoint, predictPasses, type PredictedPass } from "@/lib/passes";
import { readSimulationMs } from "@/lib/simulation-time";
import type { OmmData } from "@/types/satellite";

function formatCoord(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

function formatDuration(ms: number, minutesLabel: string, fullLabel: string): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return formatTemplate(minutesLabel, { count: minutes });
  }
  return formatTemplate(fullLabel, { count: minutes, seconds });
}

function dateFormatter(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

function timeFormatter(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function formatMissionClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(Math.abs(ms) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Countdown until the satellite rises, then count up from that moment. */
function passEventClock(pass: PredictedPass, simMs: number): string {
  if (simMs < pass.aosMs) {
    return `T-${formatMissionClock(pass.aosMs - simMs)}`;
  }
  return `T+${formatMissionClock(simMs - pass.aosMs)}`;
}

function formatElevation(degrees: number): string {
  return degrees >= 10 ? `${Math.round(degrees)}°` : `${degrees.toFixed(1)}°`;
}

function compassLabel(azimuthDeg: number): string {
  return `${compassPoint(azimuthDeg)} ${Math.round(azimuthDeg)}°`;
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10m0 0-4-4m4 4 4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatUtc(ms: number): string {
  return new Date(ms).toISOString();
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function siteId(latitude: number, longitude: number): string {
  return `${formatCoord(latitude)} ${formatCoord(longitude)}`;
}

function filenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}.+-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function passCsvFilename(firstStartMs: number, satelliteName: string, noradId: number): string {
  const stamp = formatUtc(firstStartMs).replaceAll(":", "-");
  const name = filenamePart(satelliteName) || "satellite";
  return `${stamp}-${name}-${noradId}-pass-prediction-spaceth.csv`;
}

function passCsv(passes: PredictedPass[], noradId: number, latitude: number, longitude: number): string {
  const site = siteId(latitude, longitude);
  const header = [
    "norad_id",
    "site_id",
    "start_utc",
    "peak_elevation_utc",
    "end_utc",
    "max_elevation_deg",
    "duration",
  ];
  const rows = passes.map((pass) => [
    csvCell(String(noradId)),
    csvCell(site),
    formatUtc(pass.aosMs),
    formatUtc(pass.maxElevationMs),
    formatUtc(pass.losMs),
    String(Math.round(pass.maxElevationDeg * 100) / 100),
    String(Math.round((pass.losMs - pass.aosMs) / 1000)),
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

function downloadPassCsv(
  passes: PredictedPass[],
  satelliteName: string,
  noradId: number,
  latitude: number,
  longitude: number,
) {
  const firstStartMs = Math.min(...passes.map((pass) => pass.aosMs));
  const file = new Blob([passCsv(passes, noradId, latitude, longitude)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = passCsvFilename(firstStartMs, satelliteName, noradId);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadOmmFile(omm: OmmData, satelliteName: string) {
  const record = omm.raw ?? ommToJsonObject(omm);
  const file = new Blob([`${JSON.stringify(record, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const name = filenamePart(satelliteName) || "satellite";
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${omm.noradId}-omm.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PassPrediction({ omm, name }: { omm: OmmData; name?: string }) {
  const { locale, ui } = useLocale();
  const location = useObserverLocation();
  const { clockRef, setOffsetMs, setRate } = useSimulationTime();
  const [open, setOpen] = useState(false);
  const [seenNoradId, setSeenNoradId] = useState(omm.noradId);
  const [selectedMs, setSelectedMs] = useState<number | null>(null);
  const [simMs, setSimMs] = useState(() => Date.now());
  const sectionRef = useRef<HTMLDivElement>(null);

  if (seenNoradId !== omm.noradId) {
    setSeenNoradId(omm.noradId);
    setOpen(false);
    setSelectedMs(null);
  }

  const forecast = useMemo(() => {
    if (!open) {
      return null;
    }
    return predictPasses(omm, location.lat, location.lon, Date.now());
  }, [open, omm, location.lat, location.lon]);

  useEffect(() => {
    if (!open || !forecast) {
      return;
    }
    sectionRef.current?.scrollIntoView({ block: "start" });
  }, [open, forecast]);

  useEffect(() => {
    if (selectedMs === null) {
      return;
    }
    let frameId = 0;
    let lastSecond = Number.NaN;
    const tick = () => {
      const next = readSimulationMs(clockRef.current);
      const second = Math.floor(next / 1000);
      if (second !== lastSecond) {
        lastSecond = second;
        setSimMs(next);
      }
      frameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frameId);
  }, [clockRef, selectedMs]);

  const selectedStillThere =
    selectedMs !== null &&
    forecast?.kind === "passes" &&
    forecast.passes.some((pass) => pass.maxElevationMs === selectedMs);
  if (selectedMs !== null && !selectedStillThere) {
    setSelectedMs(null);
  }

  const place = CITIES.find((city) => city.id === location.cityId);
  const placeName = place
    ? place.name[locale]
    : `${formatCoord(location.lat)}, ${formatCoord(location.lon)}`;
  const dates = dateFormatter(locale);
  const clock = timeFormatter(locale);

  const showPass = (pass: PredictedPass) => {
    if (selectedMs === pass.maxElevationMs) {
      setSelectedMs(null);
      return;
    }
    setSelectedMs(pass.maxElevationMs);
    setSimMs(pass.aosMs);
    setRate(1);
    setOffsetMs(pass.aosMs - Date.now());
  };

  return (
    <div ref={sectionRef} className="mt-5 border-t border-[var(--material-edge)] pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setSelectedMs(null);
          }}
          className="round-control pressable px-3 py-1 text-sm text-foreground"
        >
          {ui.passPrediction}
        </button>
        <button
          type="button"
          onClick={() => downloadOmmFile(omm, name?.trim() || omm.name)}
          className="round-control pressable inline-flex items-center gap-1.5 px-3 py-1 text-sm text-foreground"
        >
          <DownloadIcon />
          {ui.downloadOmm}
        </button>
      </div>

      {open && forecast ? (
        <div className="mt-3">
          <p className="text-xs text-muted">{formatTemplate(ui.passFrom, { place: placeName })}</p>

          {forecast.kind === "always-above" ? (
            <p className="mt-3 text-sm leading-relaxed text-foreground">{ui.passAlwaysAbove}</p>
          ) : null}

          {forecast.kind === "none" ? (
            <p className="mt-3 text-sm text-muted">{ui.passNone}</p>
          ) : null}

          {forecast.kind === "passes" ? (
            <div className="mt-3">
              <div className="grid grid-cols-[1.15fr_0.85fr_0.7fr_0.9fr] gap-x-2 text-[10px] leading-tight font-medium uppercase text-muted">
                <span>{ui.passDate}</span>
                <span>{ui.passTime}</span>
                <span>{ui.passMaxElevation}</span>
                <span>{ui.passDuration}</span>
              </div>
              <ul className="mt-1">
                {forecast.passes.map((pass) => {
                  const expanded = selectedMs === pass.maxElevationMs;
                  const rise = new Date(pass.aosMs);
                  return (
                    <li key={pass.maxElevationMs} className="border-t border-[var(--material-edge)]">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => showPass(pass)}
                        className="grid w-full grid-cols-[1.15fr_0.85fr_0.7fr_0.9fr] gap-x-2 py-1.5 text-left text-xs tabular-nums text-foreground"
                      >
                        <span>{dates.format(rise)}</span>
                        <span>{clock.format(rise)}</span>
                        <span>{formatElevation(pass.maxElevationDeg)}</span>
                        <span>
                          {formatDuration(
                            pass.losMs - pass.aosMs,
                            ui.passMinutes,
                            ui.passMinutesSeconds,
                          )}
                        </span>
                      </button>
                      {expanded ? (
                        <div className="pb-2">
                          <p className="text-sm font-medium tabular-nums text-foreground">
                            {passEventClock(pass, simMs)}
                          </p>
                          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs tabular-nums">
                            <dt className="text-muted">{ui.passAscending}</dt>
                            <dd className="text-foreground">{compassLabel(pass.aosAzimuthDeg)}</dd>
                            <dt className="text-muted">{ui.passDescending}</dt>
                            <dd className="text-foreground">{compassLabel(pass.losAzimuthDeg)}</dd>
                          </dl>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() =>
                  downloadPassCsv(
                    forecast.passes,
                    name?.trim() || omm.name,
                    omm.noradId,
                    location.lat,
                    location.lon,
                  )
                }
                className="round-control pressable mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-sm text-foreground"
              >
                <DownloadIcon />
                {ui.passDownloadCsv}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
