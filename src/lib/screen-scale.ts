import type { PerspectiveCamera } from "three";
import type { Vector3 } from "three";

export function getWorldScaleForPixelDiameter(
  camera: PerspectiveCamera,
  worldPosition: Vector3,
  pixelDiameter: number,
  viewportHeight: number,
  geometryDiameter = 1,
): number {
  const distance = camera.position.distanceTo(worldPosition);
  const vFov = (camera.fov * Math.PI) / 180;
  const worldHeight = 2 * Math.tan(vFov / 2) * distance;
  const worldPerPixel = worldHeight / viewportHeight;
  return (pixelDiameter * worldPerPixel) / geometryDiameter;
}
