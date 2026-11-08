"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PerspectiveCamera, Vector3 } from "three";

import { useSimulationTime } from "@/components/simulation-time-provider";
import { getEcfPosition, type SatRec } from "@/lib/orbit";
import { readSimulationMs } from "@/lib/simulation-time";

interface CameraControllerProps {
  activeNoradId: number | null;
  earthFocused: boolean;
  earthFocusRequest: number;
  groundView: boolean;
  satellites: { noradId: number; satrec: SatRec }[];
}

const EARTH_CENTER = new Vector3(0, 0, 0);
const WORLD_UP = new Vector3(0, 1, 0);
const DEFAULT_CAMERA_DISTANCE = 2.8;
const ORBIT_FOV = 45;
const ORBIT_NEAR = 0.1;
const RETURN_NEAR = 0.001;

function getFocusDistance(satRadius: number): number {
  if (satRadius > 5) {
    return 2.8;
  }
  return 0.55;
}

function lerpFactor(delta: number, speed: number): number {
  return 1 - Math.exp(-speed * delta);
}

function setOrbitProjection(camera: PerspectiveCamera, near: number) {
  if (camera.fov === ORBIT_FOV && camera.near === near) {
    return;
  }
  camera.fov = ORBIT_FOV;
  camera.near = near;
  camera.updateProjectionMatrix();
}

export function CameraController({
  activeNoradId,
  earthFocused,
  earthFocusRequest,
  groundView,
  satellites,
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const desiredCamera = useRef(new Vector3());
  const lastSatPosition = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const viewOffset = useRef(new Vector3());
  const focusSpeed = useRef(12);
  const isFocusing = useRef(false);
  const prevActiveId = useRef<number | null | undefined>(undefined);
  const prevGroundView = useRef(groundView);
  const tightNear = useRef(false);
  const { clockRef } = useSimulationTime();

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

  useEffect(() => {
    if (earthFocusRequest === 0) {
      return;
    }
    isFocusing.current = true;
    focusSpeed.current = 12;
  }, [earthFocusRequest]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (prevGroundView.current !== groundView) {
      const leavingGround = prevGroundView.current && !groundView;
      prevGroundView.current = groundView;
      if (leavingGround) {
        isFocusing.current = true;
        focusSpeed.current = 3.2;
        tightNear.current = true;
        controls.target.set(0, 0, 0);
      }
    }

    if (groundView) {
      controls.enabled = false;
      return;
    }

    controls.enabled = true;
    camera.up.copy(WORLD_UP);
    if (tightNear.current && camera.position.length() > 1.8) {
      tightNear.current = false;
    }
    if (camera instanceof PerspectiveCamera) {
      setOrbitProjection(camera, tightNear.current ? RETURN_NEAR : ORBIT_NEAR);
    }

    const shouldFocusEarth = activeNoradId === null || earthFocused;

    if (shouldFocusEarth) {
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

    const position = getEcfPosition(
      satellite.satrec,
      new Date(readSimulationMs(clockRef.current)),
    );
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
      maxDistance={90}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
    />
  );
}
