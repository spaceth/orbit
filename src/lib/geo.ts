import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from "three";

type GeoJsonPosition = [number, number] | [number, number, number];
type GeoJsonRing = GeoJsonPosition[];
type GeoJsonPolygon = GeoJsonRing[];
type GeoJsonMultiPolygon = GeoJsonPolygon[];

export interface GeoJsonFeatureCollection {
  features: Array<{
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
}

export interface EarthMapColors {
  ocean: string;
  land: string;
}

export interface EarthMapSize {
  width: number;
  height: number;
}

/** Largest equirectangular bake — desktop GPUs with high texture limits. */
export const DESKTOP_MAP_SIZE: EarthMapSize = { width: 16384, height: 8192 };

/** Safe fallback for mobile GPUs (iOS Safari is typically capped at 4096). */
export const MOBILE_MAP_SIZE: EarthMapSize = { width: 4096, height: 2048 };

export function getMaxTextureSize(): number {
  if (typeof document === "undefined") {
    return 4096;
  }

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!gl) {
    return 4096;
  }

  return gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
}

/** Pick the largest 2:1 map that fits within the device WebGL texture limit. */
export function getEarthMapSize(maxTextureSize = getMaxTextureSize()): EarthMapSize {
  if (maxTextureSize >= DESKTOP_MAP_SIZE.width) {
    return DESKTOP_MAP_SIZE;
  }
  if (maxTextureSize >= 8192) {
    return { width: 8192, height: 4096 };
  }
  return MOBILE_MAP_SIZE;
}

function lonToX(lon: number, width: number): number {
  return ((lon + 180) / 360) * width;
}

function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height;
}

function isRing(value: unknown): value is GeoJsonRing {
  return Array.isArray(value) && value.length > 0 && Array.isArray(value[0]);
}

function isPolygon(value: unknown): value is GeoJsonPolygon {
  return Array.isArray(value) && value.length > 0 && isRing(value[0]);
}

function isMultiPolygon(value: unknown): value is GeoJsonMultiPolygon {
  return Array.isArray(value) && value.length > 0 && isPolygon(value[0]);
}

function drawPolygon(
  context: CanvasRenderingContext2D,
  polygon: GeoJsonPolygon,
  width: number,
  height: number,
) {
  context.beginPath();
  for (const ring of polygon) {
    if (ring.length < 3) {
      continue;
    }

    const [firstLon, firstLat] = ring[0];
    context.moveTo(lonToX(firstLon, width), latToY(firstLat, height));
    for (let index = 1; index < ring.length; index += 1) {
      const [lon, lat] = ring[index];
      context.lineTo(lonToX(lon, width), latToY(lat, height));
    }
    context.closePath();
  }
  context.fill("evenodd");
}

/** Vector GeoJSON → high-res equirectangular land mask (no border strokes). */
export function buildLandMapTexture(
  data: GeoJsonFeatureCollection,
  colors: EarthMapColors,
  size: EarthMapSize = getEarthMapSize(),
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not create map canvas");
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = colors.ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = colors.land;

  for (const feature of data.features) {
    const { geometry } = feature;

    if (geometry.type === "Polygon" && isPolygon(geometry.coordinates)) {
      drawPolygon(context, geometry.coordinates, canvas.width, canvas.height);
    }

    if (geometry.type === "MultiPolygon" && isMultiPolygon(geometry.coordinates)) {
      for (const polygon of geometry.coordinates) {
        drawPolygon(context, polygon, canvas.width, canvas.height);
      }
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(16, getMaxTextureSize() >= 8192 ? 16 : 4);
  texture.needsUpdate = true;
  return texture;
}
