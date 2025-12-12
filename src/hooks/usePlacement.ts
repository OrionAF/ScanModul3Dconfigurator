import { useCallback, useMemo, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { getSnapGrid, findClosestSnap } from "../components/interaction/grid";
import { SPECS } from "../components/geometry/constants";

export type PlacementDrawingState = {
  startX: number;
  startZ: number;
  currentX: number;
  currentZ: number;
  axis: "x" | "z";
};

export type PlacementPreview = {
  cursor: { x: number; z: number } | null;
  drawing: PlacementDrawingState | null;
  dividerPreview: Divider | null;
  gridValue: number | null;
};

type UsePlacementProps = {
  basket: BasketType;
  placementMode: "x" | "z";
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

export const usePlacement = ({ basket, placementMode, onPlace }: UsePlacementProps) => {
  const { camera, raycaster, pointer } = useThree();
  const [cursor, setCursor] = useState<{ x: number; z: number } | null>(null);
  const [drawing, setDrawing] = useState<PlacementDrawingState | null>(null);

  const planeY = basket.dimensions.height / 2;
  const mathPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), [planeY]);
  const intersectVec = useMemo(() => new THREE.Vector3(), []);

  const { xSnaps, zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const snapPointerToPlane = useCallback(() => {
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(mathPlane, intersectVec)) return null;

    const snapX = findClosestSnap(intersectVec.x, xSnaps);
    const snapZ = findClosestSnap(intersectVec.z, zSnaps);
    return { snapX, snapZ };
  }, [camera, mathPlane, pointer, raycaster, xSnaps, zSnaps]);

  const handlePointerMove = useCallback(() => {
    const snapped = snapPointerToPlane();
    if (!snapped) return;

    setCursor((prev) => {
      if (prev && prev.x === snapped.snapX && prev.z === snapped.snapZ) return prev;
      return { x: snapped.snapX, z: snapped.snapZ };
    });

    if (!drawing) return;

    setDrawing((prev) => {
      if (!prev) return prev;
      if (placementMode === "x") {
        const next = { ...prev, currentX: snapped.snapX, currentZ: prev.startZ };
        if (next.currentX === prev.currentX && next.currentZ === prev.currentZ) return prev;
        return next;
      }
      const next = { ...prev, currentX: prev.startX, currentZ: snapped.snapZ };
      if (next.currentX === prev.currentX && next.currentZ === prev.currentZ) return prev;
      return next;
    });
  }, [drawing, placementMode, snapPointerToPlane]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!cursor) return;
      setDrawing({
        startX: cursor.x,
        startZ: cursor.z,
        currentX: cursor.x,
        currentZ: cursor.z,
        axis: placementMode,
      });
    },
    [cursor, placementMode]
  );

  const handlePointerUp = useCallback(() => {
    if (!drawing) return;
    const { startX, startZ, currentX, currentZ, axis } = drawing;

    if (axis === "x") {
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const length = Math.max(40, maxX - minX);
      const center = (minX + maxX) / 2;
      if (length <= 40) onPlace(startZ, "x", SPECS.dimensions.internalBottom.length, 0);
      else onPlace(startZ, "x", length, center);
    } else {
      const minZ = Math.min(startZ, currentZ);
      const maxZ = Math.max(startZ, currentZ);
      const length = Math.max(40, maxZ - minZ);
      const center = (minZ + maxZ) / 2;
      if (length <= 40) onPlace(startX, "z", SPECS.dimensions.internalBottom.width, 0);
      else onPlace(startX, "z", length, center);
    }

    setDrawing(null);
  }, [drawing, onPlace]);

  const dividerPreview = useMemo(() => {
    if (!drawing) return null;

    let length = 0;
    let x = 0;
    let z = 0;
    let offset = 0;

    if (drawing.axis === "x") {
      length = Math.abs(drawing.currentX - drawing.startX);
      if (length < 10) length = 40;
      offset = (drawing.startX + drawing.currentX) / 2;
      x = offset;
      z = drawing.startZ;
    } else {
      length = Math.abs(drawing.currentZ - drawing.startZ);
      if (length < 10) length = 40;
      offset = (drawing.startZ + drawing.currentZ) / 2;
      x = drawing.startX;
      z = offset;
    }

    const previewDivider: Divider = {
      id: "ghost",
      axis: drawing.axis,
      position: drawing.axis === "x" ? z : x,
      length,
      height: basket.dimensions.height,
      offsetAlongAxis: offset,
    };

    return previewDivider;
  }, [basket.dimensions.height, drawing]);

  const gridValue = useMemo(() => {
    if (drawing) return drawing.axis === "x" ? drawing.startZ : drawing.startX;
    if (!cursor) return null;
    return placementMode === "x" ? cursor.z : cursor.x;
  }, [cursor, drawing, placementMode]);

  const preview: PlacementPreview = useMemo(
    () => ({ cursor, drawing, dividerPreview, gridValue }),
    [cursor, dividerPreview, drawing, gridValue]
  );

  return { preview, handlePointerMove, handlePointerDown, handlePointerUp, planeY };
};
