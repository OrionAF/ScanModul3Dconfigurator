import { BasketSpecs } from "../types/basket";

type HoleSpacingConfig = {
  cols: number;
  gap: number;
  bar: number;
};

export type HoleGrid = {
  start: number;
  pitch: number;
  centers: number[];
};

export const buildHoleGrid = (
  trackLength: number,
  config: HoleSpacingConfig,
  margin: number,
): HoleGrid => {
  const pitch = config.gap + config.bar;
  const start = -(trackLength / 2) + margin;
  const centers = Array.from({ length: config.cols }, (_, i) => start + config.gap + config.bar / 2 + i * pitch);

  return { start, pitch, centers };
};

export const getSideHoleGrids = (specs: BasketSpecs) => {
  const { dimensions, holes } = specs;

  return {
    longSide: buildHoleGrid(dimensions.internalBottom.length, holes.longSide, holes.longSide.marginBottom),
    shortSide: buildHoleGrid(dimensions.internalBottom.width, holes.shortSide, holes.shortSide.marginBottom),
  };
};
