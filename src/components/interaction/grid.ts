import { BasketType } from "../../types/basket";
import { getSideHoleGrids } from "../../utils/holeGrid";

export const getSnapGrid = (basket: BasketType) => {
  const { longSide, shortSide } = getSideHoleGrids(basket.specs);

  const xSnaps = longSide.centers;
  const zSnaps = shortSide.centers;

  return { xSnaps, zSnaps };
};

export const findClosestSnap = (value: number, snaps: number[]) =>
  snaps.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
