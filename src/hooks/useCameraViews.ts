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
  const defaultTargetVec = useMemo(() => new THREE.Vector3(0, 100, 0), []);
  const topTargetVec = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    targetViewRef.current = activeView;
    setIsAnimating(true);

    if (activeView === "top") {
      if (controlsRef.current) {
        controlsRef.current.target.copy(topTargetVec);
        if (typeof controlsRef.current.setAzimuthalAngle === "function") {
          controlsRef.current.setAzimuthalAngle(0);
        }
        if (typeof controlsRef.current.setPolarAngle === "function") {
          controlsRef.current.setPolarAngle(0);
        }
        controlsRef.current.update();
      }

      camera.up.set(0, 1, 0);
      camera.lookAt(topTargetVec);
    }

    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [activeView, camera, controlsRef, topTargetVec]);

  useFrame(() => {
    if (!isAnimating) return;
    const [x, y, z] = getTargetPosition(targetViewRef.current);
    const step = 0.1;
    const target = targetViewRef.current === "top" ? topTargetVec : defaultTargetVec;

    camera.position.lerp(vec.set(x, y, z), step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(target, step);
      if (targetViewRef.current === "top") {
        if (typeof controlsRef.current.setAzimuthalAngle === "function") {
          controlsRef.current.setAzimuthalAngle(0);
        }
        if (typeof controlsRef.current.setPolarAngle === "function") {
          controlsRef.current.setPolarAngle(0);
        }
      }
      controlsRef.current.update();
    }
    if (targetViewRef.current === "top") {
      camera.lookAt(target);
    }

    const hasReachedPosition = camera.position.distanceTo(vec) < 1;
    const hasReachedTarget = !controlsRef.current || controlsRef.current.target.distanceTo(target) < 1;

    if (hasReachedPosition && hasReachedTarget) setIsAnimating(false);
  });

  return { effectiveView: activeView, isAnimating };
};
