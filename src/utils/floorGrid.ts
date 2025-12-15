import { BasketSpecs } from "../types/basket";
import { BarDescriptor, getSideBarMaps } from "./barIds";

export type FloorTileBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type FloorTile = {
  id: string;
  bounds: FloorTileBounds;
  center: { x: number; z: number };
};

const SECTION_COLS = 8;
const SECTION_ROWS = 4;

const selectNearestBar = (bars: BarDescriptor[], coordinate: number) =>
  bars.reduce((closest, candidate) =>
    Math.abs(candidate.center - coordinate) < Math.abs(closest.center - coordinate)
      ? candidate
      : closest,
  );

const createSectionTiles = (
  startX: number,
  startZ: number,
  flipX: boolean,
  flipZ: boolean,
  gap: number,
  rib: number,
) => {
  const tiles: Omit<FloorTile, "id">[] = [];
  const pitch = gap + rib;

  const dirX = flipX ? -1 : 1;
  const dirZ = flipZ ? -1 : 1;

  for (let c = 0; c < SECTION_COLS; c++) {
    for (let r = 0; r < SECTION_ROWS; r++) {
      if (c === SECTION_COLS - 1 && r === SECTION_ROWS - 1) continue;

      const baseX = startX + c * pitch * dirX;
      const baseZ = startZ + r * pitch * dirZ;

      const minX = dirX === 1 ? baseX : baseX - gap;
      const minZ = dirZ === 1 ? baseZ : baseZ - gap;

      const maxX = minX + gap;
      const maxZ = minZ + gap;

      const center = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };

      tiles.push({
        bounds: { minX, maxX, minZ, maxZ },
        center,
      });
    }
  }

  return tiles;
};

const buildTileId = (tile: Omit<FloorTile, "id">, bars: ReturnType<typeof getSideBarMaps>["bySide"]) => {
  const isNorth = tile.center.z >= 0;
  const isEast = tile.center.x >= 0;

  const longSideBars = isNorth ? bars.NL : bars.SL;
  const shortSideBars = isEast ? bars.ES : bars.WS;

  const xBar = selectNearestBar(longSideBars, tile.center.x);
  const zBar = selectNearestBar(shortSideBars, tile.center.z);

  return `${xBar.id}-${zBar.id}`;
};

export const buildFloorTiles = (specs: BasketSpecs): FloorTile[] => {
  const {
    dimensions: {
      internalBottom: { length, width },
    },
    holes: { grid },
  } = specs;

  const leftX = -length / 2 + grid.offsetX;
  const rightX = length / 2 - grid.offsetX;
  const bottomZ = -width / 2 + grid.offsetZ;
  const topZ = width / 2 - grid.offsetZ;

  const sectionTiles = [
    ...createSectionTiles(leftX, bottomZ, false, false, grid.gap, grid.rib),
    ...createSectionTiles(rightX, bottomZ, true, false, grid.gap, grid.rib),
    ...createSectionTiles(leftX, topZ, false, true, grid.gap, grid.rib),
    ...createSectionTiles(rightX, topZ, true, true, grid.gap, grid.rib),
  ];

  const { bySide } = getSideBarMaps(specs);

  return sectionTiles.map((tile) => ({
    ...tile,
    id: buildTileId(tile, bySide),
  }));
};
