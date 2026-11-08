"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Group, Matrix4 } from "three";

import { useSimulationTime } from "@/components/simulation-time-provider";
import skymap from "@/data/skymap.json";
import { readSimulationMs } from "@/lib/simulation-time";
import { SKY_RADIUS, raDecToEci, skyMatrixForDate } from "@/lib/sky";

const STAR_BINS = [
  { maxMagnitude: 1, size: 2.8, opacity: 1 },
  { maxMagnitude: 2.5, size: 2.05, opacity: 0.95 },
  { maxMagnitude: 4, size: 1.45, opacity: 0.78 },
  { maxMagnitude: 6.1, size: 1.05, opacity: 0.5 },
] as const;

function pointsForMagnitude(minMagnitude: number, maxMagnitude: number): Float32Array {
  const eci = { x: 0, y: 0, z: 0 };
  const selected = skymap.stars.filter(
    (star) => star[2] >= minMagnitude && star[2] < maxMagnitude,
  );
  const positions = new Float32Array(selected.length * 3);
  selected.forEach((star, index) => {
    const vector = raDecToEci(star[0], star[1]);
    eci.x = vector.x;
    eci.y = vector.y;
    eci.z = vector.z;
    positions[index * 3] = eci.x * SKY_RADIUS;
    positions[index * 3 + 1] = eci.y * SKY_RADIUS;
    positions[index * 3 + 2] = eci.z * SKY_RADIUS;
  });
  return positions;
}

function linePositions(): Float32Array {
  let count = 0;
  for (const line of skymap.lines) {
    if (line.length >= 2) {
      count += (line.length - 1) * 2;
    }
  }

  const positions = new Float32Array(count * 3);
  let offset = 0;
  const radius = SKY_RADIUS * 0.995;
  for (const line of skymap.lines) {
    for (let index = 0; index < line.length - 1; index += 1) {
      const start = raDecToEci(line[index][0], line[index][1]);
      const end = raDecToEci(line[index + 1][0], line[index + 1][1]);
      positions[offset] = start.x * radius;
      positions[offset + 1] = start.y * radius;
      positions[offset + 2] = start.z * radius;
      positions[offset + 3] = end.x * radius;
      positions[offset + 4] = end.y * radius;
      positions[offset + 5] = end.z * radius;
      offset += 6;
    }
  }
  return positions;
}

function geometryFromPositions(positions: Float32Array): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  return geometry;
}

export function Starfield() {
  const groupRef = useRef<Group>(null);
  const matrix = useMemo(() => new Matrix4(), []);
  const { clockRef } = useSimulationTime();
  const bins = useMemo(() => {
    let previous = Number.NEGATIVE_INFINITY;
    return STAR_BINS.map((bin) => {
      const geometry = geometryFromPositions(pointsForMagnitude(previous, bin.maxMagnitude));
      previous = bin.maxMagnitude;
      return { ...bin, geometry };
    });
  }, []);
  const lines = useMemo(() => geometryFromPositions(linePositions()), []);

  useEffect(() => {
    const group = groupRef.current;
    if (group) {
      group.matrixAutoUpdate = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const bin of bins) {
        bin.geometry.dispose();
      }
      lines.dispose();
    };
  }, [bins, lines]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    skyMatrixForDate(new Date(readSimulationMs(clockRef.current)), matrix);
    group.matrix.copy(matrix);
    group.matrixWorldNeedsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {bins.map((bin) => (
        <points key={bin.maxMagnitude} geometry={bin.geometry} raycast={() => null}>
          <pointsMaterial
            color="#fffaf2"
            size={bin.size}
            sizeAttenuation={false}
            transparent
            opacity={bin.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      ))}
      <lineSegments geometry={lines} raycast={() => null}>
        <lineBasicMaterial
          color="#f5f5f7"
          transparent
          opacity={0.42}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
