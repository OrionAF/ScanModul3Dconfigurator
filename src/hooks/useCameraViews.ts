import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CameraView } from "../context/ConfiguratorProvider";

type UseCameraViewsOptions = {
  view: CameraView;
  isLocked: boolean;
  controlsRef: React.MutableRefObject<any>;
};

const getTargetPosition = (view: CameraView): [number, number, number] => {
  if (view === "top") return [0, 1000, 0];
  if (view === "front") return [0, 150, 900];
  return [500, 600, 500];
};

export const useCameraViews = ({ view, isLocked, controlsRef }: UseCameraViewsOptions) => {
  const { camera } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);
  const activeView = isLocked ? "top" : view;
  const targetViewRef = useRef<CameraView>(activeView);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const targetVec = useMemo(() => new THREE.Vector3(0, 100, 0), []);

  useEffect(() => {
    targetViewRef.current = activeView;
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [activeView]);

  useFrame(() => {
    if (!isAnimating) return;
    const [x, y, z] = getTargetPosition(targetViewRef.current);
    const step = 0.1;
    camera.position.lerp(vec.set(x, y, z), step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, step);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(vec) < 1) setIsAnimating(false);
  });

  return { effectiveView: activeView, isAnimating };
};
