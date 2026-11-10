"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";

import { useSimulationTime } from "@/components/simulation-time-provider";
import { getEcfPosition, type SatRec } from "@/lib/orbit";
import { readSimulationMs } from "@/lib/simulation-time";
import { observerFrame, type ObserverFrame } from "@/lib/sky";

interface CameraControllerProps {
  activeNoradId: number | null;
  earthFocused: boolean;
  earthFocusRequest: number;
  groundView: boolean;
  latitude: number;
  longitude: number;
  locationFocusRequest: number;
  satellites: { noradId: number; satrec: SatRec }[];
}

const EARTH_CENTER = new Vector3(0, 0, 0);
const WORLD_UP = new Vector3(0, 1, 0);
const UNIT_Z = new Vector3(0, 0, 1);
const DEFAULT_CAMERA_DISTANCE = 2.8;
const MIN_LOCATION_DISTANCE = 1.6;
const MAX_LOCATION_DISTANCE = 12;
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

function smoothstep(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
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
  latitude,
  longitude,
  locationFocusRequest,
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
  const locationFocus = useRef(false);
  const pendingLocation = useRef(false);
  const seenLocationRequest = useRef(0);
  const locationFocusRequestRef = useRef(locationFocusRequest);
  const latitudeRef = useRef(latitude);
  const longitudeRef = useRef(longitude);
  const startTarget = useRef(new Vector3());
  const startCamera = useRef(new Vector3());
  const startDir = useRef(new Vector3());
  const endDir = useRef(new Vector3());
  const fromQuat = useRef(new Quaternion());
  const toQuat = useRef(new Quaternion());
  const nowQuat = useRef(new Quaternion());
  const focusDistance = useRef(DEFAULT_CAMERA_DISTANCE);
  const focusDuration = useRef(0.7);
  const focusT = useRef(1);
  const locationFrame = useRef<ObserverFrame>({
    position: new Vector3(),
    up: new Vector3(),
    north: new Vector3(),
    east: new Vector3(),
  });
  const { clockRef } = useSimulationTime();

  latitudeRef.current = latitude;
  longitudeRef.current = longitude;
  locationFocusRequestRef.current = locationFocusRequest;

  useEffect(() => {
    if (prevActiveId.current === undefined) {
      prevActiveId.current = activeNoradId;
      return;
    }

    if (activeNoradId !== prevActiveId.current) {
      prevActiveId.current = activeNoradId;
      locationFocus.current = false;
      pendingLocation.current = false;
      isFocusing.current = true;
      focusSpeed.current = 12;
    }
  }, [activeNoradId]);

  useEffect(() => {
    if (earthFocusRequest === 0) {
      return;
    }
    locationFocus.current = false;
    pendingLocation.current = false;
    isFocusing.current = true;
    focusSpeed.current = 12;
  }, [earthFocusRequest]);

  useEffect(() => {
    if (locationFocusRequest === 0 || locationFocusRequest === seenLocationRequest.current) {
      return;
    }
    if (groundView) {
      seenLocationRequest.current = locationFocusRequest;
      return;
    }
    pendingLocation.current = true;
  }, [groundView, locationFocusRequest]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (prevGroundView.current !== groundView) {
      const leavingGround = prevGroundView.current && !groundView;
      const enteringGround = groundView && !prevGroundView.current;
      prevGroundView.current = groundView;
      if (enteringGround) {
        locationFocus.current = false;
        pendingLocation.current = false;
        isFocusing.current = false;
      }
      if (leavingGround) {
        locationFocus.current = false;
        pendingLocation.current = false;
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

    if (pendingLocation.current) {
      const startDirection = startDir.current.copy(camera.position);
      if (startDirection.lengthSq() < 1e-8) {
        startDirection.set(0, 0, 1);
      } else {
        startDirection.normalize();
      }
      const frame = observerFrame(
        latitudeRef.current,
        longitudeRef.current,
        locationFrame.current,
      );
      endDir.current.copy(frame.up).normalize();
      const viewingGlobe = controls.target.lengthSq() < 0.25;
      const radius = camera.position.length();
      focusDistance.current = viewingGlobe
        ? Math.min(MAX_LOCATION_DISTANCE, Math.max(MIN_LOCATION_DISTANCE, radius || DEFAULT_CAMERA_DISTANCE))
        : DEFAULT_CAMERA_DISTANCE;
      startTarget.current.copy(controls.target);
      startCamera.current.copy(camera.position);
      fromQuat.current.setFromUnitVectors(UNIT_Z, startDirection);
      toQuat.current.setFromUnitVectors(UNIT_Z, endDir.current);
      const angle = Math.acos(Math.min(1, Math.max(-1, startDirection.dot(endDir.current))));
      focusDuration.current = Math.min(0.95, Math.max(0.45, (angle / Math.PI) * 1.05));
      focusT.current = 0;
      locationFocus.current = true;
      isFocusing.current = true;
      pendingLocation.current = false;
      seenLocationRequest.current = locationFocusRequestRef.current;
    }

    if (locationFocus.current) {
      if (isFocusing.current) {
        focusT.current = Math.min(1, focusT.current + delta / focusDuration.current);
        const blend = smoothstep(focusT.current);
        nowQuat.current.copy(fromQuat.current).slerp(toQuat.current, blend);
        const startRadius = startCamera.current.length() || DEFAULT_CAMERA_DISTANCE;
        desiredCamera.current
          .copy(UNIT_Z)
          .applyQuaternion(nowQuat.current)
          .multiplyScalar(startRadius + (focusDistance.current - startRadius) * blend);
        controls.target.lerpVectors(startTarget.current, EARTH_CENTER, blend);
        camera.position.copy(desiredCamera.current);
        if (Math.abs(desiredCamera.current.y) > desiredCamera.current.length() * 0.92) {
          camera.up.set(0, 0, desiredCamera.current.y > 0 ? -1 : 1);
        }
        if (focusT.current >= 1) {
          isFocusing.current = false;
          controls.target.copy(EARTH_CENTER);
          camera.position.copy(endDir.current).multiplyScalar(focusDistance.current);
          if (activeNoradId === null || earthFocused) {
            locationFocus.current = false;
          }
        }
      }
      controls.update();
      return;
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
      onStart={() => {
        if (!locationFocus.current) {
          return;
        }
        locationFocus.current = false;
        pendingLocation.current = false;
        isFocusing.current = false;
      }}
    />
  );
}
