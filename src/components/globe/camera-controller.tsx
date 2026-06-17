"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";

import { getEcfPosition, type SatRec } from "@/lib/orbit";

interface CameraControllerProps {
  activeNoradId: number | null;
  satellites: { noradId: number; satrec: SatRec }[];
}

const EARTH_CENTER = new Vector3(0, 0, 0);
const DEFAULT_CAMERA_DISTANCE = 2.8;

function getFocusDistance(satRadius: number): number {
  if (satRadius > 5) {
    return 2.8;
  }
  return 0.55;
}

function lerpFactor(delta: number, speed: number): number {
  return 1 - Math.exp(-speed * delta);
}

export function CameraController({ activeNoradId, satellites }: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const desiredCamera = useRef(new Vector3());
  const lastSatPosition = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const viewOffset = useRef(new Vector3());
  const focusSpeed = useRef(12);
  const isFocusing = useRef(false);
  const prevActiveId = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (prevActiveId.current === undefined) {
      prevActiveId.current = activeNoradId;
      return;
    }

    if (activeNoradId !== prevActiveId.current) {
      prevActiveId.current = activeNoradId;
      isFocusing.current = true;
      focusSpeed.current = 12;
    }
  }, [activeNoradId]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (activeNoradId === null) {
      if (isFocusing.current) {
        const t = lerpFactor(delta, focusSpeed.current);

        viewOffset.current.copy(camera.position).sub(controls.target);
        if (viewOffset.current.lengthSq() < 1e-6) {
          viewOffset.current.set(0, 0, 1);
        } else {
          viewOffset.current.normalize();
        }
        desiredCamera.current
          .copy(viewOffset.current)
          .multiplyScalar(DEFAULT_CAMERA_DISTANCE);

        controls.target.lerp(EARTH_CENTER, t);
        camera.position.lerp(desiredCamera.current, t);

        const focusDone =
          controls.target.distanceToSquared(EARTH_CENTER) < 1e-4 &&
          camera.position.distanceToSquared(desiredCamera.current) < 1e-4;
        if (focusDone) {
          isFocusing.current = false;
        }
      }

      controls.update();
      return;
    }

    const satellite = satellites.find((entry) => entry.noradId === activeNoradId);
    if (!satellite) {
      controls.update();
      return;
    }

    const position = getEcfPosition(satellite.satrec, new Date());
    if (!position) {
      controls.update();
      return;
    }

    if (isFocusing.current) {
      const t = lerpFactor(delta, focusSpeed.current);
      controls.target.lerp(position, t);

      const radius = position.length();
      const focusDistance = getFocusDistance(radius);
      desiredCamera.current
        .copy(position)
        .normalize()
        .multiplyScalar(radius + focusDistance);
      camera.position.lerp(desiredCamera.current, t);

      const focusDone =
        controls.target.distanceToSquared(position) < 1e-4 &&
        camera.position.distanceToSquared(desiredCamera.current) < 1e-4;
      if (focusDone) {
        isFocusing.current = false;
        lastSatPosition.current.copy(position);
      }
    } else {
      movement.current.copy(position).sub(lastSatPosition.current);
      if (movement.current.lengthSq() > 0) {
        controls.target.add(movement.current);
        camera.position.add(movement.current);
      }
      lastSatPosition.current.copy(position);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={0.08}
      maxDistance={40}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
    />
  );
}
