"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  Quaternion,
  type Group,
  type Mesh,
  type PerspectiveCamera,
  type Vector3,
} from "three";

import { SatelliteModel } from "@/components/globe/satellite-model";
import {
  getEcfPosition,
  getOrbitAlignedQuaternion,
  getTelemetry,
} from "@/lib/orbit";
import type { SatRec } from "@/lib/orbit";
import { getWorldScaleForPixelDiameter } from "@/lib/screen-scale";
import type { SatelliteModelConfig, SatelliteTelemetry } from "@/types/satellite";

const SELECTED_MARKER_PIXEL_SIZE = 7;
const UNSELECTED_MARKER_PIXEL_SIZE = 3;
const DEFAULT_MODEL_WORLD_SCALE = 0.014;
const MARKER_GEOMETRY_DIAMETER = 1;
const ORBIT_ATTITUDE_REFRESH_SECONDS = 0.1;
const DEFAULT_ATTITUDE_SMOOTHING = 7;

interface SatelliteMarkerProps {
  noradId: number;
  satrec: SatRec;
  currentPosition: Vector3;
  tleLine2: string;
  model?: SatelliteModelConfig;
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  onTelemetryUpdate: (noradId: number, telemetry: SatelliteTelemetry) => void;
  onHover: () => void;
  onUnhover: () => void;
  onSelect: () => void;
}

export function SatelliteMarker({
  noradId,
  satrec,
  currentPosition,
  tleLine2,
  model,
  color,
  isHighlighted,
  isActive,
  onTelemetryUpdate,
  onHover,
  onUnhover,
  onSelect,
}: SatelliteMarkerProps) {
  const markerRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const lastUpdateRef = useRef(0);
  const lastAttitudeUpdateRef = useRef(0);
  const targetAttitudeRef = useRef(new Quaternion());
  const attitudeInitializedRef = useRef(false);
  const showModel = Boolean(model?.available && isActive);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    const date = new Date();
    const position = getEcfPosition(satrec, date);

    if (!position || !markerRef.current) {
      return;
    }

    currentPosition.copy(position);
    markerRef.current.position.copy(currentPosition);

    const orbitAlignment = model?.orbitAlignment;
    const shouldAlignModel =
      showModel && orbitAlignment?.enabled !== false;

    if (!shouldAlignModel) {
      markerRef.current.quaternion.identity();
      attitudeInitializedRef.current = false;
    } else {
      if (now - lastAttitudeUpdateRef.current >= ORBIT_ATTITUDE_REFRESH_SECONDS) {
        const attitude = getOrbitAlignedQuaternion(
          satrec,
          date,
          position,
          orbitAlignment?.forwardAxis,
          orbitAlignment?.nadirAxis,
        );
        if (attitude) {
          targetAttitudeRef.current.copy(attitude);
          lastAttitudeUpdateRef.current = now;
        }
      }

      if (!attitudeInitializedRef.current) {
        markerRef.current.quaternion.copy(targetAttitudeRef.current);
        attitudeInitializedRef.current = true;
      } else {
        const smoothing = Math.max(
          0,
          orbitAlignment?.smoothing ?? DEFAULT_ATTITUDE_SMOOTHING,
        );
        const interpolation = 1 - Math.exp(-smoothing * delta);
        markerRef.current.quaternion.slerp(
          targetAttitudeRef.current,
          interpolation,
        );
      }
    }

    const markerScale = showModel && model
      ? model.orbitWorldScale ?? DEFAULT_MODEL_WORLD_SCALE
      : getWorldScaleForPixelDiameter(
          state.camera as PerspectiveCamera,
          position,
          isActive && !model?.available
            ? SELECTED_MARKER_PIXEL_SIZE
            : UNSELECTED_MARKER_PIXEL_SIZE,
          state.size.height,
          MARKER_GEOMETRY_DIAMETER,
        );
    markerRef.current.scale.setScalar(markerScale);

    if (glowRef.current) {
      glowRef.current.position.copy(position);
      glowRef.current.scale.setScalar(markerScale * 1.9);
    }

    if (now - lastUpdateRef.current > 0.1) {
      const telemetry = getTelemetry(satrec, tleLine2, date);
      if (telemetry) {
        onTelemetryUpdate(noradId, telemetry);
        lastUpdateRef.current = now;
      }
    }
  });

  const markerSphere = (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHighlighted ? 0.6 : 0.45}
        toneMapped={false}
      />
    </mesh>
  );

  const modelFallback = <group scale={0.4}>{markerSphere}</group>;

  return (
    <group>
      <group
        ref={markerRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onUnhover();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        {showModel && model ? (
          <>
            <SatelliteModel model={model} fallback={modelFallback} />
            <mesh scale={2.25}>
              <sphereGeometry args={[0.5, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </>
        ) : (
          markerSphere
        )}
      </group>
      {isActive && !model?.available ? (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
