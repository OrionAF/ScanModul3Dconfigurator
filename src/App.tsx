import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  Billboard,
  ContactShadows,
  Edges,
  Environment,
  OrbitControls,
  RoundedBox,
  Text,
} from "@react-three/drei";
import {
  ArrowDownToLine,
  Box,
  Check,
  Eraser,
  Moon,
  Move3d,
  PenTool,
  RectangleHorizontal,
  Sun,
  Trash2,
} from "lucide-react";

/**
 * Single-file Canvas implementation of the uploaded app.
 * Consolidates:
 * - App.tsx
 * - Scene3D.tsx
 * - BasketGeometry.tsx
 * - DividerMesh.tsx
 * - ItemMesh.tsx
 * - Controls.tsx
 * - types.ts + catalog.ts
 */

// -------------------- Types --------------------

type BasketType = {
  id: string;
  name: string;
  dimensions: { width: number; depth: number; height: number };
};

type Divider = {
  id: string;
  axis: "x" | "z";
  position: number; // for axis x: z position; for axis z: x position
  length: number;
  height: number;
  offsetAlongAxis?: number; // center offset along divider axis
};

type PlacedItem = {
  instanceId: string;
  name: string;
  dimensions: { width: number; depth: number; height: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

type BasketSpecs = {
  dimensions: {
    external: { length: number; width: number; height: number };
    internalTop: { length: number; width: number };
    internalBottom: { length: number; width: number };
  };
  holes: {
    longSide: {
      cols: number;
      gap: number;
      bar: number;
      marginBottom: number;
      marginTop: number;
    };
    shortSide: {
      cols: number;
      gap: number;
      bar: number;
      marginBottom: number;
      marginTop: number;
    };
    vertical: {
      bottomHoleHeight: number;
      dividerHeight: number;
      topHoleHeight: number;
    };
    grid: {
      gap: number;
      rib: number;
      offsetX: number;
      offsetZ: number;
    };
  };
  rim: { width: number };
};

// -------------------- Data (catalog.ts) --------------------

const BASKETS: BasketType[] = [
  { id: "b-400-300-100", name: "400×300×100", dimensions: { width: 400, depth: 300, height: 100 } },
  { id: "b-600-400-200", name: "600×400×200", dimensions: { width: 600, depth: 400, height: 200 } },
  { id: "b-600-400-100", name: "600×400×100", dimensions: { width: 600, depth: 400, height: 100 } },
];

// -------------------- Basket geometry (BasketGeometry.tsx) --------------------

export const SPECS: BasketSpecs = {
  dimensions: {
    external: { length: 600, width: 400, height: 100 },
    internalTop: { length: 545, width: 345 },
    internalBottom: { length: 530, width: 330 },
  },
  holes: {
    longSide: {
      cols: 18,
      gap: 19,
      bar: 10,
      marginBottom: 9,
      marginTop: 16,
    },
    shortSide: {
      cols: 12,
      gap: 15,
      bar: 12,
      marginBottom: 9,
      marginTop: 16,
    },
    vertical: {
      bottomHoleHeight: 37,
      dividerHeight: 22,
      topHoleHeight: 40,
    },
    grid: {
      gap: 16,
      rib: 12,
      offsetX: 24,
      offsetZ: 30,
    },
  },
  rim: {
    width: 16,
  },
};

const MATERIAL_PROPS: THREE.MeshStandardMaterialParameters = {
  color: "#b0b4aa",
  roughness: 0.4,
  metalness: 0.1,
  side: THREE.DoubleSide,
  shadowSide: THREE.DoubleSide,
};

const EDGE_PROPS = {
  threshold: 1,
  color: "#737373",
  opacity: 1,
  transparent: true,
};

const WALL_THICKNESS = 2;
const FLOOR_THICKNESS = 1.5;
const RIM_THICKNESS = 3;
const CORNER_RADIUS = 3;

type WallProps = {
  widthBottom: number;
  widthTop: number;
  slantHeight: number;
  slantScale: number;
  config: {
    cols: number;
    gap: number;
    bar: number;
    marginSideBottom: number;
    marginSideTop: number;
  };
  rowDefs: { y: number; height: number }[];
  tiltAngle: number;
  totalVerticalHeight: number;
};

const Guides: React.FC<{
  widthBottom: number;
  widthTop: number;
  slantHeight: number;
  config: any;
}> = ({ widthBottom, widthTop, slantHeight, config }) => {
  const guides = useMemo(() => {
    const lines: { position: [number, number, number]; rotation: [number, number, number]; height: number }[] = [];
    if (!config) return [];

    const count = config.cols - 1;
    const gap = config.gap;
    const bar = config.bar;
    const mb = config.marginSideBottom;
    const mt = config.marginSideTop;

    const startX_bot = -(widthBottom / 2) + mb;
    const startX_top = -(widthTop / 2) + mt;

    for (let i = 0; i < count; i++) {
      const xBot = startX_bot + i * (gap + bar) + gap + bar / 2;
      const xTop = startX_top + i * (gap + bar) + gap + bar / 2;

      const dx = xTop - xBot;
      const dy = slantHeight;
      const angle = -Math.atan2(dx, dy);
      const length = Math.sqrt(dx * dx + dy * dy);

      lines.push({
        position: [(xBot + xTop) / 2, slantHeight / 2, -0.1],
        rotation: [0, 0, angle],
        height: length,
      });
    }

    return lines;
  }, [widthBottom, widthTop, slantHeight, config]);

  return (
    <group>
      {guides.map((g, i) => (
        <mesh key={i} position={g.position} rotation={g.rotation as any}>
          <boxGeometry args={[1.5, g.height, 0.05]} />
          <meshBasicMaterial color="#000000" opacity={0.15} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const PerforatedWall: React.FC<WallProps> = ({
  widthBottom,
  widthTop,
  slantHeight,
  slantScale,
  config,
  rowDefs,
  tiltAngle,
  totalVerticalHeight,
}) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();

    const halfB = widthBottom / 2;
    const halfT = widthTop / 2;

    s.moveTo(-halfB, 0);
    s.lineTo(halfB, 0);
    s.lineTo(halfT, slantHeight);
    s.lineTo(-halfT, slantHeight);
    s.lineTo(-halfB, 0);

    if (rowDefs && Array.isArray(rowDefs)) {
      rowDefs.forEach((row) => {
        if (!row) return;
        const startY = row.y * slantScale;
        const holeH = row.height * slantScale;

        const ratio = startY / slantHeight;
        const currentWidth = widthBottom + (widthTop - widthBottom) * ratio;
        const currentHalf = currentWidth / 2;

        const verticalRatio = row.y / totalVerticalHeight;
        const margin =
          config.marginSideBottom + (config.marginSideTop - config.marginSideBottom) * verticalRatio;

        const startX = -currentHalf + margin;

        for (let i = 0; i < config.cols; i++) {
          const x = startX + i * (config.gap + config.bar);

          const holePath = new THREE.Path();
          holePath.moveTo(x, startY);
          holePath.lineTo(x + config.gap, startY);
          holePath.lineTo(x + config.gap, startY + holeH);
          holePath.lineTo(x, startY + holeH);
          holePath.lineTo(x, startY);
          s.holes.push(holePath);
        }
      });
    }

    return s;
  }, [widthBottom, widthTop, slantHeight, slantScale, config, rowDefs, totalVerticalHeight]);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: WALL_THICKNESS,
    bevelEnabled: false,
  };

  return (
    <mesh rotation={[tiltAngle, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial {...MATERIAL_PROPS} />
      <Guides widthBottom={widthBottom} widthTop={widthTop} slantHeight={slantHeight} config={config} />
      <Edges {...EDGE_PROPS} />
    </mesh>
  );
};

const Floor: React.FC = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = SPECS.dimensions.internalBottom.width;
    const l = SPECS.dimensions.internalBottom.length;

    s.moveTo(-l / 2, -w / 2);
    s.lineTo(l / 2, -w / 2);
    s.lineTo(l / 2, w / 2);
    s.lineTo(-l / 2, w / 2);
    s.lineTo(-l / 2, -w / 2);

    const createSection = (startX: number, startZ: number, flipX: boolean, flipZ: boolean) => {
      const cols = 8;
      const rows = 4;

      const gap = SPECS.holes.grid.gap;
      const rib = SPECS.holes.grid.rib;

      const dirX = flipX ? -1 : 1;
      const dirZ = flipZ ? -1 : 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (c === cols - 1 && r === rows - 1) continue;

          const holeX = startX + c * (gap + rib) * dirX;
          const holeZ = startZ + r * (gap + rib) * dirZ;

          const x1 = dirX === 1 ? holeX : holeX - gap;
          const z1 = dirZ === 1 ? holeZ : holeZ - gap;

          const hole = new THREE.Path();
          hole.moveTo(x1, z1);
          hole.lineTo(x1 + gap, z1);
          hole.lineTo(x1 + gap, z1 + gap);
          hole.lineTo(x1, z1 + gap);
          hole.lineTo(x1, z1);
          s.holes.push(hole);
        }
      }
    };

    const leftX = -l / 2 + SPECS.holes.grid.offsetX;
    const rightX = l / 2 - SPECS.holes.grid.offsetX;
    const botZ = -w / 2 + SPECS.holes.grid.offsetZ;
    const topZ = w / 2 - SPECS.holes.grid.offsetZ;

    createSection(leftX, botZ, false, false);
    createSection(rightX, botZ, true, false);
    createSection(leftX, topZ, false, true);
    createSection(rightX, topZ, true, true);

    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_THICKNESS / 2, 0]}>
      <extrudeGeometry args={[shape, { depth: FLOOR_THICKNESS, bevelEnabled: false }]} />
      <meshStandardMaterial {...MATERIAL_PROPS} />
      <Edges {...EDGE_PROPS} />
    </mesh>
  );
};

const Rim: React.FC<{ height: number }> = ({ height }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();

    const extL = SPECS.dimensions.external.length;
    const extW = SPECS.dimensions.external.width;

    s.moveTo(-extL / 2, -extW / 2);
    s.lineTo(extL / 2, -extW / 2);
    s.lineTo(extL / 2, extW / 2);
    s.lineTo(-extL / 2, extW / 2);
    s.lineTo(-extL / 2, -extW / 2);

    const intL = SPECS.dimensions.internalTop.length;
    const intW = SPECS.dimensions.internalTop.width;

    const hole = new THREE.Path();
    hole.moveTo(-intL / 2, -intW / 2);
    hole.lineTo(intL / 2, -intW / 2);
    hole.lineTo(intL / 2, intW / 2);
    hole.lineTo(-intL / 2, intW / 2);
    hole.lineTo(-intL / 2, -intW / 2);
    s.holes.push(hole);

    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height - RIM_THICKNESS, 0]}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: RIM_THICKNESS,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.5,
            bevelSegments: 2,
          },
        ]}
      />
      <meshStandardMaterial {...MATERIAL_PROPS} />
      <Edges {...EDGE_PROPS} />
    </mesh>
  );
};

type CornerPostProps = {
  xDir: 1 | -1;
  zDir: 1 | -1;
  height: number;
  taperOffset: number;
  botLength: number;
  botWidth: number;
};

const CornerPost: React.FC<CornerPostProps> = ({ xDir, zDir, height, taperOffset, botLength, botWidth }) => {
  const { mid, rotation, len } = useMemo(() => {
    const startX = (xDir * botLength) / 2;
    const startZ = (zDir * botWidth) / 2;

    const endX = startX + xDir * taperOffset;
    const endZ = startZ + zDir * taperOffset;
    const endY = height;

    const start = new THREE.Vector3(startX, 0, startZ);
    const end = new THREE.Vector3(endX, endY, endZ);

    const midVec = start.clone().add(end).multiplyScalar(0.5);
    const length = start.distanceTo(end);

    const dummy = new THREE.Object3D();
    dummy.position.copy(midVec);
    dummy.lookAt(end);
    dummy.rotateX(Math.PI / 2);

    return {
      mid: [midVec.x, midVec.y, midVec.z] as [number, number, number],
      rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number],
      len: length,
    };
  }, [xDir, zDir, height, taperOffset, botLength, botWidth]);

  return (
    <mesh position={mid} rotation={rotation as any}>
      <cylinderGeometry args={[CORNER_RADIUS, CORNER_RADIUS, len, 16]} />
      <meshStandardMaterial {...MATERIAL_PROPS} />
      <Edges {...EDGE_PROPS} />
    </mesh>
  );
};

export const ScanmodulBasket: React.FC<{ position?: [number, number, number]; height?: number }> = React.memo(
  ({ position = [0, 0, 0], height = 100 }) => {
    const topLength = SPECS.dimensions.internalTop.length;
    const botLength = SPECS.dimensions.internalBottom.length;
    const taperOffset = (topLength - botLength) / 2;

    const taperAngle = Math.atan(taperOffset / height);
    const slantHeight = height / Math.cos(taperAngle);
    const slantScale = 1 / Math.cos(taperAngle);

    const zPos = SPECS.dimensions.internalBottom.width / 2;
    const xPos = SPECS.dimensions.internalBottom.length / 2;

    const rowDefs = useMemo(() => {
      const defs: { y: number; height: number }[] = [];
      const paddingBottom = 0.5;

      if (height > 120) {
        defs.push({ y: paddingBottom, height: SPECS.holes.vertical.bottomHoleHeight });

        const fixedUsage =
          SPECS.holes.vertical.bottomHoleHeight +
          SPECS.holes.vertical.topHoleHeight +
          SPECS.holes.vertical.dividerHeight * 2;
        const availableHeight = height - 1.0;
        const middleHeight = availableHeight - fixedUsage;

        const yMiddle =
          paddingBottom + SPECS.holes.vertical.bottomHoleHeight + SPECS.holes.vertical.dividerHeight;
        defs.push({ y: yMiddle, height: middleHeight });

        const yTop = yMiddle + middleHeight + SPECS.holes.vertical.dividerHeight;
        defs.push({ y: yTop, height: SPECS.holes.vertical.topHoleHeight });
      } else {
        defs.push({ y: paddingBottom, height: SPECS.holes.vertical.bottomHoleHeight });
        defs.push({
          y: paddingBottom + SPECS.holes.vertical.bottomHoleHeight + SPECS.holes.vertical.dividerHeight,
          height: SPECS.holes.vertical.topHoleHeight,
        });
      }
      return defs;
    }, [height]);

    return (
      <group position={position}>
        <Floor />

        <CornerPost xDir={1} zDir={1} height={height} taperOffset={taperOffset} botLength={botLength} botWidth={SPECS.dimensions.internalBottom.width} />
        <CornerPost xDir={1} zDir={-1} height={height} taperOffset={taperOffset} botLength={botLength} botWidth={SPECS.dimensions.internalBottom.width} />
        <CornerPost xDir={-1} zDir={1} height={height} taperOffset={taperOffset} botLength={botLength} botWidth={SPECS.dimensions.internalBottom.width} />
        <CornerPost xDir={-1} zDir={-1} height={height} taperOffset={taperOffset} botLength={botLength} botWidth={SPECS.dimensions.internalBottom.width} />

        <group position={[0, 0, zPos]}>
          <PerforatedWall
            widthBottom={botLength}
            widthTop={topLength}
            slantHeight={slantHeight}
            slantScale={slantScale}
            config={{
              ...SPECS.holes.longSide,
              marginSideBottom: SPECS.holes.longSide.marginBottom,
              marginSideTop: SPECS.holes.longSide.marginTop,
            }}
            rowDefs={rowDefs}
            tiltAngle={taperAngle}
            totalVerticalHeight={height}
          />
        </group>

        <group position={[0, 0, -zPos]} rotation={[0, Math.PI, 0]}>
          <PerforatedWall
            widthBottom={botLength}
            widthTop={topLength}
            slantHeight={slantHeight}
            slantScale={slantScale}
            config={{
              ...SPECS.holes.longSide,
              marginSideBottom: SPECS.holes.longSide.marginBottom,
              marginSideTop: SPECS.holes.longSide.marginTop,
            }}
            rowDefs={rowDefs}
            tiltAngle={taperAngle}
            totalVerticalHeight={height}
          />
        </group>

        <group position={[xPos, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <PerforatedWall
            widthBottom={SPECS.dimensions.internalBottom.width}
            widthTop={SPECS.dimensions.internalTop.width}
            slantHeight={slantHeight}
            slantScale={slantScale}
            config={{
              ...SPECS.holes.shortSide,
              marginSideBottom: SPECS.holes.shortSide.marginBottom,
              marginSideTop: SPECS.holes.shortSide.marginTop,
            }}
            rowDefs={rowDefs}
            tiltAngle={taperAngle}
            totalVerticalHeight={height}
          />
        </group>

        <group position={[-xPos, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <PerforatedWall
            widthBottom={SPECS.dimensions.internalBottom.width}
            widthTop={SPECS.dimensions.internalTop.width}
            slantHeight={slantHeight}
            slantScale={slantScale}
            config={{
              ...SPECS.holes.shortSide,
              marginSideBottom: SPECS.holes.shortSide.marginBottom,
              marginSideTop: SPECS.holes.shortSide.marginTop,
            }}
            rowDefs={rowDefs}
            tiltAngle={taperAngle}
            totalVerticalHeight={height}
          />
        </group>

        <Rim height={height} />
      </group>
    );
  }
);

// -------------------- Divider mesh (DividerMesh.tsx) --------------------

type DividerMeshProps = {
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

const DividerMesh: React.FC<DividerMeshProps> = React.memo(
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
                fontSize={14}
                fontWeight={"bold"}
                color={isGhost ? (isValid ? "#00ff00" : "#ff0000") : "black"}
                outlineWidth={isGhost ? 0 : 1.5}
                outlineColor="white"
                anchorX="center"
                anchorY="middle"
              >
                {Math.round(length)} mm
              </Text>
            </Billboard>
          </group>
        )}

        {isSelected && !isGhost && (
          <>
            <Handle type="start" />
            <Handle type="end" />
          </>
        )}
      </group>
    );
  }
);

// -------------------- Item mesh (ItemMesh.tsx) --------------------

const ItemMesh: React.FC<{ item: PlacedItem }> = ({ item }) => {
  const { width, depth, height } = item.dimensions;

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const baseColor = getColor(item.name);

  return (
    <group
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
        <Edges color="white" threshold={15} opacity={0.5} transparent />
      </mesh>

      <group position={[0, height / 2 + 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text fontSize={12} color="black" anchorX="center" anchorY="middle" maxWidth={width * 0.9}>
          {item.name}
        </Text>
      </group>
    </group>
  );
};

// -------------------- Scene (Scene3D.tsx) --------------------

const getSnapGrid = (basket: BasketType) => {
  const xConfig = SPECS.holes.longSide;
  const xTrackLen = SPECS.dimensions.internalBottom.length;
  const xStart = -(xTrackLen / 2) + xConfig.marginBottom;
  const xPitch = xConfig.gap + xConfig.bar;

  const xSnaps: number[] = [];
  for (let i = 0; i < xConfig.cols; i++) xSnaps.push(xStart + i * xPitch + xConfig.gap / 2);

  const zConfig = SPECS.holes.shortSide;
  const zTrackLen = SPECS.dimensions.internalBottom.width;
  const zStart = -(zTrackLen / 2) + zConfig.marginBottom;
  const zPitch = zConfig.gap + zConfig.bar;

  const zSnaps: number[] = [];
  for (let i = 0; i < zConfig.cols; i++) zSnaps.push(zStart + i * zPitch + zConfig.gap / 2);

  return { xSnaps, zSnaps };
};

const findClosestSnap = (value: number, snaps: number[]) =>
  snaps.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));

type DrawingState = {
  startX: number;
  startZ: number;
  currentX: number;
  currentZ: number;
  axis: "x" | "z";
};

const DividerDrawingManager: React.FC<{
  basket: BasketType;
  placementMode: "x" | "z";
  dividers: Divider[];
  onPlace: (pos: number, axis: "x" | "z", length: number, offset: number) => void;
}> = ({ basket, placementMode, dividers, onPlace }) => {
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
        <meshBasicMaterial
          color={placementMode === "x" ? "#fbbf24" : "#34d399"}
          toneMapped={false}
        />
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

type DragState = {
  mode: "resizeStart" | "resizeEnd";
  dividerId: string;
  originalDivider: Divider;
};

const InteractionManager: React.FC<{
  basket: BasketType;
  dividers: Divider[];
  selectedDividerId: string | null;
  onUpdate: (id: string, updates: Partial<Divider>) => void;
  onSelect: (id: string | null) => void;
  controlsRef: React.MutableRefObject<any>;
}> = ({ basket, dividers, selectedDividerId, onUpdate, onSelect, controlsRef }) => {
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
    if (
      currentDivider &&
      currentDivider.length === newLen &&
      (currentDivider.offsetAlongAxis || 0) === newCenter
    ) {
      return;
    }

    onUpdate(drag.dividerId, { length: newLen, offsetAlongAxis: newCenter });
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
  }, [drag]);

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
          onSelect(null);
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

const CameraRig: React.FC<{ view: "iso" | "top" | "front"; controlsRef: React.MutableRefObject<any> }> = ({
  view,
  controlsRef,
}) => {
  const vec = useMemo(() => new THREE.Vector3(), []);
  const targetVec = useMemo(() => new THREE.Vector3(0, 100, 0), []);
  const [isAnimating, setIsAnimating] = useState(false);
  const { camera } = useThree();

  useEffect(() => {
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(t);
  }, [view]);

  useFrame(() => {
    if (!isAnimating) return;
    let targetPos: [number, number, number] = [500, 600, 500];
    if (view === "top") targetPos = [0, 1000, 0];
    if (view === "front") targetPos = [0, 150, 900];
    const step = 0.1;
    camera.position.lerp(vec.set(targetPos[0], targetPos[1], targetPos[2]), step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, step);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(vec) < 1) setIsAnimating(false);
  });

  return null;
};

const Scene3D: React.FC<{
  basket: BasketType;
  dividers: Divider[];
  items: PlacedItem[];
  placementMode: "x" | "z" | "remove" | null;
  selectedDividerId: string | null;
  onPlaceDivider: (position: number, axis: "x" | "z", length?: number, offset?: number) => void;
  onRemoveDivider: (id: string) => void;
  onUpdateDivider: (id: string, updates: Partial<Divider>) => void;
  onSelectDivider: (id: string | null) => void;
  isDarkMode: boolean;
  cameraView: "iso" | "top" | "front";
}> = ({
  basket,
  dividers,
  items,
  placementMode,
  selectedDividerId,
  onPlaceDivider,
  onRemoveDivider,
  onUpdateDivider,
  onSelectDivider,
  isDarkMode,
  cameraView,
}) => {
  const controlsRef = useRef<any>(null);

  const handleWrapperSelect = (id: string | null) => {
    if (placementMode === "remove" && id) onRemoveDivider(id);
    else onSelectDivider(id);
  };

  const isDrawingMode = placementMode === "x" || placementMode === "z";

  const SceneContent = () => (
    <>
      <CameraRig view={cameraView} controlsRef={controlsRef} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[400, 800, 400]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-400, 300, -200]} intensity={0.5} color="#dbeafe" />
      <Environment preset="city" />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        enabled={!isDrawingMode}
      />

      <group>
        <ScanmodulBasket height={basket.dimensions.height} />

        <InteractionManager
          basket={basket}
          dividers={dividers}
          selectedDividerId={selectedDividerId}
          onUpdate={onUpdateDivider}
          onSelect={handleWrapperSelect}
          controlsRef={controlsRef}
        />

        {isDrawingMode && (
          <DividerDrawingManager
            basket={basket}
            placementMode={placementMode as "x" | "z"}
            dividers={dividers}
            onPlace={onPlaceDivider as any}
          />
        )}

        {items.map((item) => (
          <ItemMesh key={item.instanceId} item={item} />
        ))}

        <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={1200} blur={2} far={100} color="#000000" />
      </group>
    </>
  );

  return (
    <Canvas
      shadows
      camera={{ position: [500, 600, 500], fov: 35, near: 10, far: 5000 }}
      dpr={[1, 2]}
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
    >
      <color attach="background" args={[isDarkMode ? "#252525" : "#e5e7eb"]} />
      <SceneContent />
    </Canvas>
  );
};

// -------------------- Controls (Controls.tsx) --------------------

const Controls: React.FC<{
  currentBasket: BasketType;
  onSelectBasket: (b: BasketType) => void;
  dividers: Divider[];
  placementMode: "x" | "z" | "remove" | null;
  setPlacementMode: (m: "x" | "z" | "remove" | null) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  cameraView: "iso" | "top" | "front";
  setCameraView: (v: "iso" | "top" | "front") => void;
}> = ({
  currentBasket,
  onSelectBasket,
  dividers,
  placementMode,
  setPlacementMode,
  isDarkMode,
  toggleTheme,
  cameraView,
  setCameraView,
}) => {
  const bgClass = isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textClass = isDarkMode ? "text-white" : "text-gray-800";
  const subTextClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200";
  const hoverBorderClass = isDarkMode ? "hover:border-teal-500" : "hover:border-teal-300";

  const activeClass = (active: boolean) => {
    if (active) {
      return isDarkMode
        ? "border-teal-500 bg-teal-900/30 ring-2 ring-teal-500/20"
        : "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20";
    }
    return `${borderClass} ${hoverBorderClass} ${isDarkMode ? "bg-gray-800" : "bg-white"}`;
  };

  return (
    <div className={`h-full flex flex-col border-l shadow-xl transition-colors duration-200 ${bgClass}`}>
      <div
        className={`p-6 border-b ${
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-teal-700"
        } flex justify-between items-center`}
      >
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-teal-400" : "text-white"}`}>
            <Box className="w-6 h-6" /> ScanModul Config
          </h1>
          <p className={`text-xs mt-1 opacity-80 ${isDarkMode ? "text-gray-400" : "text-teal-100"}`}>
            Supply Logistics Planner
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-teal-800 text-teal-100 hover:bg-teal-600"
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 flex-1 space-y-8 overflow-y-auto">
        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>View Presets</h2>
          <div className="flex gap-2">
            {[
              { id: "iso", icon: Move3d, label: "ISO" },
              { id: "top", icon: ArrowDownToLine, label: "TOP" },
              { id: "front", icon: RectangleHorizontal, label: "FRONT" },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCameraView(view.id as any)}
                className={`flex-1 py-2 px-3 rounded-md border flex flex-col items-center gap-1 transition-all ${
                  cameraView === view.id
                    ? isDarkMode
                      ? "bg-teal-900/50 border-teal-500 text-teal-300"
                      : "bg-teal-50 border-teal-500 text-teal-700"
                    : isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                <view.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{view.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>1. Select Basket Size</h2>
          <div className="grid grid-cols-1 gap-2">
            {BASKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBasket(b)}
                className={`text-left p-3 rounded-lg border transition-all ${activeClass(currentBasket.id === b.id)}`}
              >
                <div className={`font-bold text-sm flex justify-between items-center ${textClass}`}>
                  {b.name}
                  {currentBasket.id === b.id && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div className={`text-xs mt-1 ${subTextClass}`}>{b.dimensions.width} x {b.dimensions.depth} x {b.dimensions.height} mm</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>2. Divider Tools</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPlacementMode(placementMode === "z" ? null : "z")}
              className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all relative overflow-hidden group ${
                placementMode === "z"
                  ? isDarkMode
                    ? "border-teal-500 bg-teal-900/30 text-teal-200 shadow-inner"
                    : "border-teal-600 bg-teal-50 text-teal-900 shadow-inner"
                  : isDarkMode
                  ? "border-gray-700 hover:border-teal-500 bg-gray-800"
                  : "border-gray-200 hover:border-teal-400 bg-white"
              }`}
            >
              <div className={`w-2 h-10 rounded bg-[#8da399] ${placementMode === "z" ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}></div>
              <div className="text-left flex-1">
                <div className={`font-bold text-sm ${textClass}`}>Short Divider</div>
                <div className={`text-[10px] ${subTextClass}`}>Draw along Depth (Z-axis)</div>
              </div>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-teal-100 text-teal-800 border-teal-200"}`}>[1]</span>
              {placementMode === "z" && <PenTool className="absolute right-3 bottom-3 w-5 h-5 text-teal-600 animate-pulse opacity-20" />}
            </button>

            <button
              onClick={() => setPlacementMode(placementMode === "x" ? null : "x")}
              className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all relative overflow-hidden group ${
                placementMode === "x"
                  ? isDarkMode
                    ? "border-teal-500 bg-teal-900/30 text-teal-200 shadow-inner"
                    : "border-teal-600 bg-teal-50 text-teal-900 shadow-inner"
                  : isDarkMode
                  ? "border-gray-700 hover:border-teal-500 bg-gray-800"
                  : "border-gray-200 hover:border-teal-400 bg-white"
              }`}
            >
              <div className={`w-8 h-2 rounded bg-[#8da399] ${placementMode === "x" ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}></div>
              <div className="text-left flex-1">
                <div className={`font-bold text-sm ${textClass}`}>Long Divider</div>
                <div className={`text-[10px] ${subTextClass}`}>Draw along Width (X-axis)</div>
              </div>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-teal-100 text-teal-800 border-teal-200"}`}>[2]</span>
              {placementMode === "x" && <PenTool className="absolute right-3 bottom-3 w-5 h-5 text-teal-600 animate-pulse opacity-20" />}
            </button>

            <button
              onClick={() => setPlacementMode(placementMode === "remove" ? null : "remove")}
              className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all relative overflow-hidden group ${
                placementMode === "remove"
                  ? isDarkMode
                    ? "border-red-500 bg-red-900/30 text-red-200 shadow-inner"
                    : "border-red-600 bg-red-50 text-red-900 shadow-inner"
                  : isDarkMode
                  ? "border-gray-700 hover:border-red-500 bg-gray-800"
                  : "border-gray-200 hover:border-red-400 bg-white"
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-10 rounded transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-400 group-hover:text-red-400 group-hover:bg-red-900/50"
                    : "bg-gray-100 text-gray-500 group-hover:text-red-500 group-hover:bg-red-100"
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className={`font-bold text-sm ${textClass}`}>Remove Divider</div>
                <div className={`text-[10px] ${subTextClass}`}>Click a divider to remove it</div>
              </div>
              {placementMode === "remove" && <Eraser className="absolute right-3 bottom-3 w-5 h-5 text-red-600 animate-pulse opacity-20" />}
            </button>

            {placementMode && placementMode !== "remove" && (
              <div
                className={`mt-2 p-2 text-xs rounded border flex items-center gap-2 ${
                  isDarkMode ? "bg-blue-900/20 text-blue-300 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-100"
                }`}
              >
                <PenTool className="w-3 h-3" />
                <span>
                  <span className="font-bold">Click & Drag</span> to draw divider. <span className="font-semibold">Esc</span> to cancel.
                </span>
              </div>
            )}

            {placementMode === "remove" && (
              <div
                className={`mt-2 p-2 text-xs rounded border flex items-center gap-2 ${
                  isDarkMode ? "bg-red-900/20 text-red-300 border-red-800" : "bg-red-50 text-red-700 border-red-100"
                }`}
              >
                <Trash2 className="w-3 h-3" />
                <span>Click on a divider to remove it.</span>
              </div>
            )}

            {!placementMode && (
              <div
                className={`mt-2 p-2 text-xs rounded border flex items-center gap-2 ${
                  isDarkMode ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-gray-50 text-gray-500 border-gray-100"
                }`}
              >
                <span>
                  Select a divider and press{" "}
                  <span className={`font-bold border rounded px-1 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                    Del
                  </span>{" "}
                  to remove.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className={`pt-4 border-t ${borderClass}`}>
          <div className="flex justify-between items-end mb-2">
            <h2 className={`text-xs font-bold uppercase tracking-wider ${subTextClass}`}>Stats</h2>
            <span className="text-xs font-mono text-gray-400">{dividers.length} dividers placed</span>
          </div>
        </section>
      </div>
    </div>
  );
};

// -------------------- App (App.tsx) --------------------

export default function App() {
  const [currentBasket, setCurrentBasket] = useState<BasketType>(BASKETS[1]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [items, setItems] = useState<PlacedItem[]>([]);

  const [placementMode, setPlacementMode] = useState<"x" | "z" | "remove" | null>(null);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cameraView, setCameraView] = useState<"iso" | "top" | "front">("iso");

  const handleSelectBasket = (basket: BasketType) => {
    setCurrentBasket(basket);
    setDividers([]);
    setItems([]);
    setPlacementMode(null);
    setSelectedDividerId(null);
  };

  const handlePlaceDivider = (position: number, axis: "x" | "z", length?: number, offset?: number) => {
    const finalLength = length || (axis === "x" ? SPECS.dimensions.internalBottom.length : SPECS.dimensions.internalBottom.width);

    const height = currentBasket.dimensions.height;

    const newDivider: Divider = {
      id: `div-${Date.now()}`,
      axis,
      position,
      length: finalLength,
      height,
      offsetAlongAxis: offset || 0,
    };

    setDividers((prev) => [...prev, newDivider]);
  };

  const handleUpdateDivider = (id: string, updates: Partial<Divider>) => {
    setDividers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleRemoveDivider = (id: string) => {
    setDividers((prev) => prev.filter((d) => d.id !== id));
    setSelectedDividerId((prev) => (prev === id ? null : prev));
  };

  const handleSelectDivider = (id: string | null) => {
    setSelectedDividerId(id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "1":
          setPlacementMode((prev) => (prev === "z" ? null : "z"));
          setSelectedDividerId(null);
          break;
        case "2":
          setPlacementMode((prev) => (prev === "x" ? null : "x"));
          setSelectedDividerId(null);
          break;
        case "Escape":
          setPlacementMode((prev) => (prev ? null : prev));
          if (!placementMode) setSelectedDividerId(null);
          break;
        case "Delete":
        case "Backspace":
          if (selectedDividerId) handleRemoveDivider(selectedDividerId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placementMode, selectedDividerId]);

  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen h-dvh w-full ${
        isDarkMode ? "bg-[#252525]" : "bg-gray-100"
      }`}
    >
      <div className="flex-1 relative min-w-0 min-h-[50vh] lg:min-h-0">
        <Scene3D
          basket={currentBasket}
          dividers={dividers}
          items={items}
          placementMode={placementMode}
          selectedDividerId={selectedDividerId}
          onPlaceDivider={handlePlaceDivider}
          onRemoveDivider={handleRemoveDivider}
          onUpdateDivider={handleUpdateDivider}
          onSelectDivider={handleSelectDivider}
          isDarkMode={isDarkMode}
          cameraView={cameraView}
        />

        <div className="absolute top-4 left-4 pointer-events-none">
          <div className={`backdrop-blur p-3 rounded shadow-sm ${isDarkMode ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"}`}>
            <h3 className="font-bold">ScanModul Visualizer</h3>
            <div className={`text-xs mt-1 space-y-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              <div>Left Click: Select/Rotate | Right Click: Pan | Scroll: Zoom</div>
              <div className={`font-semibold border-t pt-1 mt-1 ${isDarkMode ? "text-teal-400 border-gray-600" : "text-teal-700 border-gray-200"}`}>
                Note: The UI mentions Shift-to-force-full-length, but that behavior is not implemented.
              </div>
              <div className={isDarkMode ? "text-teal-300" : "text-teal-600"}>Tip: Right-click a divider to select; resize with handles.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[400px] flex-shrink-0 z-10 max-h-[45vh] lg:max-h-none overflow-y-auto">
        <Controls
          currentBasket={currentBasket}
          onSelectBasket={handleSelectBasket}
          dividers={dividers}
          placementMode={placementMode}
          setPlacementMode={setPlacementMode}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode((v) => !v)}
          cameraView={cameraView}
          setCameraView={setCameraView}
        />
      </div>
    </div>
  );
}
