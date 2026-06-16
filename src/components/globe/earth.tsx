"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";

import { buildLandMapTexture, type GeoJsonFeatureCollection } from "@/lib/geo";
import type { ThemeColors } from "@/lib/theme";

interface EarthProps {
  colors: ThemeColors;
  onClick?: () => void;
}

export function Earth({ colors, onClick }: EarthProps) {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLand() {
      const response = await fetch("/data/countries-110m.json");
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (!cancelled) {
        setGeoData(data as GeoJsonFeatureCollection);
      }
    }

    void loadLand();

    return () => {
      cancelled = true;
    };
  }, []);

  const mapTexture = useMemo(() => {
    if (!geoData) {
      return null;
    }
    return buildLandMapTexture(geoData, {
      ocean: colors.earthOcean,
      land: colors.earthLand,
    });
  }, [geoData, colors.earthOcean, colors.earthLand]);

  useEffect(() => {
    return () => {
      mapTexture?.dispose();
    };
  }, [mapTexture]);

  return (
    <mesh
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      <sphereGeometry args={[1, 128, 128]} />
      <meshBasicMaterial
        key={mapTexture?.uuid ?? colors.earthOcean}
        map={mapTexture ?? undefined}
        color={mapTexture ? "#ffffff" : colors.earthOcean}
        toneMapped={false}
      />
    </mesh>
  );
}
