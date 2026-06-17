"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { PerspectiveCamera } from "three";

import {
  MOBILE_CAMERA_CENTER_COLLAPSED,
  MOBILE_CAMERA_CENTER_READING,
  MOBILE_MEDIA_QUERY,
} from "@/lib/mobile-layout";

function applyViewportOffset(
  camera: PerspectiveCamera,
  width: number,
  height: number,
  isMobile: boolean,
  readingMode: boolean,
) {
  if (!isMobile) {
    camera.clearViewOffset();
  } else {
    const centerFromTop = readingMode
      ? MOBILE_CAMERA_CENTER_READING
      : MOBILE_CAMERA_CENTER_COLLAPSED;
    const offsetY = height * (0.5 - centerFromTop);
    camera.setViewOffset(width, height, 0, offsetY, width, height);
  }
  camera.updateProjectionMatrix();
}

interface CameraViewportOffsetProps {
  mobileReadingMode: boolean;
}

export function CameraViewportOffset({ mobileReadingMode }: CameraViewportOffsetProps) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera.type !== "PerspectiveCamera") {
      return;
    }

    const perspective = camera as PerspectiveCamera;
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);

    const update = () => {
      applyViewportOffset(
        perspective,
        size.width,
        size.height,
        media.matches,
        mobileReadingMode,
      );
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [camera, size.width, size.height, mobileReadingMode]);

  return null;
}
