"use client";

import { useState } from "react";

import { CopyNoradId } from "@/components/copy-norad-id";
import { PassPrediction } from "@/components/pass-prediction";
import { useLocale } from "@/components/locale-provider";
import { VisibilityIcon } from "@/components/visibility-icon";
import type { AddMySatelliteResult } from "@/hooks/use-my-satellites";
import { formatTemplate } from "@/lib/localization";
import type { MySatellite } from "@/lib/my-satellites";
import { getOrbitalAltitudesFromOmm } from "@/lib/omm";
import { formatOmmAge } from "@/lib/operation-time";
import type { OmmData, SatelliteTelemetry } from "@/types/satellite";

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

export function MySatelliteSection({
  satellites,
  omms,
  failedNoradIds,
  hiddenNoradIds,
  activeNoradId,
  hoverNoradId,
  adding,
  onAdd,
  onSelect,
  onHover,
  onToggleVisibility,
  onRemove,
}: {
  satellites: readonly MySatellite[];
  omms: readonly OmmData[];
  failedNoradIds: ReadonlySet<number>;
  hiddenNoradIds: ReadonlySet<number>;
  activeNoradId: number | null;
  hoverNoradId: number | null;
  adding: boolean;
  onAdd: (input: string) => Promise<AddMySatelliteResult>;
  onSelect: (noradId: number) => void;
  onHover: (noradId: number | null) => void;
  onToggleVisibility: (noradId: number) => void;
  onRemove: (noradId: number) => void;
}) {
  const { ui } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [trackedActive, setTrackedActive] = useState(activeNoradId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<AddMySatelliteResult | null>(null);
  const loadedIds = new Set(omms.map((omm) => omm.noradId));

  if (trackedActive !== activeNoradId) {
    setTrackedActive(activeNoradId);
    if (activeNoradId !== null) {
      setExpanded(true);
    }
  }

  const submit = async () => {
    const result = await onAdd(draft);
    if (result.ok) {
      setDraft("");
      setError(null);
      return;
    }
    setError(result);
  };

  const errorMessage =
    error?.ok === false
      ? error.reason === "invalid"
        ? ui.mySatelliteInvalid
        : error.reason === "limit"
          ? ui.mySatelliteLimit
          : error.reason === "unavailable"
            ? ui.ommLoadError
            : ui.mySatelliteNotFound
      : null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="mt-5 flex w-full items-center gap-1.5 text-left text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        <ChevronIcon expanded={expanded} />
        {ui.mySatellites}
      </button>

      {expanded ? (
        <div className="mt-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="block text-sm text-muted" htmlFor="my-satellite-input">
              {ui.mySatellitePlaceholder}
            </label>
            <textarea
              id="my-satellite-input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              rows={3}
              spellCheck={false}
              placeholder={"25544\n1 25544U …\n2 25544 …"}
              className="mt-1 w-full resize-none border border-[var(--material-edge)] bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={adding || draft.trim().length === 0}
              className="round-control pressable mt-2 px-3 py-1 text-sm text-foreground disabled:opacity-50"
            >
              {adding ? ui.mySatelliteAdding : ui.mySatelliteAdd}
            </button>
          </form>
          {errorMessage ? <p className="mt-2 text-sm text-error">{errorMessage}</p> : null}

          {satellites.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{ui.mySatelliteEmpty}</p>
          ) : (
            <div className="mt-2 space-y-1">
              {satellites.map((satellite) => {
                const isAvailable = loadedIds.has(satellite.noradId);
                const isFailed = failedNoradIds.has(satellite.noradId);
                const isActive = activeNoradId === satellite.noradId;
                const isHighlighted = hoverNoradId === satellite.noradId;
                const isVisible = !hiddenNoradIds.has(satellite.noradId);

                return (
                  <div
                    key={satellite.noradId}
                    className={[
                      "flex items-center rounded-xl transition-colors",
                      isActive ? "bg-surface-active" : isHighlighted ? "bg-surface-hover" : "",
                      isFailed ? "opacity-65" : "opacity-100",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(satellite.noradId)}
                      onMouseEnter={() => {
                        if (isAvailable) {
                          onHover(satellite.noradId);
                        }
                      }}
                      onMouseLeave={() => onHover(null)}
                      className={[
                        "flex min-w-0 flex-1 items-center justify-between px-2 py-1 text-left text-sm",
                        isAvailable ? "cursor-pointer" : "cursor-default",
                        !isVisible ? "opacity-50" : "",
                      ].join(" ")}
                    >
                      <span className="font-medium text-foreground">
                        {satellite.name}
                        {isFailed ? (
                          <span className="ml-1 font-normal text-muted opacity-70">
                            {ui.unavailable}
                          </span>
                        ) : null}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted">
                        {satellite.noradId}
                      </span>
                    </button>
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(satellite.noradId)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                        aria-label={
                          isVisible
                            ? formatTemplate(ui.hideSatellite, { name: satellite.name })
                            : formatTemplate(ui.showSatellite, { name: satellite.name })
                        }
                      >
                        <VisibilityIcon visible={isVisible} />
                      </button>
                    ) : null}
                    {satellite.builtin ? null : (
                      <button
                        type="button"
                        onClick={() => onRemove(satellite.noradId)}
                        className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                        aria-label={formatTemplate(ui.removeSatellite, { name: satellite.name })}
                      >
                        <RemoveIcon />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function MySatelliteDetail({
  satellite,
  omm,
  failed,
  telemetry,
  onRename,
}: {
  satellite: MySatellite;
  omm: OmmData | null;
  failed: boolean;
  telemetry: SatelliteTelemetry | null;
  onRename: (noradId: number, name: string) => void;
}) {
  const { ui } = useLocale();
  const [name, setName] = useState(satellite.name);
  const [nameSource, setNameSource] = useState(satellite);

  if (nameSource.noradId !== satellite.noradId || nameSource.name !== satellite.name) {
    setNameSource(satellite);
    setName(satellite.name);
  }

  const commitName = () => {
    const next = name.trim();
    if (!next) {
      setName(satellite.name);
      return;
    }
    if (next !== satellite.name) {
      onRename(satellite.noradId, next);
    }
  };

  const pending = !omm && !failed;
  const altitudes = omm ? getOrbitalAltitudesFromOmm(omm) : null;
  const apogeeKm = telemetry?.apogeeKm ?? altitudes?.apogeeKm ?? null;
  const perigeeKm = telemetry?.perigeeKm ?? altitudes?.perigeeKm ?? null;

  return (
    <>
      <h1 className="mt-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          aria-label={formatTemplate(ui.renameSatellite, { name: satellite.name })}
          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none"
        />
      </h1>
      <p className="mt-1 text-sm text-muted">
        <CopyNoradId key={satellite.noradId} noradId={satellite.noradId} />
        {omm ? ` · OMM ${formatOmmAge(omm.epoch, ui)}` : null}
      </p>
      {apogeeKm !== null && perigeeKm !== null && telemetry ? (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted">{ui.apogee}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {apogeeKm.toFixed(1)} km
            </dd>
          </div>
          <div>
            <dt className="text-muted">{ui.perigee}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {perigeeKm.toFixed(1)} km
            </dd>
          </div>
          <div>
            <dt className="text-muted">{ui.altitude}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {telemetry.altitudeKm.toFixed(1)} km
            </dd>
          </div>
          <div>
            <dt className="text-muted">{ui.velocity}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">
              {telemetry.velocityKmS.toFixed(2)} km/s
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-5 text-sm text-muted">
          {pending ? ui.computingPosition : ui.unavailable}
        </p>
      )}
      {omm ? <PassPrediction omm={omm} name={name} /> : null}
    </>
  );
}

function RemoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5h6v2M8 7l.8 12h6.4L16 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
