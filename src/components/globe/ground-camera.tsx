"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";

import { useSimulationTime } from "@/components/simulation-time-provider";
import { getEcfPosition, type SatRec } from "@/lib/orbit";
import { readSimulationMs } from "@/lib/simulation-time";
import { clearSkyDrag, markSkyDrag } from "@/lib/sky-drag";
import {
  directionToAzimuthElevation,
  dragLookByPointer,
  lookDirection,
  observerFrame,
  slewLook,
  type ObserverFrame,
} from "@/lib/sky";

interface GroundCameraProps {
  active: boolean;
  entry: number;
  latitude: number;
  longitude: number;
  activeNoradId: number | null;
  trackRequest: number;
  satellites: { noradId: number; satrec: SatRec }[];
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

export function GroundCamera({
  active,
  entry,
  latitude,
  longitude,
  activeNoradId,
  trackRequest,
  satellites,
}: GroundCameraProps) {
  const { camera, gl } = useThree();
  const { clockRef } = useSimulationTime();
  const azimuth = useRef(INITIAL_AZIMUTH);
  const elevation = useRef(INITIAL_ELEVATION);
  const fov = useRef(DEFAULT_FOV);
  const tracking = useRef(false);
  const seenNoradId = useRef<number | null>(null);
  const seenTrackRequest = useRef(trackRequest);
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
    let originX = 0;
    let originY = 0;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || blend.current < 1) {
        return;
      }
      dragging = true;
      moved = false;
      originX = event.clientX;
      originY = event.clientY;
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
      if (Math.hypot(event.clientX - originX, event.clientY - originY) > 3) {
        moved = true;
        tracking.current = false;
        markSkyDrag();
      }
      if (!moved) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const next = dragLookByPointer(
        observerFrame(latitude, longitude, frame.current),
        azimuth.current,
        elevation.current,
        dx,
        dy,
        rect.width,
        rect.height,
        fov.current,
        MIN_ELEVATION,
        MAX_ELEVATION,
      );
      azimuth.current = next.azimuth;
      elevation.current = next.elevation;
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
  }, [active, gl, latitude, longitude]);

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
    const entered = seenEntry.current !== entry;
    if (entered) {
      seenEntry.current = entry;
      fov.current = DEFAULT_FOV;
      startPosition.current.copy(camera.position);
      startQuaternion.current.copy(camera.quaternion);
      blend.current = 0;
      seenNoradId.current = activeNoradId;
      seenTrackRequest.current = trackRequest;
      tracking.current = activeNoradId !== null;
      if (!tracking.current) {
        azimuth.current = INITIAL_AZIMUTH;
        elevation.current = INITIAL_ELEVATION;
      }
    } else if (
      seenNoradId.current !== activeNoradId ||
      seenTrackRequest.current !== trackRequest
    ) {
      seenNoradId.current = activeNoradId;
      seenTrackRequest.current = trackRequest;
      tracking.current = activeNoradId !== null;
    }

    if (tracking.current && activeNoradId !== null) {
      const satellite = satellites.find((item) => item.noradId === activeNoradId);
      const position = satellite
        ? getEcfPosition(satellite.satrec, new Date(readSimulationMs(clockRef.current)))
        : null;
      const aim = position ? directionToAzimuthElevation(basis, position) : null;
      if (aim) {
        const targetElevation = clamp(aim.elevation, MIN_ELEVATION, MAX_ELEVATION);
        if (entered) {
          azimuth.current = aim.azimuth;
          elevation.current = targetElevation;
        } else {
          const next = slewLook(
            azimuth.current,
            elevation.current,
            aim.azimuth,
            targetElevation,
            Math.min(delta, 0.05),
          );
          azimuth.current = next.azimuth;
          elevation.current = next.elevation;
        }
      }
    }

    const direction = lookDirection(basis, azimuth.current, elevation.current, look.current);
    lookTarget.current.copy(basis.position).add(direction);

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
