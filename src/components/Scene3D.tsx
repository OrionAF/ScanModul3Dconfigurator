import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { ScanmodulBasket } from "./geometry/BasketGeometry";
import { InteractionManager } from "./interaction/InteractionManager";
import { PlacementPlane } from "./interaction/PlacementPlane";
import { ItemMesh } from "./geometry/ItemMesh";
import { useConfigurator } from "../context/ConfiguratorProvider";
import { useCameraViews } from "../hooks/useCameraViews";

type SceneContentProps = {
  basket: ReturnType<typeof useConfigurator>["currentBasket"];
  dividers: ReturnType<typeof useConfigurator>["dividers"];
  items: ReturnType<typeof useConfigurator>["items"];
  placementMode: ReturnType<typeof useConfigurator>["placementMode"];
  selectedDividerId: ReturnType<typeof useConfigurator>["selectedDividerId"];
  isCameraLocked: ReturnType<typeof useConfigurator>["isCameraLocked"];
  effectiveCameraView: ReturnType<typeof useConfigurator>["effectiveCameraView"];
  placeDivider: ReturnType<typeof useConfigurator>["placeDivider"];
  removeDivider: ReturnType<typeof useConfigurator>["removeDivider"];
  selectDivider: ReturnType<typeof useConfigurator>["selectDivider"];
  deselectAll: ReturnType<typeof useConfigurator>["deselectAll"];
};

const SceneContent: React.FC<SceneContentProps> = ({
  basket,
  dividers,
  items,
  placementMode,
  selectedDividerId,
  isCameraLocked,
  effectiveCameraView,
  placeDivider,
  removeDivider,
  selectDivider,
  deselectAll,
}) => {
  const controlsRef = useRef<any>(null);
  useCameraViews({ view: effectiveCameraView, isLocked: isCameraLocked, controlsRef });

  const handleWrapperSelect = (id: string | null) => {
    if (placementMode === "remove" && id) removeDivider(id);
    else if (placementMode !== "divider") selectDivider(id);
  };

  const isDrawingMode = placementMode === "divider";
  const isCameraInteractionLocked = isCameraLocked || isDrawingMode;

  return (
    <>
      {/* Camera transitions handled via useCameraViews hook */}
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
          enableRotate={!isCameraInteractionLocked}
          enablePan={!isCameraInteractionLocked}
        />

        <group>
          <ScanmodulBasket height={basket.dimensions.height} />

          <InteractionManager
            basket={basket}
            dividers={dividers}
            selectedDividerId={selectedDividerId}
            onSelect={handleWrapperSelect}
            onDeselectAll={deselectAll}
            controlsRef={controlsRef}
            placementMode={placementMode}
          />

          {isDrawingMode && (
            <PlacementPlane basket={basket} placementMode={placementMode} dividers={dividers} onPlace={placeDivider as any} />
          )}

          {items.map((item) => (
            <ItemMesh key={item.instanceId} item={item} />
          ))}

          <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={1200} blur={2} far={100} color="#000000" />
        </group>
      </>
    );
  };

export const Scene3D: React.FC = () => {
  const {
    currentBasket: basket,
    dividers,
    items,
    placementMode,
    selectedDividerId,
    isCameraLocked,
    placeDivider,
    removeDivider,
    selectDivider,
    deselectAll,
    isDarkMode,
    effectiveCameraView,
  } = useConfigurator();

  return (
    <Canvas
      shadows
      camera={{ position: [500, 600, 500], fov: 35, near: 10, far: 5000 }}
      dpr={[1, 2]}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        deselectAll();
      }}
    >
      <color attach="background" args={[isDarkMode ? "#252525" : "#e5e7eb"]} />
      <SceneContent
        basket={basket}
        dividers={dividers}
        items={items}
        placementMode={placementMode}
        selectedDividerId={selectedDividerId}
        isCameraLocked={isCameraLocked}
        effectiveCameraView={effectiveCameraView}
        placeDivider={placeDivider}
        removeDivider={removeDivider}
        selectDivider={selectDivider}
        deselectAll={deselectAll}
      />
    </Canvas>
  );
};
