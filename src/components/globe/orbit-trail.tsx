"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";

import { getEcfPosition, isGeostationaryTrail, sampleOrbitTrail, type SatRec } from "@/lib/orbit";

const TRAIL_REFRESH_SECONDS = 0.5;

interface OrbitTrailProps {
  satrec: SatRec;
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onSelect: () => void;
}

export function OrbitTrail({
  satrec,
  color,
  isHighlighted,
  isActive,
  onHover,
  onUnhover,
  onSelect,
}: OrbitTrailProps) {
  const [points, setPoints] = useState<Vector3[]>(() =>
    sampleOrbitTrail(satrec, new Date()),
  );
  const pointsRef = useRef<Vector3[]>(points);
  const lastRefreshRef = useRef(0);
  const satrecRef = useRef(satrec);

  useFrame((state) => {
    if (satrecRef.current !== satrec) {
      satrecRef.current = satrec;
      lastRefreshRef.current = 0;
    }

    const now = new Date();
    const current = getEcfPosition(satrec, now);
    if (!current) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    if (elapsed - lastRefreshRef.current >= TRAIL_REFRESH_SECONDS) {
      lastRefreshRef.current = elapsed;
      const trail = sampleOrbitTrail(satrec, now);
      pointsRef.current = trail;
    }

    const trail = pointsRef.current;
    if (trail.length === 0) {
      return;
    }

    if (isGeostationaryTrail(trail)) {
      const radius = current.length();
      const anchorAngle = Math.atan2(current.z, current.x);
      for (let index = 0; index < trail.length; index += 1) {
        const angle = anchorAngle + (index / (trail.length - 1)) * Math.PI * 2;
        trail[index].set(
          Math.cos(angle) * radius,
          current.y,
          Math.sin(angle) * radius,
        );
      }
    } else {
      trail[trail.length - 1].copy(current);
    }

    setPoints(trail.slice());
  });

  const linePoints = useMemo(
    () => points.map((point) => [point.x, point.y, point.z] as [number, number, number]),
    [points],
  );

  const maxOpacity = isHighlighted ? 0.95 : isActive ? 0.7 : 0.3;
  const isGeoRing = isGeostationaryTrail(points);
  const lineWidth = isGeoRing
    ? isHighlighted
      ? 0.5
      : isActive
        ? 0.35
        : 0.25
    : isHighlighted
      ? 1.3
      : isActive
        ? 0.9
        : 0.6;
  const chunkCount = 14;
  const chunks = useMemo(() => {
    const result: Array<{ points: [number, number, number][]; opacity: number }> = [];
    if (linePoints.length < 2) {
      return result;
    }

    const usableChunkCount = Math.min(chunkCount, linePoints.length - 1);
    for (let index = 0; index < usableChunkCount; index += 1) {
      const start = Math.floor((index / usableChunkCount) * (linePoints.length - 1));
      const end = Math.floor(((index + 1) / usableChunkCount) * (linePoints.length - 1)) + 1;
      const chunkPoints = linePoints.slice(start, Math.max(start + 2, end));
      const progress = usableChunkCount <= 1 ? 1 : index / (usableChunkCount - 1);
      result.push({
        points: chunkPoints,
        opacity: maxOpacity * progress,
      });
    }

    return result;
  }, [linePoints, maxOpacity]);

  if (linePoints.length < 2) {
    return null;
  }

  return (
    <group>
      {chunks.map((chunk, index) => {
        return (
          <Line
            key={index}
            points={chunk.points}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={chunk.opacity}
            onPointerOver={(event) => {
              event.stopPropagation();
              onHover();
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              onUnhover();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
          />
        );
      })}
    </group>
  );
}
