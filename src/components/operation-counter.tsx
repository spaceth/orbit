"use client";

import { useEffect, useState } from "react";

import {
  formatOperationDuration,
  getOperationDuration,
  type OperationDuration,
} from "@/lib/operation-time";

interface OperationCounterProps {
  launchDate: string;
}

export function OperationCounter({ launchDate }: OperationCounterProps) {
  const [duration, setDuration] = useState<OperationDuration | null>(() =>
    getOperationDuration(launchDate),
  );

  useEffect(() => {
    const update = () => setDuration(getOperationDuration(launchDate));
    update();
    const intervalId = window.setInterval(update, 60_000);
    return () => window.clearInterval(intervalId);
  }, [launchDate]);

  if (!duration) {
    return null;
  }

  return (
    <p className="mt-1 text-sm tabular-nums text-panel-heading">
      {formatOperationDuration(duration)}
    </p>
  );
}
