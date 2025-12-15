import React, { useCallback, useEffect, useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { BasketType } from "../../types/basket";
import { usePlacement } from "../../hooks/usePlacement";
import { PlacementMode } from "../../context/ConfiguratorProvider";
import { findClosestSnap, getSnapGrid } from "./grid";
import { buildFloorTiles } from "../../utils/floorGrid";
import { getSideBarMaps } from "../../utils/barIds";
import { useConfigurator } from "../../context/ConfiguratorProvider";

export type PlacementPlaneProps = {
  basket: BasketType;
  placementMode: PlacementMode;
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

export const PlacementPlane: React.FC<PlacementPlaneProps> = ({ basket, placementMode, onPlace }) => {
  const { planeY } = usePlacement({ basket });
  const { setHoverDiagnostics } = useConfigurator();

  useEffect(
    () => () => setHoverDiagnostics({ longSideBarId: null, shortSideBarId: null, tileId: null }),
    [setHoverDiagnostics],
  );

  const floorTiles = useMemo(() => buildFloorTiles(basket.specs), [basket.specs]);
  const barMaps = useMemo(() => getSideBarMaps(basket.specs), [basket.specs]);

  const { placementLength, placementWidth } = useMemo(
    () => ({
      placementLength: basket.specs.dimensions.internalBottom.length,
      placementWidth: basket.specs.dimensions.internalBottom.width,
    }),
    [basket.specs.dimensions.internalBottom.length, basket.specs.dimensions.internalBottom.width]
  );

  const { zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const findTileAtPoint = useCallback(
    (x: number, z: number) => floorTiles.find((tile) => x >= tile.bounds.minX && x <= tile.bounds.maxX && z >= tile.bounds.minZ && z <= tile.bounds.maxZ),
    [floorTiles],
  );

  const findNearestBars = useCallback(
    (x: number, z: number) => {
      const longSideBars = z >= 0 ? barMaps.bySide.SL : barMaps.bySide.NL;
      const shortSideBars = x >= 0 ? barMaps.bySide.WS : barMaps.bySide.ES;

      const longSideBar = findClosestSnap(x, longSideBars);
      const shortSideBar = findClosestSnap(z, shortSideBars);

      if (import.meta.env.DEV) {
        console.debug(
          "PlacementPlane: cross-side bar selection",
          {
            pointer: { x, z },
            selectedLongSide: longSideBars[0]?.side,
            selectedShortSide: shortSideBars[0]?.side,
            longSideBarId: longSideBar?.id ?? null,
            shortSideBarId: shortSideBar?.id ?? null,
          },
        );
      }

      return {
        longSideBarId: longSideBar?.id ?? null,
        shortSideBarId: shortSideBar?.id ?? null,
      };
    },
    [barMaps.bySide.NL, barMaps.bySide.SL, barMaps.bySide.ES, barMaps.bySide.WS],
  );

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const handlePlace = (event: ThreeEvent<MouseEvent>) => {
    if (placementMode !== "divider") return;
    event.stopPropagation();

    const { z } = event.point;
    const position = clamp(z, -placementWidth / 2, placementWidth / 2);
    const snappedBar = findClosestSnap(position, zSnaps);

    onPlace(snappedBar.center, "x", placementLength, 0);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const { x, z } = event.point;
    const nearestTile = findTileAtPoint(x, z);
    const { longSideBarId, shortSideBarId } = findNearestBars(x, z);

    setHoverDiagnostics({
      longSideBarId,
      shortSideBarId,
      tileId: nearestTile?.id ?? null,
    });
  };

  const handlePointerOut = () => {
    setHoverDiagnostics({ longSideBarId: null, shortSideBarId: null, tileId: null });
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, planeY - 0.5, 0]}
      onClick={handlePlace}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <planeGeometry args={[placementLength, placementWidth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};
