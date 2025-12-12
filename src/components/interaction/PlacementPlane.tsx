import React from "react";
import { Divider } from "../../types/divider";
import { BasketType } from "../../types/basket";
import { DividerMesh } from "../geometry/DividerMesh";
import { usePlacement } from "../../hooks/usePlacement";
import { PlacementMode } from "../../context/ConfiguratorProvider";

export type PlacementPlaneProps = {
  basket: BasketType;
  placementMode: PlacementMode;
  dividers: Divider[];
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

export const PlacementPlane: React.FC<PlacementPlaneProps> = ({ basket, placementMode, dividers, onPlace }) => {
  const { preview, planeY, setHoveredEnd, handleStartClick, handleEndClick } = usePlacement({
    basket,
    placementMode,
    dividers,
    onPlace,
  });

  const StartMarkers = () => {
    if (placementMode !== "divider") return null;
    if (preview.selectedStart) return null;
    return (
      <group>
        {preview.startSnaps.map((snap) => (
          <mesh
            key={`start-${snap.x}-${snap.z}`}
            position={[snap.x, planeY, snap.z]}
            onClick={(e) => {
              e.stopPropagation();
              handleStartClick(snap);
            }}
          >
            <cylinderGeometry args={[3, 3, 1.5, 12]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} toneMapped={false} />
          </mesh>
        ))}
      </group>
    );
  };

  const EndMarkers = () => {
    if (!preview.selectedStart) return null;
    return (
      <group>
        <mesh position={[preview.selectedStart.x, planeY, preview.selectedStart.z]}>
          <cylinderGeometry args={[4, 4, 2, 12]} />
          <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
        </mesh>
        {preview.endSnaps.map((snap) => {
          const isXAxis = snap.z === preview.selectedStart?.z;
          return (
            <mesh
              key={`end-${snap.x}-${snap.z}`}
              position={[snap.x, planeY, snap.z]}
              onPointerOver={() => setHoveredEnd(snap)}
              onPointerOut={() => setHoveredEnd(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleEndClick(snap);
              }}
            >
              <cylinderGeometry args={[3.5, 3.5, 1.8, 12]} />
              <meshBasicMaterial
                color={isXAxis ? "#fbbf24" : "#34d399"}
                toneMapped={false}
                opacity={0.95}
                transparent
              />
            </mesh>
          );
        })}
      </group>
    );
  };

  const PreviewViz = () => {
    if (!preview.dividerPreview) return null;
    return <DividerMesh divider={preview.dividerPreview} basket={basket} isSelected={false} isGhost={true} />;
  };

  const TrackGuides = () => {
    if (!preview.selectedStart) return null;
    return (
      <>
        <mesh position={[0, planeY - 0.5, preview.selectedStart.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dividers.length ? 2000 : 700, 2]} />
          <meshBasicMaterial color="#fbbf24" opacity={0.35} transparent toneMapped={false} />
        </mesh>
        <mesh position={[preview.selectedStart.x, planeY - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2, dividers.length ? 2000 : 500]} />
          <meshBasicMaterial color="#34d399" opacity={0.35} transparent toneMapped={false} />
        </mesh>
      </>
    );
  };

  if (placementMode !== "divider") return null;

  return (
    <group>
      <StartMarkers />
      <EndMarkers />
      <PreviewViz />
      <TrackGuides />
    </group>
  );
};
