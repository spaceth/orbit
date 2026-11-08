"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";

import { clearSkyDrag, markSkyDrag } from "@/lib/sky-drag";
import { lookDirection, observerFrame, type ObserverFrame } from "@/lib/sky";

interface GroundCameraProps {
  active: boolean;
  entry: number;
  latitude: number;
  longitude: number;
}

const INITIAL_AZIMUTH = 0;
const INITIAL_ELEVATION = 20;
const MIN_ELEVATION = -8;
const MAX_ELEVATION = 88;
const MIN_FOV = 35;
const MAX_FOV = 80;
const DEFAULT_FOV = 58;
const GROUND_NEAR = 0.001;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function GroundCamera({ active, entry, latitude, longitude }: GroundCameraProps) {
  const { camera, gl } = useThree();
  const azimuth = useRef(INITIAL_AZIMUTH);
  const elevation = useRef(INITIAL_ELEVATION);
  const fov = useRef(DEFAULT_FOV);
  const seenEntry = useRef(0);
  const blend = useRef(1);
  const startPosition = useRef(new Vector3());
  const startQuaternion = useRef(new Quaternion());
  const frame = useRef<ObserverFrame>({
    position: new Vector3(),
    up: new Vector3(),
    north: new Vector3(),
    east: new Vector3(),
  });
  const look = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());
  const endQuaternion = useRef(new Quaternion());

  useEffect(() => {
    if (!active) {
      return;
    }

    const element = gl.domElement;
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || blend.current < 1) {
        return;
      }
      dragging = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        moved = true;
        markSkyDrag();
      }
      azimuth.current -= dx * 0.18;
      elevation.current = clamp(elevation.current - dy * 0.15, MIN_ELEVATION, MAX_ELEVATION);
    };

    const onPointerUp = () => {
      dragging = false;
      if (moved) {
        window.setTimeout(clearSkyDrag, 0);
      } else {
        clearSkyDrag();
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      fov.current = clamp(fov.current + event.deltaY * 0.03, MIN_FOV, MAX_FOV);
    };

    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      dragging = false;
    };
  }, [active, gl]);

  useFrame((_, delta) => {
    if (!active) {
      return;
    }

    const perspective = camera as PerspectiveCamera;
    if (perspective.near !== GROUND_NEAR || perspective.fov !== fov.current) {
      perspective.near = GROUND_NEAR;
      perspective.fov = fov.current;
      perspective.updateProjectionMatrix();
    }

    const basis = observerFrame(latitude, longitude, frame.current);
    const direction = lookDirection(basis, azimuth.current, elevation.current, look.current);
    lookTarget.current.copy(basis.position).add(direction);

    if (seenEntry.current !== entry) {
      seenEntry.current = entry;
      azimuth.current = INITIAL_AZIMUTH;
      elevation.current = INITIAL_ELEVATION;
      fov.current = DEFAULT_FOV;
      startPosition.current.copy(camera.position);
      startQuaternion.current.copy(camera.quaternion);
      blend.current = 0;
      lookDirection(basis, azimuth.current, elevation.current, look.current);
      lookTarget.current.copy(basis.position).add(look.current);
    }

    camera.up.copy(basis.up);
    camera.position.copy(basis.position);
    camera.lookAt(lookTarget.current);
    endQuaternion.current.copy(camera.quaternion);

    if (blend.current < 1) {
      blend.current = Math.min(1, blend.current + delta * 1.15);
      const t = 1 - (1 - blend.current) ** 3;
      camera.position.lerpVectors(startPosition.current, basis.position, t);
      camera.quaternion.slerpQuaternions(startQuaternion.current, endQuaternion.current, t);
    }
  });

  return null;
}
