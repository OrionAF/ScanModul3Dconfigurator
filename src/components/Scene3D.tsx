import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { PlacedItem } from "../types/item";
import { ScanmodulBasket } from "./geometry/BasketGeometry";
import { InteractionManager } from "./interaction/InteractionManager";
import { PlacementPlane } from "./interaction/PlacementPlane";
import { ItemMesh } from "./geometry/ItemMesh";

export type Scene3DProps = {
  basket: BasketType;
  dividers: Divider[];
  items: PlacedItem[];
  placementMode: "x" | "z" | "remove" | null;
  selectedDividerId: string | null;
  isCameraLocked: boolean;
  onPlaceDivider: (position: number, axis: "x" | "z", length?: number, offset?: number) => void;
  onRemoveDivider: (id: string) => void;
  onUpdateDivider: (id: string, updates: Partial<Divider>) => void;
  onSelectDivider: (id: string | null) => void;
  onDeselectAll: () => void;
  isDarkMode: boolean;
  cameraView: "iso" | "top" | "front";
};

const CameraRig: React.FC<{ view: "iso" | "top" | "front"; controlsRef: React.MutableRefObject<any> }> = ({
  view,
  controlsRef,
}) => {
  const vec = useMemo(() => new THREE.Vector3(), []);
  const targetVec = useMemo(() => new THREE.Vector3(0, 100, 0), []);
  const [isAnimating, setIsAnimating] = useState(false);
  const { camera } = useThree();

  useEffect(() => {
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(t);
  }, [view]);

  useFrame(() => {
    if (!isAnimating) return;
    let targetPos: [number, number, number] = [500, 600, 500];
    if (view === "top") targetPos = [0, 1000, 0];
    if (view === "front") targetPos = [0, 150, 900];
    const step = 0.1;
    camera.position.lerp(vec.set(targetPos[0], targetPos[1], targetPos[2]), step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, step);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(vec) < 1) setIsAnimating(false);
  });

  return null;
};

export const Scene3D: React.FC<Scene3DProps> = ({
  basket,
  dividers,
  items,
  placementMode,
  selectedDividerId,
  isCameraLocked,
  onPlaceDivider,
  onRemoveDivider,
  onUpdateDivider,
  onSelectDivider,
  onDeselectAll,
  isDarkMode,
  cameraView,
}) => {
  const controlsRef = useRef<any>(null);

  const handleWrapperSelect = (id: string | null) => {
    if (placementMode === "remove" && id) onRemoveDivider(id);
    else onSelectDivider(id);
  };

  const isDrawingMode = placementMode === "x" || placementMode === "z";

  const SceneContent = () => (
    <>
      <CameraRig view={cameraView} controlsRef={controlsRef} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[400, 800, 400]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-400, 300, -200]} intensity={0.5} color="#dbeafe" />
      <Environment preset="city" />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        enabled={!isDrawingMode}
        enableRotate={!isCameraLocked}
        enablePan={!isCameraLocked}
      />

      <group>
        <ScanmodulBasket height={basket.dimensions.height} />

        <InteractionManager
          basket={basket}
          dividers={dividers}
          selectedDividerId={selectedDividerId}
          onUpdate={onUpdateDivider}
          onSelect={handleWrapperSelect}
          onDeselectAll={onDeselectAll}
          controlsRef={controlsRef}
        />

        {isDrawingMode && (
          <PlacementPlane
            basket={basket}
            placementMode={placementMode as "x" | "z"}
            dividers={dividers}
            onPlace={onPlaceDivider as any}
          />
        )}

        {items.map((item) => (
          <ItemMesh key={item.instanceId} item={item} />
        ))}

        <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={1200} blur={2} far={100} color="#000000" />
      </group>
    </>
  );

  return (
    <Canvas
      shadows
      camera={{ position: [500, 600, 500], fov: 35, near: 10, far: 5000 }}
      dpr={[1, 2]}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        onDeselectAll();
      }}
    >
      <color attach="background" args={[isDarkMode ? "#252525" : "#e5e7eb"]} />
      <SceneContent />
    </Canvas>
  );
};
