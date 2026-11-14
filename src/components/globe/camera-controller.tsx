"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PerspectiveCamera, Quaternion, Vector3, type Camera } from "three";

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

interface LocationSlew {
  active: boolean;
  pending: boolean;
  seen: number;
  startTarget: Vector3;
  startRadius: number;
  endDir: Vector3;
  from: Quaternion;
  to: Quaternion;
  now: Quaternion;
  distance: number;
  duration: number;
  t: number;
}

const EARTH_CENTER = new Vector3(0, 0, 0);
const WORLD_UP = new Vector3(0, 1, 0);
const UNIT_Z = new Vector3(0, 0, 1);
const START_DIRECTION = new Vector3();
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

function createLocationSlew(): LocationSlew {
  return {
    active: false,
    pending: false,
    seen: 0,
    startTarget: new Vector3(),
    startRadius: DEFAULT_CAMERA_DISTANCE,
    endDir: new Vector3(),
    from: new Quaternion(),
    to: new Quaternion(),
    now: new Quaternion(),
    distance: DEFAULT_CAMERA_DISTANCE,
    duration: 0.7,
    t: 1,
  };
}

function releaseLocationSlew(slew: LocationSlew) {
  slew.active = false;
  slew.pending = false;
}

function armLocationSlew(
  slew: LocationSlew,
  camera: Camera,
  target: Vector3,
  latitude: number,
  longitude: number,
  request: number,
  frame: ObserverFrame,
) {
  const startDirection = START_DIRECTION.copy(camera.position);
  if (startDirection.lengthSq() < 1e-8) {
    startDirection.set(0, 0, 1);
  } else {
    startDirection.normalize();
  }
  const basis = observerFrame(latitude, longitude, frame);
  slew.endDir.copy(basis.up).normalize();
  const viewingGlobe = target.lengthSq() < 0.25;
  const radius = camera.position.length();
  slew.distance = viewingGlobe
    ? Math.min(MAX_LOCATION_DISTANCE, Math.max(MIN_LOCATION_DISTANCE, radius || DEFAULT_CAMERA_DISTANCE))
    : DEFAULT_CAMERA_DISTANCE;
  slew.startTarget.copy(target);
  slew.startRadius = radius || DEFAULT_CAMERA_DISTANCE;
  slew.from.setFromUnitVectors(UNIT_Z, startDirection);
  slew.to.setFromUnitVectors(UNIT_Z, slew.endDir);
  const angle = Math.acos(Math.min(1, Math.max(-1, startDirection.dot(slew.endDir))));
  slew.duration = Math.min(0.95, Math.max(0.45, (angle / Math.PI) * 1.05));
  slew.t = 0;
  slew.active = true;
  slew.pending = false;
  slew.seen = request;
}

function stepLocationSlew(slew: LocationSlew, camera: Camera, target: Vector3, desired: Vector3, delta: number) {
  slew.t = Math.min(1, slew.t + delta / slew.duration);
  const blend = smoothstep(slew.t);
  slew.now.copy(slew.from).slerp(slew.to, blend);
  desired
    .copy(UNIT_Z)
    .applyQuaternion(slew.now)
    .multiplyScalar(slew.startRadius + (slew.distance - slew.startRadius) * blend);
  target.lerpVectors(slew.startTarget, EARTH_CENTER, blend);
  camera.position.copy(desired);
  if (Math.abs(desired.y) > desired.length() * 0.92) {
    camera.up.set(0, 0, desired.y > 0 ? -1 : 1);
  }
  if (slew.t >= 1) {
    target.copy(EARTH_CENTER);
    camera.position.copy(slew.endDir).multiplyScalar(slew.distance);
  }
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
  const slew = useRef(createLocationSlew());
  const locationFrame = useRef<ObserverFrame>({
    position: new Vector3(),
    up: new Vector3(),
    north: new Vector3(),
    east: new Vector3(),
  });
  const satellitesById = useMemo(
    () => new Map(satellites.map((satellite) => [satellite.noradId, satellite])),
    [satellites],
  );
  const { clockRef } = useSimulationTime();

  useEffect(() => {
    const previous = prevActiveId.current;
    prevActiveId.current = activeNoradId;
    if (previous === activeNoradId || (previous === undefined && activeNoradId === null)) {
      return;
    }

    releaseLocationSlew(slew.current);
    isFocusing.current = true;
    focusSpeed.current = 12;
  }, [activeNoradId]);

  useEffect(() => {
    if (earthFocusRequest === 0) {
      return;
    }
    releaseLocationSlew(slew.current);
    isFocusing.current = true;
    focusSpeed.current = 12;
  }, [earthFocusRequest]);

  useEffect(() => {
    const locationSlew = slew.current;
    if (locationFocusRequest === 0 || locationFocusRequest === locationSlew.seen) {
      return;
    }
    if (groundView) {
      locationSlew.seen = locationFocusRequest;
      return;
    }
    locationSlew.pending = true;
  }, [groundView, locationFocusRequest]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const locationSlew = slew.current;
    if (prevGroundView.current !== groundView) {
      const leavingGround = prevGroundView.current && !groundView;
      const enteringGround = groundView && !prevGroundView.current;
      prevGroundView.current = groundView;
      if (enteringGround) {
        releaseLocationSlew(locationSlew);
        isFocusing.current = false;
      }
      if (leavingGround) {
        releaseLocationSlew(locationSlew);
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

    if (locationSlew.pending) {
      armLocationSlew(
        locationSlew,
        camera,
        controls.target,
        latitude,
        longitude,
        locationFocusRequest,
        locationFrame.current,
      );
      isFocusing.current = true;
    }

    if (locationSlew.active) {
      if (isFocusing.current) {
        stepLocationSlew(locationSlew, camera, controls.target, desiredCamera.current, delta);
        if (locationSlew.t >= 1) {
          isFocusing.current = false;
          if (activeNoradId === null || earthFocused) {
            locationSlew.active = false;
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

    const satellite = satellitesById.get(activeNoradId);
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
      const standOff = getFocusDistance(radius);
      desiredCamera.current
        .copy(position)
        .normalize()
        .multiplyScalar(radius + standOff);
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
        if (!slew.current.active) {
          return;
        }
        releaseLocationSlew(slew.current);
        isFocusing.current = false;
      }}
    />
  );
}
