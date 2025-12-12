import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { getSnapGrid } from "../components/interaction/grid";
import { PlacementMode } from "../context/ConfiguratorProvider";

export type SnapPoint = { x: number; z: number };

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
};

const MIN_DIVIDER_LENGTH = 40;

export const usePlacement = ({ basket, placementMode, onPlace }: UsePlacementProps) => {
  const [selectedStart, setSelectedStart] = useState<SnapPoint | null>(null);
  const [hoveredEnd, setHoveredEnd] = useState<SnapPoint | null>(null);

  const planeY = basket.dimensions.height / 2;

  const { xSnaps, zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const startSnaps = useMemo(() => xSnaps.flatMap((x) => zSnaps.map((z) => ({ x, z }))), [xSnaps, zSnaps]);

  const endSnaps = useMemo(() => {
    if (!selectedStart) return [];

    const alongX = xSnaps.map((x) => ({ x, z: selectedStart.z }));
    const alongZ = zSnaps.map((z) => ({ x: selectedStart.x, z }));

    const keyFor = (snap: SnapPoint) => `${snap.x}-${snap.z}`;
    const merged = [...alongX, ...alongZ].filter((snap) => keyFor(snap) !== keyFor(selectedStart));

    const seen = new Map<string, SnapPoint>();
    merged.forEach((snap) => seen.set(keyFor(snap), snap));
    return Array.from(seen.values());
  }, [selectedStart, xSnaps, zSnaps]);

  useEffect(() => {
    if (placementMode !== "divider") {
      setSelectedStart(null);
      setHoveredEnd(null);
    }
  }, [placementMode]);

  useEffect(() => {
    setSelectedStart(null);
    setHoveredEnd(null);
  }, [xSnaps, zSnaps]);

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
