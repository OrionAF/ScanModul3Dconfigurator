import React from "react";
import { Billboard, Edges, RoundedBox, Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { Divider } from "../../types/divider";
import { BasketType } from "../../types/basket";

export type DividerMeshProps = {
  divider: Divider;
  basket: BasketType;
  isSelected: boolean;
  isDisabled?: boolean;
  isPlacementMode?: boolean;
  isGhost?: boolean;
  isHovered?: boolean;
  isValid?: boolean;
  onRightClick?: (e: ThreeEvent<MouseEvent>) => void;
  onHandleDown?: (e: ThreeEvent<PointerEvent>, part: "start" | "end") => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
};

export const DividerMesh: React.FC<DividerMeshProps> = React.memo(
  ({
    divider,
    basket,
    isSelected,
    isDisabled = false,
    isPlacementMode = false,
    isGhost = false,
    isHovered = false,
    isValid = true,
    onRightClick,
    onHandleDown,
    onPointerOver,
    onPointerOut,
  }) => {
    const { axis, position, length, height, offsetAlongAxis = 0 } = divider;

    const isLongRun = axis === "x";
    const x = isLongRun ? offsetAlongAxis : position;
    const z = isLongRun ? position : offsetAlongAxis;
    const effectiveHeight = height - 5;
    const y = effectiveHeight / 2 + 1.5;

    const thickness = 4;
    const bodyLength = Math.max(0, length - 12);

    const args: [number, number, number] = isLongRun
      ? [bodyLength, effectiveHeight, thickness]
      : [thickness, effectiveHeight, bodyLength];

    const getMaterialColor = () => {
      if (isGhost) return isValid ? "#39FF14" : "#FF073A";
      if (isSelected) return "#3b82f6";
      if (isHovered && !isGhost && !isDisabled) return "#94a3b8";
      return "#cbd5e1";
    };

    const materialColor = getMaterialColor();
    const opacity = isGhost ? 0.6 : 1.0;
    const emissiveColor = isGhost ? materialColor : "#000000";
    const emissiveIntensity = isGhost ? 2.5 : 0;

    const Handle = ({ type }: { type: "start" | "end" }) => {
      const dir = type === "start" ? -1 : 1;
      const hX = isLongRun ? (length / 2) * dir : 0;
      const hZ = isLongRun ? 0 : (length / 2) * dir;

      const gripSize = [isLongRun ? 8 : 16, 16, isLongRun ? 16 : 8] as [number, number, number];

      return (
        <group position={[hX, 0, hZ]}>
          <mesh
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button === 0) onHandleDown?.(e, type);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = isLongRun ? "col-resize" : "row-resize";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <boxGeometry args={gripSize} />
            <meshBasicMaterial color="#fbbf24" toneMapped={false} />
            <Edges color="#78350f" threshold={15} />

            <mesh visible={false}>
              <boxGeometry args={[30, 30, 30]} />
              <meshBasicMaterial />
            </mesh>
          </mesh>
        </group>
      );
    };

    return (
      <group position={[x, y, z]}>
        <mesh
          visible={!isGhost}
          onContextMenu={(e) => {
            if (isDisabled) return;
            e.stopPropagation();
            onRightClick?.(e);
          }}
          onClick={(e) => {
            if (isPlacementMode) return;
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            if (!isPlacementMode && !isDisabled) e.stopPropagation();
          }}
          onPointerOver={(e) => {
            if (isDisabled) return;
            e.stopPropagation();
            document.body.style.cursor = isGhost ? "default" : "context-menu";
            onPointerOver?.(e);
          }}
          onPointerOut={(e) => {
            if (isDisabled) return;
            e.stopPropagation();
            document.body.style.cursor = "auto";
            onPointerOut?.(e);
          }}
        >
          <boxGeometry
            args={
              isLongRun
                ? [Math.max(1, length - 10), effectiveHeight, 20]
                : [20, effectiveHeight, Math.max(1, length - 10)]
            }
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <RoundedBox args={args} radius={1} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial
            color={materialColor}
            transparent={isGhost}
            opacity={opacity}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.4}
            toneMapped={!isGhost}
          />
        </RoundedBox>

        {isGhost && <Edges threshold={15} color={isValid ? "white" : "black"} scale={1.02} />}

        <mesh position={[isLongRun ? -length / 2 + 2 : 0, 0, isLongRun ? 0 : -length / 2 + 2]}>
          <boxGeometry args={isLongRun ? [4, effectiveHeight - 4, thickness + 2] : [thickness + 2, effectiveHeight - 4, 4]} />
          <meshStandardMaterial
            color={materialColor}
            transparent={isGhost}
            opacity={opacity}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            toneMapped={!isGhost}
          />
        </mesh>
        <mesh position={[isLongRun ? length / 2 - 2 : 0, 0, isLongRun ? 0 : length / 2 - 2]}>
          <boxGeometry args={isLongRun ? [4, effectiveHeight - 4, thickness + 2] : [thickness + 2, effectiveHeight - 4, 4]} />
          <meshStandardMaterial
            color={materialColor}
            transparent={isGhost}
            opacity={opacity}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            toneMapped={!isGhost}
          />
        </mesh>

        {(isSelected || (isHovered && !isGhost && !isDisabled) || (isGhost && isValid)) && (
          <group position={[0, effectiveHeight / 2 + 15, 0]}>
            <Billboard>
              <Text
                position={[0, 10, 0]}
                color={isGhost ? (isValid ? "white" : "red") : "#1f2937"}
                fontSize={10}
                anchorX="center"
                anchorY="middle"
                outlineWidth={isGhost ? 0.5 : 0}
                outlineColor="black"
                strokeColor="black"
                strokeWidth={0.15}
                fillOpacity={isGhost ? 1 : 0.9}
                maxWidth={basket.dimensions.width * 0.5}
                textAlign="center"
              >
                {isGhost
                  ? isValid
                    ? "Release to place"
                    : "Overlap detected"
                  : `${Math.round(length)} mm`}
              </Text>
            </Billboard>
          </group>
        )}

        {isSelected && !isGhost && !isDisabled && (
          <>
            <Handle type="start" />
            <Handle type="end" />
          </>
        )}
      </group>
    );
  }
);
