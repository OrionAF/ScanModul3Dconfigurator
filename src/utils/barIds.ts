import { BasketSpecs } from "../types/basket";
import { HoleGrid, getSideHoleGrids } from "./holeGrid";

export type BarSide = "NL" | "SL" | "ES" | "WS";
export type BarId = `${BarSide}${number}`;

export type BarSpan = {
  start: number;
  end: number;
};

export type BarDescriptor = {
  id: BarId;
  side: BarSide;
  index: number;
  center: number;
  span: BarSpan;
};

export type BarsBySide = Record<BarSide, BarDescriptor[]>;
export type BarsByIndex = Record<BarSide, Record<number, BarDescriptor>>;
export type BarsById = Record<BarId, BarDescriptor>;
export type BarsByAxis = Record<"x" | "z", BarDescriptor[]>;

export type SideBarMaps = {
  bySide: BarsBySide;
  byIndex: BarsByIndex;
  byId: BarsById;
  byAxis: BarsByAxis;
};

const createSideBars = (
  side: BarSide,
  grid: HoleGrid,
  barWidth: number,
  gapWidth: number,
  count: number,
): BarDescriptor[] =>
  Array.from({ length: Math.max(0, count) }, (_, i) => {
    const index = i + 1;
    const center = grid.start + gapWidth + barWidth / 2 + i * grid.pitch;
    const span = { start: center - barWidth / 2, end: center + barWidth / 2 };
    const id = `${side}${index}` as BarId;

    return { id, side, index, center, span };
  });

export const getSideBarMaps = (specs: BasketSpecs): SideBarMaps => {
  const sideGrids = getSideHoleGrids(specs);
  const { longSide, shortSide } = specs.holes;

  const longSideCount = longSide.cols - 1;
  const shortSideCount = shortSide.cols - 1;

  const northLongBars = createSideBars("NL", sideGrids.longSide, longSide.bar, longSide.gap, longSideCount);
  const southLongBars = createSideBars("SL", sideGrids.longSide, longSide.bar, longSide.gap, longSideCount);
  const eastShortBars = createSideBars("ES", sideGrids.shortSide, shortSide.bar, shortSide.gap, shortSideCount);
  const westShortBars = createSideBars("WS", sideGrids.shortSide, shortSide.bar, shortSide.gap, shortSideCount);

  const bySide: BarsBySide = {
    NL: northLongBars,
    SL: southLongBars,
    ES: eastShortBars,
    WS: westShortBars,
  };

  const byIndex = (Object.keys(bySide) as BarSide[]).reduce((acc, side) => {
    acc[side] = bySide[side].reduce((sideAcc, bar) => {
      sideAcc[bar.index] = bar;
      return sideAcc;
    }, {} as Record<number, BarDescriptor>);
    return acc;
  }, {} as BarsByIndex);

  const byId = (Object.values(bySide).flat() as BarDescriptor[]).reduce((acc, bar) => {
    acc[bar.id] = bar;
    return acc;
  }, {} as BarsById);

  const byAxis: BarsByAxis = {
    x: [...northLongBars, ...southLongBars],
    z: [...eastShortBars, ...westShortBars],
  };

  return { bySide, byIndex, byId, byAxis };
};
