"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SatelliteModel } from "@/components/globe/satellite-model";
import { useLocale } from "@/components/locale-provider";
import type { SatelliteModelConfig } from "@/types/satellite";

const DETAIL_DEFAULT_DISTANCE = 3.6;
const DETAIL_MIN_DISTANCE = 0.65;
const DETAIL_MAX_DISTANCE = 6;

function PreviewFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.45, 24, 24]} />
      <meshStandardMaterial color="#888888" roughness={0.65} />
    </mesh>
  );
}

function CameraRig({
  distance,
  resetVersion,
}: {
  distance: number;
  resetVersion: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, distance, resetVersion]);

  return null;
}

function ModelCanvas({
  model,
  detail = false,
  distance = DETAIL_DEFAULT_DISTANCE,
  resetVersion = 0,
}: {
  model: SatelliteModelConfig;
  detail?: boolean;
  distance?: number;
  resetVersion?: number;
}) {
  return (
    <Canvas
      camera={{
        position: [0, 0, detail ? distance : 1.8],
        fov: detail ? 34 : 36,
        near: 0.05,
        far: 100,
      }}
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-3, -2, -4]} intensity={0.9} />
      <group scale={detail ? 1.2 : 1.1}>
        <SatelliteModel model={model} fallback={<PreviewFallback />} />
      </group>
      {detail ? <CameraRig distance={distance} resetVersion={resetVersion} /> : null}
      <OrbitControls
        enablePan={detail}
        enableZoom={detail}
        enableDamping
        dampingFactor={0.08}
        minDistance={detail ? DETAIL_MIN_DISTANCE : 0.85}
        maxDistance={detail ? DETAIL_MAX_DISTANCE : 4}
        autoRotate={!detail}
        autoRotateSpeed={0.65}
      />
    </Canvas>
  );
}

export function SatelliteModelPreview({
  name,
  model,
}: {
  name: string;
  model: SatelliteModelConfig;
}) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(DETAIL_DEFAULT_DISTANCE);
  const [resetVersion, setResetVersion] = useState(0);
  const copy =
    locale === "th"
      ? {
          open: "เปิดโมเดล 3D ขนาดใหญ่",
          close: "ปิด",
          zoomIn: "ซูมเข้า",
          zoomOut: "ซูมออก",
          reset: "รีเซ็ตมุมมอง",
          hint: "ลากเพื่อหมุน · ใช้ล้อเมาส์หรือจีบนิ้วเพื่อซูม",
        }
      : {
          open: "Open large 3D view",
          close: "Close",
          zoomIn: "Zoom in",
          zoomOut: "Zoom out",
          reset: "Reset view",
          hint: "Drag to rotate · use the mouse wheel or pinch to zoom",
        };

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const resetCamera = () => {
    setCameraDistance(DETAIL_DEFAULT_DISTANCE);
    setResetVersion((version) => version + 1);
  };

  return (
    <div className="mt-4">
      <div
        className="relative h-64 w-full overflow-hidden border border-border-subtle bg-background"
        role="group"
        aria-label={`${name} 3D model viewer`}
      >
        <ModelCanvas model={model} />
        <button
          type="button"
          onClick={() => {
            resetCamera();
            setExpanded(true);
          }}
          className="absolute right-2 bottom-2 border border-border-subtle bg-background/90 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground backdrop-blur-sm transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {copy.open}
        </button>
      </div>
      {model.credit ? (
        <p className="mt-1 text-[10px] leading-relaxed text-muted">
          {model.creditUrl ? (
            <a
              href={model.creditUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {model.credit}
            </a>
          ) : (
            model.credit
          )}
          {model.license ? ` · ${model.license}` : null}
        </p>
      ) : null}

      {expanded
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] bg-background text-foreground"
              role="dialog"
              aria-modal="true"
              aria-label={`${name} 3D model detail view`}
            >
              <div className="absolute inset-0">
                <ModelCanvas
                  model={model}
                  detail
                  distance={cameraDistance}
                  resetVersion={resetVersion}
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 sm:p-7">
                <div className="pointer-events-auto border border-border-subtle bg-background/90 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    3D model
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">{name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="pointer-events-auto border border-border-subtle bg-background/90 px-4 py-3 text-xs font-medium uppercase tracking-[0.1em] backdrop-blur-sm transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {copy.close}
                </button>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 p-5 sm:p-7">
                <div className="pointer-events-auto flex flex-wrap justify-center border border-border-subtle bg-background/90 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setCameraDistance((distance) =>
                        Math.max(DETAIL_MIN_DISTANCE, distance - 0.25),
                      )
                    }
                    className="border-r border-border-subtle px-4 py-3 text-xs font-medium transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                  >
                    {copy.zoomIn}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCameraDistance((distance) =>
                        Math.min(DETAIL_MAX_DISTANCE, distance + 0.25),
                      )
                    }
                    className="border-r border-border-subtle px-4 py-3 text-xs font-medium transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                  >
                    {copy.zoomOut}
                  </button>
                  <button
                    type="button"
                    onClick={resetCamera}
                    className="px-4 py-3 text-xs font-medium transition-colors hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                  >
                    {copy.reset}
                  </button>
                </div>
                <p className="bg-background/90 px-3 py-2 text-center text-xs text-muted backdrop-blur-sm">
                  {copy.hint}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
