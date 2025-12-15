import React, { useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import {
  CORNER_RADIUS,
  EDGE_PROPS,
  FLOOR_THICKNESS,
  MATERIAL_PROPS,
  RIM_THICKNESS,
  SPECS,
  WALL_THICKNESS,
} from "./constants";
import { buildHoleGrid } from "../../utils/holeGrid";
import { buildFloorTiles } from "../../utils/floorGrid";

export const Guides: React.FC<{
  widthBottom: number;
  widthTop: number;
  slantHeight: number;
  config: any;
}> = ({ widthBottom, widthTop, slantHeight, config }) => {
  const guides = useMemo(() => {
    const lines: { position: [number, number, number]; rotation: [number, number, number]; height: number }[] = [];
    if (!config) return [];

    const baseConfig = { cols: config.cols, gap: config.gap, bar: config.bar };
    const bottomGrid = buildHoleGrid(widthBottom, baseConfig, config.marginSideBottom);
    const topGrid = buildHoleGrid(widthTop, baseConfig, config.marginSideTop);

    for (let i = 0; i < config.cols - 1; i++) {
      const xBot = bottomGrid.centers[i];
      const xTop = topGrid.centers[i];

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

export const PerforatedWall: React.FC<{
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
}> = ({
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

    const holeConfig = { cols: config.cols, gap: config.gap, bar: config.bar };

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

        const verticalRatio = row.y / totalVerticalHeight;
        const margin = config.marginSideBottom + (config.marginSideTop - config.marginSideBottom) * verticalRatio;

        const rowGrid = buildHoleGrid(currentWidth, holeConfig, margin);

        for (let i = 0; i < config.cols; i++) {
          const x = rowGrid.start + i * rowGrid.pitch;

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

export const Floor: React.FC = () => {
  const tiles = useMemo(() => buildFloorTiles(SPECS), []);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = SPECS.dimensions.internalBottom.width;
    const l = SPECS.dimensions.internalBottom.length;

    s.moveTo(-l / 2, -w / 2);
    s.lineTo(l / 2, -w / 2);
    s.lineTo(l / 2, w / 2);
    s.lineTo(-l / 2, w / 2);
    s.lineTo(-l / 2, -w / 2);

    tiles.forEach((tile) => {
      const hole = new THREE.Path();
      hole.moveTo(tile.bounds.minX, tile.bounds.minZ);
      hole.lineTo(tile.bounds.maxX, tile.bounds.minZ);
      hole.lineTo(tile.bounds.maxX, tile.bounds.maxZ);
      hole.lineTo(tile.bounds.minX, tile.bounds.maxZ);
      hole.lineTo(tile.bounds.minX, tile.bounds.minZ);
      s.holes.push(hole);
    });

    return s;
  }, [tiles]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_THICKNESS / 2, 0]}>
      <extrudeGeometry args={[shape, { depth: FLOOR_THICKNESS, bevelEnabled: false }]} />
      <meshStandardMaterial {...MATERIAL_PROPS} />
      <Edges {...EDGE_PROPS} />
    </mesh>
  );
};

export const Rim: React.FC<{ height: number }> = ({ height }) => {
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

export const CornerPost: React.FC<CornerPostProps> = ({ xDir, zDir, height, taperOffset, botLength, botWidth }) => {
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
          SPECS.dividers.height * 2;
        const availableHeight = height - 1.0;
        const middleHeight = availableHeight - fixedUsage;

        const yMiddle =
          paddingBottom + SPECS.holes.vertical.bottomHoleHeight + SPECS.dividers.height;
        defs.push({ y: yMiddle, height: middleHeight });

        const yTop = yMiddle + middleHeight + SPECS.dividers.height;
        defs.push({ y: yTop, height: SPECS.holes.vertical.topHoleHeight });
      } else {
        defs.push({ y: paddingBottom, height: SPECS.holes.vertical.bottomHoleHeight });
        defs.push({
          y: paddingBottom + SPECS.holes.vertical.bottomHoleHeight + SPECS.dividers.height,
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
