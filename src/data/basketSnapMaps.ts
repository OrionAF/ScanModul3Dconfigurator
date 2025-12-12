import { BasketType } from "../types/basket";
import { BasketSnapMap, SnapPoint, snapKey } from "../types/placement";
import { BASKETS } from "./catalog";
import { getSnapGrid } from "../components/interaction/grid";

const buildSnapMap = (basket: BasketType): BasketSnapMap => {
  const { xSnaps, zSnaps } = getSnapGrid(basket);

  const halfLength = basket.specs.dimensions.internalBottom.length / 2;
  const halfWidth = basket.specs.dimensions.internalBottom.width / 2;

  const startSnaps: SnapPoint[] = [];
  const adjacency: Record<string, SnapPoint[]> = {};

  const addSnap = (snap: SnapPoint, targets: SnapPoint[]) => {
    const key = snapKey(snap);
    startSnaps.push(snap);
    adjacency[key] = targets;
  };

  const addTargets = (snap: SnapPoint, targets: SnapPoint[], axis: "x" | "z") =>
    targets
      .filter((target) => (axis === "x" ? target.x !== snap.x : target.z !== snap.z))
      .map((target) => ({ ...target }));

  ([-halfWidth, halfWidth] as const).forEach((zEdge) => {
    xSnaps.forEach((x) => {
      const snap = { x, z: zEdge, side: "z" as const };
      addSnap(snap, addTargets(snap, zSnaps.map((z) => ({ x, z })), "z"));
    });
  });

  ([-halfLength, halfLength] as const).forEach((xEdge) => {
    zSnaps.forEach((z) => {
      const snap = { x: xEdge, z, side: "x" as const };
      addSnap(snap, addTargets(snap, xSnaps.map((x) => ({ x, z })), "x"));
    });
  });

  return { startSnaps, adjacency };
};

const BASKET_SNAP_MAPS: Record<string, BasketSnapMap> = BASKETS.reduce(
  (map, basket) => ({ ...map, [basket.id]: buildSnapMap(basket) }),
  {}
);

export const getBasketSnapMap = (basketId: string) => BASKET_SNAP_MAPS[basketId];
