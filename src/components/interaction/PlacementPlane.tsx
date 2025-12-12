import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { Divider } from "../../types/divider";
import { BasketType } from "../../types/basket";
import { getSnapGrid, findClosestSnap } from "./grid";
import { SPECS } from "../geometry/constants";
import { DividerMesh } from "../geometry/DividerMesh";

export type PlacementPlaneProps = {
  basket: BasketType;
  placementMode: "x" | "z";
  dividers: Divider[];
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
};

type DrawingState = {
  startX: number;
  startZ: number;
  currentX: number;
  currentZ: number;
  axis: "x" | "z";
};

export const PlacementPlane: React.FC<PlacementPlaneProps> = ({ basket, placementMode, dividers, onPlace }) => {
  const { camera, raycaster, pointer } = useThree();
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; z: number } | null>(null);

  const planeY = basket.dimensions.height / 2;
  const mathPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), [planeY]);
  const intersectVec = useMemo(() => new THREE.Vector3(), []);

  const { xSnaps, zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const handlePointerMove = () => {
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(mathPlane, intersectVec)) return;

    const snapX = findClosestSnap(intersectVec.x, xSnaps);
    const snapZ = findClosestSnap(intersectVec.z, zSnaps);

    setCursorPos((prev) => {
      if (prev && prev.x === snapX && prev.z === snapZ) return prev;
      return { x: snapX, z: snapZ };
    });

    if (drawing) {
      if (placementMode === "x") {
        setDrawing((prev) => {
          if (!prev) return prev;
          const next = { ...prev, currentX: snapX, currentZ: prev.startZ };
          if (next.currentX === prev.currentX && next.currentZ === prev.currentZ) return prev;
          return next;
        });
      } else {
        setDrawing((prev) => {
          if (!prev) return prev;
          const next = { ...prev, currentX: prev.startX, currentZ: snapZ };
          if (next.currentX === prev.currentX && next.currentZ === prev.currentZ) return prev;
          return next;
        });
      }
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!cursorPos) return;
    setDrawing({
      startX: cursorPos.x,
      startZ: cursorPos.z,
      currentX: cursorPos.x,
      currentZ: cursorPos.z,
      axis: placementMode,
    });
  };

  const handlePointerUp = () => {
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
  };

  const CursorViz = () => {
    if (!cursorPos || drawing) return null;
    return (
      <mesh position={[cursorPos.x, planeY, cursorPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 16]} />
        <meshBasicMaterial color={placementMode === "x" ? "#fbbf24" : "#34d399"} toneMapped={false} />
      </mesh>
    );
  };

  const DragViz = () => {
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

    return <DividerMesh divider={previewDivider} basket={basket} isSelected={false} isGhost={true} />;
  };

  const GridViz = () => {
    if (!cursorPos && !drawing) return null;
    if (placementMode === "x") {
      const z = drawing ? drawing.startZ : cursorPos?.z || 0;
      return (
        <mesh position={[0, planeY - 0.5, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SPECS.dimensions.internalBottom.length, 2]} />
          <meshBasicMaterial color="#fbbf24" opacity={0.6} transparent toneMapped={false} />
        </mesh>
      );
    }
    const x = drawing ? drawing.startX : cursorPos?.x || 0;
    return (
      <mesh position={[x, planeY - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, SPECS.dimensions.internalBottom.width]} />
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
