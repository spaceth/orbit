"use client";

import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { useSimulationTime } from "@/components/simulation-time-provider";
import { formatTemplate, type UiText } from "@/lib/localization";
import {
  formatSimulationDate,
  getOffsetParts,
  offsetFromPointer,
  PREDICTION_WINDOW_MS,
  readSimulationMs,
  SIMULATION_RATES,
  thumbRatio,
  TIMELINE_DAY_STEP_MS,
  TIMELINE_HOUR_STEP_MS,
} from "@/lib/simulation-time";

interface OrbitTimelineProps {
  mobileReadingMode: boolean;
}

function formatCount(template: string, count: number): string {
  return formatTemplate(template, { count });
}

function formatOffset(offsetMs: number, ui: UiText): string | null {
  const parts = getOffsetParts(offsetMs);
  if (!parts) {
    return null;
  }

  const chunks: string[] = [];
  if (parts.days > 0) {
    chunks.push(
      formatCount(parts.days === 1 ? ui.timelineDay : ui.timelineDays, parts.days),
    );
  }
  if (parts.hours > 0) {
    chunks.push(
      formatCount(parts.hours === 1 ? ui.timelineHour : ui.timelineHours, parts.hours),
    );
  }
  if (parts.minutes > 0 && parts.days === 0) {
    chunks.push(
      formatCount(
        parts.minutes === 1 ? ui.timelineMinute : ui.timelineMinutes,
        parts.minutes,
      ),
    );
  }

  return formatTemplate(parts.ahead ? ui.timelineAhead : ui.timelineAgo, {
    offset: chunks.join(" "),
  });
}

export function OrbitTimeline({ mobileReadingMode }: OrbitTimelineProps) {
  const { locale, ui } = useLocale();
  const { rate, clockRef, setOffsetMs, stepRate, resetToNow } = useSimulationTime();
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [frame, setFrame] = useState<{ simMs: number; realMs: number } | null>(null);

  useEffect(() => {
    let frameId = 0;
    let last = 0;
    const tick = (time: number) => {
      const gap = clockRef.current.rate > 1 ? 32 : 250;
      if (time - last >= gap) {
        last = time;
        const realMs = Date.now();
        setFrame({ simMs: readSimulationMs(clockRef.current, realMs), realMs });
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [clockRef]);

  const offsetMs = frame ? frame.simMs - frame.realMs : 0;
  const simDate = frame ? new Date(frame.simMs) : null;
  const dateLabel = simDate ? formatSimulationDate(simDate, locale) : "\u00a0";
  const offsetLabel = frame ? formatOffset(offsetMs, ui) : null;
  const ratio = thumbRatio(offsetMs);
  const atNow = frame === null || (rate === 1 && Math.abs(offsetMs) < 1000);
  const minRate = SIMULATION_RATES[0];
  const maxRate = SIMULATION_RATES[SIMULATION_RATES.length - 1];

  const applyPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setOffsetMs(offsetFromPointer(clientX, rect));
  };

  const nudge = (deltaMs: number) => {
    setOffsetMs(offsetMs + deltaMs);
  };

  return (
    <div
      className={[
        "pointer-events-none fixed left-1/2 z-30 w-[min(20rem,calc(100vw-3rem))] -translate-x-1/2",
        "sm:bottom-10",
        mobileReadingMode
          ? "max-sm:bottom-[calc(70dvh+4.5rem+env(safe-area-inset-bottom))]"
          : "max-sm:bottom-[calc(35dvh+4.5rem+env(safe-area-inset-bottom))]",
      ].join(" ")}
    >
      <div className="pointer-events-auto flex flex-col items-center bg-background/85 px-4 pt-3 pb-1">
        <time
          dateTime={simDate?.toISOString()}
          className="text-center text-[11px] leading-none text-foreground tabular-nums"
        >
          {dateLabel}
        </time>
        <p className="mt-1 h-3 text-center text-[10px] leading-none text-muted tabular-nums">
          {offsetLabel ?? (atNow ? ui.timelineLive : "\u00a0")}
        </p>
        <div
          className="mt-2 flex items-center justify-center gap-2 text-[10px] leading-none"
          role="group"
          aria-label={ui.timelineSpeed}
        >
          <button
            type="button"
            aria-label={ui.timelineSlower}
            disabled={rate <= minRate}
            onClick={() => stepRate(-1)}
            className="px-1.5 py-1 text-foreground transition-opacity disabled:cursor-default disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-10 text-center text-foreground tabular-nums">{rate}×</span>
          <button
            type="button"
            aria-label={ui.timelineFaster}
            disabled={rate >= maxRate}
            onClick={() => stepRate(1)}
            className="px-1.5 py-1 text-foreground transition-opacity disabled:cursor-default disabled:opacity-30"
          >
            +
          </button>
        </div>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={ui.timelineLabel}
          aria-valuemin={-PREDICTION_WINDOW_MS}
          aria-valuemax={PREDICTION_WINDOW_MS}
          aria-valuenow={Math.round(offsetMs)}
          aria-valuetext={offsetLabel ?? dateLabel}
          className="relative mt-2 h-8 w-full cursor-ew-resize touch-none select-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          onPointerDown={(event) => {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            applyPointer(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) {
              return;
            }
            applyPointer(event.clientX);
          }}
          onPointerUp={(event) => {
            if (!draggingRef.current) {
              return;
            }
            draggingRef.current = false;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? TIMELINE_DAY_STEP_MS : TIMELINE_HOUR_STEP_MS;
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudge(step);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudge(-step);
            } else if (event.key === "Home") {
              event.preventDefault();
              setOffsetMs(-PREDICTION_WINDOW_MS);
            } else if (event.key === "End") {
              event.preventDefault();
              setOffsetMs(PREDICTION_WINDOW_MS);
            }
          }}
        >
          <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-foreground/25" />
          {ratio !== 0.5 ? (
            <div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-foreground"
              style={{
                left: `${Math.min(50, ratio * 100)}%`,
                width: `${Math.abs(ratio * 100 - 50)}%`,
              }}
            />
          ) : null}
          <div className="absolute top-1/2 left-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/45" />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
            style={{ left: `${ratio * 100}%` }}
          />
        </div>

        <div className="flex w-full items-center justify-between text-[10px] leading-none text-muted">
          <span>{formatTemplate(ui.timelinePast, { days: 3 })}</span>
          <button
            type="button"
            onClick={resetToNow}
            disabled={atNow}
            className={[
              "px-2 py-1 uppercase tracking-[0.14em] transition-colors",
              atNow
                ? "cursor-default text-muted"
                : "text-foreground hover:opacity-70",
            ].join(" ")}
          >
            {ui.timelineNow}
          </button>
          <span>{formatTemplate(ui.timelineFuture, { days: 3 })}</span>
        </div>
      </div>
    </div>
  );
}
