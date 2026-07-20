"use client";

import { useGLTF } from "@react-three/drei";
import {
  Component,
  Suspense,
  useMemo,
  type ReactNode,
} from "react";
import { Box3, Vector3 } from "three";

import type { SatelliteModelConfig } from "@/types/satellite";

interface ModelErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ModelErrorBoundaryState {
  failed: boolean;
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function LoadedSatelliteModel({ model }: { model: SatelliteModelConfig }) {
  const { scene } = useGLTF(model.src);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const normalization = useMemo(() => {
    const bounds = new Box3().setFromObject(clonedScene);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    return {
      center,
      scale: Number.isFinite(maxDimension) && maxDimension > 0 ? 1 / maxDimension : 1,
    };
  }, [clonedScene]);

  const rotation = model.rotation ?? [0, 0, 0];
  const offset = model.offset ?? [0, 0, 0];

  return (
    <group
      position={[offset[0], offset[1], offset[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={model.scale ?? 1}
    >
      <primitive
        object={clonedScene}
        position={[
          -normalization.center.x,
          -normalization.center.y,
          -normalization.center.z,
        ]}
        scale={normalization.scale}
      />
    </group>
  );
}

export function SatelliteModel({
  model,
  fallback,
}: {
  model: SatelliteModelConfig;
  fallback: ReactNode;
}) {
  if (!model.available) {
    return fallback;
  }

  return (
    <ModelErrorBoundary key={model.src} fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedSatelliteModel model={model} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
