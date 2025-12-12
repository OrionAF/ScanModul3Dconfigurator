import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { getSnapGrid } from "../components/interaction/grid";
import { PlacementMode } from "../context/ConfiguratorProvider";

export type SnapPoint = { x: number; z: number; side?: "x" | "z" };

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

  const halfLength = basket.specs.dimensions.internalBottom.length / 2;
  const halfWidth = basket.specs.dimensions.internalBottom.width / 2;

  const xEdges = useMemo(() => {
    const edges = [-halfLength, halfLength];

    dividers.forEach((divider) => {
      if (divider.axis === "z") edges.push(divider.position);
    });

    return Array.from(new Set(edges));
  }, [dividers, halfLength]);

  const zEdges = useMemo(() => {
    const edges = [-halfWidth, halfWidth];

    dividers.forEach((divider) => {
      if (divider.axis === "x") edges.push(divider.position);
    });

    return Array.from(new Set(edges));
  }, [dividers, halfWidth]);

  const startSnaps = useMemo(() => {
    const keyFor = (snap: SnapPoint) => `${snap.x}-${snap.z}`;
    const snapMap = new Map<string, SnapPoint>();

    const xEdgeSet = new Set(xEdges);
    const zEdgeSet = new Set(zEdges);

    zEdges.forEach((z) =>
      xSnaps.forEach((x) => {
        if (xEdgeSet.has(x)) return; // corner point, skip
        snapMap.set(keyFor({ x, z }), { x, z, side: "z" });
      })
    );

    xEdges.forEach((x) =>
      zSnaps.forEach((z) => {
        if (zEdgeSet.has(z)) return; // corner point, skip
        snapMap.set(keyFor({ x, z }), { x, z, side: "x" });
      })
    );

    return Array.from(snapMap.values());
  }, [xEdges, xSnaps, zEdges, zSnaps]);

  const endSnaps = useMemo(() => {
    if (!selectedStart) return [];

    const keyFor = (snap: SnapPoint) => `${snap.x}-${snap.z}`;
    const candidates: SnapPoint[] = [];

    const xEdgeSet = new Set(xEdges);
    const zEdgeSet = new Set(zEdges);

    const allowZAxis = selectedStart.side
      ? selectedStart.side === "z"
      : zEdgeSet.has(selectedStart.z) && !xEdgeSet.has(selectedStart.x);
    const allowXAxis = selectedStart.side
      ? selectedStart.side === "x"
      : xEdgeSet.has(selectedStart.x) && !zEdgeSet.has(selectedStart.z);

    if (allowZAxis) {
      zSnaps
        .filter((z) => z !== selectedStart.z)
        .forEach((z) => candidates.push({ x: selectedStart.x, z }));
    }

    if (allowXAxis) {
      xSnaps
        .filter((x) => x !== selectedStart.x)
        .forEach((x) => candidates.push({ x, z: selectedStart.z }));
    }

    const seen = new Map<string, SnapPoint>();
    candidates.forEach((snap) => seen.set(keyFor(snap), snap));
    return Array.from(seen.values());
  }, [selectedStart, xEdges, xSnaps, zEdges, zSnaps]);

  useEffect(() => {
    if (placementMode !== "divider") {
      setSelectedStart(null);
      setHoveredEnd(null);
    }
  }, [placementMode]);

  useEffect(() => {
    setSelectedStart(null);
    setHoveredEnd(null);
  }, [xEdges, xSnaps, zEdges, zSnaps]);

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
