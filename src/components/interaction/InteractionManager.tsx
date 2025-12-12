import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Divider } from "../../types/divider";
import { BasketType } from "../../types/basket";
import { DividerMesh } from "../geometry/DividerMesh";
import { getSnapGrid, findClosestSnap } from "./grid";
import { SPECS } from "../geometry/constants";
import { useConfigurator } from "../../context/ConfiguratorProvider";

export type InteractionManagerProps = {
  basket: BasketType;
  dividers: Divider[];
  selectedDividerId: string | null;
  onSelect: (id: string | null) => void;
  onDeselectAll: () => void;
  controlsRef: React.MutableRefObject<any>;
};

type DragState = {
  mode: "resizeStart" | "resizeEnd";
  dividerId: string;
  originalDivider: Divider;
};

export const InteractionManager: React.FC<InteractionManagerProps> = ({
  basket,
  dividers,
  selectedDividerId,
  onSelect,
  onDeselectAll,
  controlsRef,
}) => {
  const { updateDivider } = useConfigurator();
  const { camera, raycaster, pointer } = useThree();
  const [drag, setDrag] = useState<DragState | null>(null);

  const planeY = basket.dimensions.height / 2;
  const mathPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), [planeY]);
  const intersectionVec = useMemo(() => new THREE.Vector3(), []);

  const { xSnaps, zSnaps } = useMemo(() => getSnapGrid(basket), [basket]);

  const getPlaneIntersection = () => {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(mathPlane, intersectionVec)) return intersectionVec;
    return null;
  };

  useFrame(() => {
    if (!drag) return;
    const point = getPlaneIntersection();
    if (!point) return;

    const { mode, originalDivider } = drag;
    const axis = originalDivider.axis;

    const snaps = axis === "x" ? xSnaps : zSnaps;
    const rawMouseVal = axis === "x" ? point.x : point.z;
    const snappedVal = findClosestSnap(rawMouseVal, snaps);

    const currentLen = originalDivider.length;
    const fixedStart = (originalDivider.offsetAlongAxis || 0) - currentLen / 2;
    const fixedEnd = (originalDivider.offsetAlongAxis || 0) + currentLen / 2;

    let newStart = fixedStart;
    let newEnd = fixedEnd;
    const MIN_LENGTH = 40;

    if (mode === "resizeStart") newStart = Math.min(snappedVal, fixedEnd - MIN_LENGTH);
    else newEnd = Math.max(snappedVal, fixedStart + MIN_LENGTH);

    const newLen = newEnd - newStart;
    const newCenter = newStart + newLen / 2;

    const currentDivider = dividers.find((d) => d.id === drag.dividerId);
    if (currentDivider && currentDivider.length === newLen && (currentDivider.offsetAlongAxis || 0) === newCenter) {
      return;
    }

    updateDivider(drag.dividerId, { length: newLen, offsetAlongAxis: newCenter });
  });

  const handleDividerRightClick = (e: ThreeEvent<MouseEvent>, id: string) => {
    if (selectedDividerId && selectedDividerId !== id) return;
    onSelect(id);
  };

  const handleHandleDown = (e: ThreeEvent<PointerEvent>, dividerId: string, part: "start" | "end") => {
    const divider = dividers.find((d) => d.id === dividerId);
    if (!divider) return;

    setDrag({
      mode: part === "start" ? "resizeStart" : "resizeEnd",
      dividerId,
      originalDivider: { ...divider },
    });

    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  useEffect(() => {
    const handleUp = () => {
      if (!drag) return;
      setDrag(null);
      if (controlsRef.current) controlsRef.current.enabled = true;
    };
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [drag, controlsRef]);

  const ResizeGuide = () => {
    if (!drag) return null;
    const axis = drag.originalDivider.axis;
    const pos = drag.originalDivider.position;

    if (axis === "x") {
      return (
        <mesh position={[0, planeY - 0.5, pos]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SPECS.dimensions.internalBottom.length, 3]} />
          <meshBasicMaterial color="#fbbf24" opacity={0.6} transparent toneMapped={false} />
        </mesh>
      );
    }
    return (
      <mesh position={[pos, planeY - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, SPECS.dimensions.internalBottom.width]} />
        <meshBasicMaterial color="#34d399" opacity={0.6} transparent toneMapped={false} />
      </mesh>
    );
  };

  return (
    <group>
      <ResizeGuide />
      {dividers.map((d) => {
        const isSelected = selectedDividerId === d.id;
        const isDisabled = !!selectedDividerId && !isSelected;
        return (
          <DividerMesh
            key={d.id}
            divider={d}
            basket={basket}
            isSelected={isSelected}
            isDisabled={isDisabled}
            isPlacementMode={false}
            onRightClick={(e) => handleDividerRightClick(e, d.id)}
            onHandleDown={(e, part) => handleHandleDown(e, d.id, part)}
          />
        );
      })}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, planeY - 1, 0]}
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDeselectAll();
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
