import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { BasketSnapMap, SnapPoint, snapKey } from "../types/placement";
import { getSnapGrid } from "../components/interaction/grid";
import { PlacementMode } from "../context/ConfiguratorProvider";
import { getBasketSnapMap } from "../data/basketSnapMaps";

export type PlacementPreview = {
  dividerPreview: Divider | null;
  startSnaps: SnapPoint[];
  endSnaps: SnapPoint[];
  selectedStart: SnapPoint | null;
  hoveredEnd: SnapPoint | null;
};

type UsePlacementProps = {
  basket: BasketType;
  placementMode: PlacementMode;
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
  dividers: Divider[];
};

const MIN_DIVIDER_LENGTH = 40;

export const usePlacement = ({ basket, placementMode, onPlace, dividers }: UsePlacementProps) => {
  const [selectedStart, setSelectedStart] = useState<SnapPoint | null>(null);
  const [hoveredEnd, setHoveredEnd] = useState<SnapPoint | null>(null);

  const planeY = basket.dimensions.height / 2;

  const { xSnaps, zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const staticSnapMap: BasketSnapMap | undefined = useMemo(
    () => getBasketSnapMap(basket.id),
    [basket.id]
  );

  const dividerXEdges = useMemo(
    () => dividers.filter((divider) => divider.axis === "x").map((divider) => divider.position),
    [dividers]
  );

  const dividerZEdges = useMemo(
    () => dividers.filter((divider) => divider.axis === "z").map((divider) => divider.position),
    [dividers]
  );

  const { startSnaps, adjacency } = useMemo(() => {
    const startMap = new Map<string, SnapPoint>();
    const adjacencyMap = new Map<string, SnapPoint[]>();

    const addSnap = (snap: SnapPoint, targets: SnapPoint[]) => {
      const key = snapKey(snap);
      startMap.set(key, snap);

      const existingTargets = adjacencyMap.get(key) ?? [];
      const seenTargets = new Set(existingTargets.map(snapKey));
      const mergedTargets = [...existingTargets];

      targets.forEach((target) => {
        const targetKey = snapKey(target);
        if (!seenTargets.has(targetKey)) {
          mergedTargets.push(target);
          seenTargets.add(targetKey);
        }
      });

      adjacencyMap.set(key, mergedTargets);
    };

    staticSnapMap?.startSnaps.forEach((snap) => {
      const targets = staticSnapMap.adjacency[snapKey(snap)] ?? [];
      addSnap(snap, targets);
    });

    const dividerXEdgeSet = new Set(dividerXEdges);
    const dividerZEdgeSet = new Set(dividerZEdges);

    dividerXEdges.forEach((zEdge) => {
      xSnaps.forEach((x) => {
        if (dividerZEdgeSet.has(x)) return; // avoid corners
        const snap = { x, z: zEdge, side: "z" as const };
        const targets = zSnaps.filter((z) => z !== zEdge).map((z) => ({ x, z }));
        addSnap(snap, targets);
      });
    });

    dividerZEdges.forEach((xEdge) => {
      zSnaps.forEach((z) => {
        if (dividerXEdgeSet.has(z)) return; // avoid corners
        const snap = { x: xEdge, z, side: "x" as const };
        const targets = xSnaps.filter((x) => x !== xEdge).map((x) => ({ x, z }));
        addSnap(snap, targets);
      });
    });

    return {
      startSnaps: Array.from(startMap.values()),
      adjacency: Object.fromEntries(Array.from(adjacencyMap.entries())),
    };
  }, [dividerXEdges, dividerZEdges, staticSnapMap, xSnaps, zSnaps]);

  const endSnaps = useMemo(() => {
    if (!selectedStart) return [];
    return adjacency[snapKey(selectedStart)] ?? [];
  }, [adjacency, selectedStart]);

  useEffect(() => {
    if (placementMode !== "divider") {
      setSelectedStart(null);
      setHoveredEnd(null);
    }
  }, [placementMode]);

  useEffect(() => {
    setSelectedStart(null);
    setHoveredEnd(null);
  }, [adjacency, startSnaps]);

  const computeDivider = useCallback(
    (start: SnapPoint, end: SnapPoint): Divider | null => {
      const isXAxis = end.z === start.z && end.x !== start.x;
      const isZAxis = end.x === start.x && end.z !== start.z;
      if (!isXAxis && !isZAxis) return null;

      const axis = isXAxis ? "x" : "z";
      const delta = axis === "x" ? Math.abs(end.x - start.x) : Math.abs(end.z - start.z);
      const offset = axis === "x" ? (end.x + start.x) / 2 : (end.z + start.z) / 2;
      const position = axis === "x" ? start.z : start.x;

      const defaultLength =
        axis === "x" ? basket.specs.dimensions.internalBottom.length : basket.specs.dimensions.internalBottom.width;
      const finalLength = delta < MIN_DIVIDER_LENGTH ? defaultLength : delta;
      const finalOffset = delta < MIN_DIVIDER_LENGTH ? 0 : offset;

      return {
        id: "ghost",
        axis,
        position,
        length: finalLength,
        height: basket.dimensions.height,
        offsetAlongAxis: finalOffset,
      };
    },
    [basket.dimensions.height, basket.specs.dimensions.internalBottom.length, basket.specs.dimensions.internalBottom.width]
  );

  const dividerPreview = useMemo(() => {
    if (!selectedStart || !hoveredEnd) return null;
    return computeDivider(selectedStart, hoveredEnd);
  }, [computeDivider, hoveredEnd, selectedStart]);

  const handleStartClick = useCallback((snap: SnapPoint) => {
    setSelectedStart(snap);
    setHoveredEnd(null);
  }, []);

  const handleEndClick = useCallback(
    (snap: SnapPoint) => {
      if (!selectedStart) return;
      const divider = computeDivider(selectedStart, snap);
      if (!divider) return;

      onPlace(divider.position, divider.axis, divider.length, divider.offsetAlongAxis || 0);
      setSelectedStart(null);
      setHoveredEnd(null);
    },
    [computeDivider, onPlace, selectedStart]
  );

  const preview: PlacementPreview = useMemo(
    () => ({ dividerPreview, startSnaps, endSnaps, selectedStart, hoveredEnd }),
    [dividerPreview, endSnaps, hoveredEnd, selectedStart, startSnaps]
  );

  return {
    preview,
    planeY,
    setHoveredEnd,
    handleStartClick,
    handleEndClick,
  };
};
