import { BasketType } from "../../types/basket";
import { SPECS } from "../geometry/constants";

export const getSnapGrid = (basket: BasketType) => {
  const xConfig = SPECS.holes.longSide;
  const xTrackLen = SPECS.dimensions.internalBottom.length;
  const xStart = -(xTrackLen / 2) + xConfig.marginBottom;
  const xPitch = xConfig.gap + xConfig.bar;

  const xSnaps: number[] = [];
  for (let i = 0; i < xConfig.cols; i++) xSnaps.push(xStart + xConfig.gap + xConfig.bar / 2 + i * xPitch);

  const zConfig = SPECS.holes.shortSide;
  const zTrackLen = SPECS.dimensions.internalBottom.width;
  const zStart = -(zTrackLen / 2) + zConfig.marginBottom;
  const zPitch = zConfig.gap + zConfig.bar;

  const zSnaps: number[] = [];
  for (let i = 0; i < zConfig.cols; i++) zSnaps.push(zStart + zConfig.gap + zConfig.bar / 2 + i * zPitch);

  return { xSnaps, zSnaps };
};

export const findClosestSnap = (value: number, snaps: number[]) =>
  snaps.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
