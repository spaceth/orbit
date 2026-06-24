"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";

import { buildLandMapTexture, type GeoJsonFeatureCollection } from "@/lib/geo";
import type { ThemeColors } from "@/lib/theme";

const EARTH_GEOJSON_URL = "/data/countries-50m.json";
const EARTH_MAP_SIZE = { width: 16384, height: 8192 } as const;

interface EarthProps {
  colors: ThemeColors;
  onDoubleClick?: () => void;
}

export function Earth({ colors, onDoubleClick }: EarthProps) {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLand() {
      const response = await fetch(EARTH_GEOJSON_URL);
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
    return buildLandMapTexture(
      geoData,
      {
        ocean: colors.earthOcean,
        land: colors.earthLand,
      },
      EARTH_MAP_SIZE,
    );
  }, [geoData, colors.earthOcean, colors.earthLand]);

  useEffect(() => {
    return () => {
      mapTexture?.dispose();
    };
  }, [mapTexture]);

  return (
    <mesh
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onDoubleClick?.();
      }}
    >
      <sphereGeometry args={[1, 256, 256]} />
      <meshBasicMaterial
        key={mapTexture?.uuid ?? colors.earthOcean}
        map={mapTexture ?? undefined}
        color={mapTexture ? "#ffffff" : colors.earthOcean}
        toneMapped={false}
      />
    </mesh>
  );
}
