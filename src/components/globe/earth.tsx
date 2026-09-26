"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { Color } from "three";

import {
  buildLandMaskTexture,
  getEarthMapSize,
  type EarthMapSize,
  type GeoJsonFeatureCollection,
} from "@/lib/geo";
import type { ThemeColors } from "@/lib/theme";

const EARTH_GEOJSON_URL = "/data/countries-50m.json";
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D landMask;
  uniform vec3 oceanColor;
  uniform vec3 landColor;
  uniform vec3 borderColor;
  varying vec2 vUv;
  void main() {
    vec2 mask = texture2D(landMask, vUv).rg;
    vec3 surface = mix(oceanColor, landColor, min(1.0, mask.r + mask.g));
    gl_FragColor = vec4(mix(surface, borderColor, mask.g), 1.0);
    #include <colorspace_fragment>
  }
`;

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

  const landMask = useMemo(() => {
    if (!geoData) {
      return null;
    }
    return buildLandMaskTexture(geoData, mapSize);
  }, [geoData, mapSize]);

  const uniforms = useMemo(() => ({
    landMask: { value: landMask },
    oceanColor: { value: new Color(colors.earthOcean) },
    landColor: { value: new Color(colors.earthLand) },
    borderColor: { value: new Color(colors.earthLand).lerp(new Color(colors.foreground), 0.22) },
  }), [landMask, colors.earthOcean, colors.earthLand, colors.foreground]);

  useEffect(() => {
    return () => {
      landMask?.dispose();
    };
  }, [landMask]);

  const sphereSegments = mapSize.width >= 4096 ? 256 : 128;

  return (
    <mesh
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onDoubleClick?.();
      }}
    >
      <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
      {landMask ? (
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          toneMapped={false}
        />
      ) : (
        <meshBasicMaterial color={colors.earthOcean} toneMapped={false} />
      )}
    </mesh>
  );
}
