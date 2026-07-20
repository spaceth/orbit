"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Line as ThreeLine,
  LineBasicMaterial,
  Vector3,
} from "three";

import { isGeostationaryTrail, sampleOrbitTrail, type SatRec } from "@/lib/orbit";

const TRAIL_REFRESH_SECONDS = 10;

interface DynamicTrailEndpointProps {
  trailEnd: Vector3;
  currentPosition: Vector3;
  color: string;
  opacity: number;
}

function DynamicTrailEndpoint({
  trailEnd,
  currentPosition,
  color,
  opacity,
}: DynamicTrailEndpointProps) {
  const connector = useMemo(() => {
    const positions = new Float32Array(6);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    const material = new LineBasicMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
    });
    const line = new ThreeLine(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 1;
    return line;
  }, [color, opacity]);

  useEffect(
    () => () => {
      connector.geometry.dispose();
      connector.material.dispose();
    },
    [connector],
  );

  useFrame(() => {
    const positionAttribute = connector.geometry.getAttribute("position");
    const positions = positionAttribute.array as Float32Array;

    positions[0] = trailEnd.x;
    positions[1] = trailEnd.y;
    positions[2] = trailEnd.z;
    positions[3] = currentPosition.x;
    positions[4] = currentPosition.y;
    positions[5] = currentPosition.z;
    positionAttribute.needsUpdate = true;
  });

  return <primitive object={connector} />;
}

interface OrbitTrailProps {
  noradId: number;
  satrec: SatRec;
  currentPosition: Vector3;
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onSelect: () => void;
}

export function OrbitTrail({
  noradId,
  satrec,
  currentPosition,
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
  const nextRefreshRef = useRef<number | null>(null);
  const satrecRef = useRef(satrec);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    const satrecChanged = satrecRef.current !== satrec;
    const refreshPhase =
      ((Math.abs(noradId) * 0.61803398875) % 1) * TRAIL_REFRESH_SECONDS;

    if (satrecChanged) {
      satrecRef.current = satrec;
      setPoints(sampleOrbitTrail(satrec, new Date()));
      nextRefreshRef.current = elapsed + refreshPhase;
      return;
    }

    if (nextRefreshRef.current === null) {
      nextRefreshRef.current = elapsed + refreshPhase;
      return;
    }

    if (elapsed < nextRefreshRef.current) {
      return;
    }

    nextRefreshRef.current = elapsed + TRAIL_REFRESH_SECONDS;
    setPoints(sampleOrbitTrail(satrec, new Date()));
  });

  const linePoints = useMemo(
    () => points.map((point) => [point.x, point.y, point.z] as [number, number, number]),
    [points],
  );

  const maxOpacity = isHighlighted ? 0.95 : isActive ? 0.7 : 0.3;
  const trailEnd = points[points.length - 1];
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
      {trailEnd ? (
        <DynamicTrailEndpoint
          trailEnd={trailEnd}
          currentPosition={currentPosition}
          color={color}
          opacity={maxOpacity}
        />
      ) : null}
    </group>
  );
}
