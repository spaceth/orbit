"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createSimulationClock,
  readSimulationMs,
  resetSimulationClock,
  seekSimulationClock,
  setSimulationRate,
  stepSimulationRate,
  type SimulationClock,
} from "@/lib/simulation-time";

interface SimulationTimeContextValue {
  offsetMs: number;
  rate: number;
  clockRef: { readonly current: SimulationClock };
  setOffsetMs: (offsetMs: number) => void;
  setRate: (rate: number) => void;
  stepRate: (direction: -1 | 1) => void;
  resetToNow: () => void;
}

const SimulationTimeContext = createContext<SimulationTimeContextValue | null>(null);

export function SimulationTimeProvider({ children }: { children: ReactNode }) {
  const clockRef = useRef<SimulationClock>(createSimulationClock());
  const [offsetMs, setOffsetMsState] = useState(0);
  const [rate, setRateState] = useState(1);

  const publish = useCallback((realNow = Date.now()) => {
    const simMs = readSimulationMs(clockRef.current, realNow);
    const nextOffset = simMs - realNow;
    const nextRate = clockRef.current.rate;
    setOffsetMsState((current) => (current === nextOffset ? current : nextOffset));
    setRateState((current) => (current === nextRate ? current : nextRate));
  }, []);

  const setOffsetMs = useCallback(
    (next: number) => {
      const realNow = Date.now();
      seekSimulationClock(clockRef.current, next, realNow);
      publish(realNow);
    },
    [publish],
  );

  const setRate = useCallback(
    (next: number) => {
      const realNow = Date.now();
      setSimulationRate(clockRef.current, next, realNow);
      publish(realNow);
    },
    [publish],
  );

  const stepRate = useCallback(
    (direction: -1 | 1) => {
      const realNow = Date.now();
      const next = stepSimulationRate(clockRef.current.rate, direction);
      setSimulationRate(clockRef.current, next, realNow);
      publish(realNow);
    },
    [publish],
  );

  const resetToNow = useCallback(() => {
    const realNow = Date.now();
    resetSimulationClock(clockRef.current, realNow);
    publish(realNow);
  }, [publish]);

  const value = useMemo(
    () => ({ offsetMs, rate, clockRef, setOffsetMs, setRate, stepRate, resetToNow }),
    [offsetMs, rate, setOffsetMs, setRate, stepRate, resetToNow],
  );

  return (
    <SimulationTimeContext.Provider value={value}>{children}</SimulationTimeContext.Provider>
  );
}

export function useSimulationTime(): SimulationTimeContextValue {
  const value = useContext(SimulationTimeContext);
  if (!value) {
    throw new Error("useSimulationTime must be used within SimulationTimeProvider");
  }
  return value;
}
