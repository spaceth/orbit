"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Mesh, PerspectiveCamera, Vector3 } from "three";

import { getWorldScaleForPixelDiameter } from "@/lib/screen-scale";
import { observerFrame, type ObserverFrame } from "@/lib/sky";

const DOT_PIXELS = 3;
const SURFACE_RADIUS = 1;
const GEOMETRY_DIAMETER = 1;

interface LocationMarkerProps {
  latitude: number;
  longitude: number;
  color: string;
}

export function LocationMarker({ latitude, longitude, color }: LocationMarkerProps) {
  const markerRef = useRef<Mesh>(null);
  const frameRef = useRef<ObserverFrame | null>(null);
  const surfaceRef = useRef(new Vector3());

  useLayoutEffect(() => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }
    const frame = observerFrame(latitude, longitude, frameRef.current ?? undefined);
    frameRef.current = frame;
    marker.position.copy(frame.up).multiplyScalar(SURFACE_RADIUS);
  }, [latitude, longitude]);

  useFrame((state) => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }

    const frame = observerFrame(latitude, longitude, frameRef.current ?? undefined);
    frameRef.current = frame;
    surfaceRef.current.copy(frame.up).multiplyScalar(SURFACE_RADIUS);

    const camera = state.camera as PerspectiveCamera;
    const scale = getWorldScaleForPixelDiameter(
      camera,
      surfaceRef.current,
      DOT_PIXELS,
      state.size.height,
      GEOMETRY_DIAMETER,
    );
    marker.position.copy(frame.up).multiplyScalar(SURFACE_RADIUS + scale * 0.5);
    marker.scale.setScalar(scale);
  });

  return (
    <mesh ref={markerRef} scale={0} raycast={() => null}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        toneMapped={false}
      />
    </mesh>
  );
}
