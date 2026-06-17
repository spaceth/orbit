"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PerspectiveCamera } from "three";

const MOBILE_QUERY = "(max-width: 640px)";
/** Globe focal point on mobile — 40% from top (default is 50%). */
const MOBILE_CENTER_FROM_TOP = 0.4;

function applyViewportOffset(
  camera: PerspectiveCamera,
  width: number,
  height: number,
  isMobile: boolean,
) {
  if (!isMobile) {
    camera.clearViewOffset();
  } else {
    const offsetY = height * (0.5 - MOBILE_CENTER_FROM_TOP);
    camera.setViewOffset(width, height, 0, offsetY, width, height);
  }
  camera.updateProjectionMatrix();
}

export function CameraViewportOffset() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera.type !== "PerspectiveCamera") {
      return;
    }

    const perspective = camera as PerspectiveCamera;
    const media = window.matchMedia(MOBILE_QUERY);

    const update = () => {
      applyViewportOffset(perspective, size.width, size.height, media.matches);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [camera, size.width, size.height]);

  return null;
}
