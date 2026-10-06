"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type { BufferGeometry } from "three";

import { decodeLandMesh } from "@/lib/geo";
import type { ThemeColors } from "@/lib/theme";

const LAND_MESH_URL = "/data/land-mesh.bin";

interface EarthProps {
  colors: ThemeColors;
  onDoubleClick?: () => void;
}

export function Earth({ colors, onDoubleClick }: EarthProps) {
  const [landGeometry, setLandGeometry] = useState<BufferGeometry | null>(null);
  const [oceanRadius, setOceanRadius] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadLand() {
      const response = await fetch(LAND_MESH_URL);
      if (!response.ok) {
        return;
      }

      const mesh = decodeLandMesh(await response.arrayBuffer());
      if (cancelled) {
        mesh.geometry.dispose();
        return;
      }

      setLandGeometry(mesh.geometry);
      setOceanRadius(mesh.oceanRadius);
    }

    void loadLand();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      landGeometry?.dispose();
    };
  }, [landGeometry]);

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onDoubleClick?.();
  };

  return (
    <group>
      <mesh onDoubleClick={handleDoubleClick}>
        <sphereGeometry args={[oceanRadius, 128, 128]} />
        <meshBasicMaterial color={colors.earthOcean} toneMapped={false} />
      </mesh>
      {landGeometry ? (
        <mesh geometry={landGeometry} onDoubleClick={handleDoubleClick}>
          <meshBasicMaterial color={colors.earthLand} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}
