import { BasketType } from "../../types/basket";
import { BarDescriptor, getSideBarMaps } from "../../utils/barIds";

export const getSnapGrid = (basket: BasketType) => {
  const { byAxis } = getSideBarMaps(basket.specs);

  const xSnaps = byAxis.x;
  const zSnaps = byAxis.z;

  return { xSnaps, zSnaps };
};

export const findClosestSnap = (value: number, snaps: BarDescriptor[]) =>
  snaps.reduce((prev, curr) =>
    Math.abs(curr.center - value) < Math.abs(prev.center - value) ? curr : prev,
  );
