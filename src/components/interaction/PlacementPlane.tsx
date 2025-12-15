import React, { useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { BasketType } from "../../types/basket";
import { usePlacement } from "../../hooks/usePlacement";
import { PlacementMode } from "../../context/ConfiguratorProvider";

export type PlacementPlaneProps = {
  basket: BasketType;
  placementMode: PlacementMode;
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

export const PlacementPlane: React.FC<PlacementPlaneProps> = ({ basket, placementMode, onPlace }) => {
  const { planeY } = usePlacement({ basket });

  const { placementLength, placementWidth } = useMemo(
    () => ({
      placementLength: basket.specs.dimensions.internalBottom.length,
      placementWidth: basket.specs.dimensions.internalBottom.width,
    }),
    [basket.specs.dimensions.internalBottom.length, basket.specs.dimensions.internalBottom.width]
  );

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const handlePlace = (event: ThreeEvent<MouseEvent>) => {
    if (placementMode !== "divider") return;
    event.stopPropagation();

    const { z } = event.point;
    const position = clamp(z, -placementWidth / 2, placementWidth / 2);

    onPlace(position, "x", placementLength, 0);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, planeY - 0.5, 0]}
      onClick={handlePlace}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <planeGeometry args={[placementLength, placementWidth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};
