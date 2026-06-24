"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";

import {
  buildLandMapTexture,
  getEarthMapSize,
  type EarthMapSize,
  type GeoJsonFeatureCollection,
} from "@/lib/geo";
import type { ThemeColors } from "@/lib/theme";

const EARTH_GEOJSON_URL = "/data/countries-50m.json";

interface EarthProps {
  colors: ThemeColors;
  onDoubleClick?: () => void;
}

export function Earth({ colors, onDoubleClick }: EarthProps) {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);
  const [mapSize] = useState<EarthMapSize>(() => getEarthMapSize());

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
      mapSize,
    );
  }, [geoData, colors.earthOcean, colors.earthLand, mapSize]);

  useEffect(() => {
    return () => {
      mapTexture?.dispose();
    };
  }, [mapTexture]);

  const sphereSegments = mapSize.width >= 8192 ? 256 : 128;

  return (
    <mesh
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onDoubleClick?.();
      }}
    >
      <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
      <meshBasicMaterial
        key={mapTexture?.uuid ?? colors.earthOcean}
        map={mapTexture ?? undefined}
        color={mapTexture ? "#ffffff" : colors.earthOcean}
        toneMapped={false}
      />
    </mesh>
  );
}
