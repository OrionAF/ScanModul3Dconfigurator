import React from "react";
import { Divider } from "../../types/divider";
import { BasketType } from "../../types/basket";
import { DividerMesh } from "../geometry/DividerMesh";
import { usePlacement } from "../../hooks/usePlacement";

export type PlacementPlaneProps = {
  basket: BasketType;
  placementMode: "x" | "z";
  dividers: Divider[];
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

export const PlacementPlane: React.FC<PlacementPlaneProps> = ({ basket, placementMode, dividers, onPlace }) => {
  const { preview, handlePointerMove, handlePointerDown, handlePointerUp, planeY } = usePlacement({
    basket,
    placementMode,
    onPlace,
  });

  const CursorViz = () => {
    if (!preview.cursor || preview.drawing) return null;
    return (
      <mesh position={[preview.cursor.x, planeY, preview.cursor.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 16]} />
        <meshBasicMaterial color={placementMode === "x" ? "#fbbf24" : "#34d399"} toneMapped={false} />
      </mesh>
    );
  };

  const DragViz = () => {
    if (!preview.dividerPreview) return null;
    return <DividerMesh divider={preview.dividerPreview} basket={basket} isSelected={false} isGhost={true} />;
  };

  const GridViz = () => {
    if (preview.gridValue === null) return null;
    if (placementMode === "x") {
      return (
        <mesh position={[0, planeY - 0.5, preview.gridValue]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dividers.length ? 2000 : 700, 2]} />
          <meshBasicMaterial color="#fbbf24" opacity={0.6} transparent toneMapped={false} />
        </mesh>
      );
    }
    return (
      <mesh position={[preview.gridValue, planeY - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, dividers.length ? 2000 : 500]} />
        <meshBasicMaterial color="#34d399" opacity={0.6} transparent toneMapped={false} />
      </mesh>
    );
  };

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, planeY, 0]}
        onPointerMove={handlePointerMove as any}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp as any}
        visible={false}
      >
        <planeGeometry args={[700, 500]} />
      </mesh>

      <CursorViz />
      <DragViz />
      <GridViz />
    </group>
  );
};
