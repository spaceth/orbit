"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import { getMoonEcfPosition, MOON_RADIUS_SCENE } from "@/lib/moon";

interface MoonProps {
  bodyColor: string;
}

export function Moon({ bodyColor }: MoonProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) {
      return;
    }
    meshRef.current.position.copy(getMoonEcfPosition(new Date()));
  });

  return (
    <mesh ref={meshRef} raycast={() => null}>
      <sphereGeometry args={[MOON_RADIUS_SCENE, 48, 48]} />
      <meshStandardMaterial
        color={bodyColor}
        emissive={bodyColor}
        emissiveIntensity={0.15}
        roughness={0.85}
        metalness={0}
        toneMapped={false}
      />
    </mesh>
  );
}
