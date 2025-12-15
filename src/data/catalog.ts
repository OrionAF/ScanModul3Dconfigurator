import { BasketPlacementConfig, BasketType } from "../types/basket";
import { SPECS } from "../components/geometry/constants";

const DEFAULT_PLACEMENT: BasketPlacementConfig = {
  startSnaps: {
    excludeCorners: true,
  },
};

export const BASKETS: BasketType[] = [
  {
    id: "b-600-400-200",
    name: "600×400×200",
    dimensions: { width: 600, depth: 400, height: 200 },
    specs: SPECS,
    placement: DEFAULT_PLACEMENT,
  },
  {
    id: "b-600-400-100",
    name: "600×400×100",
    dimensions: { width: 600, depth: 400, height: 100 },
    specs: SPECS,
    placement: DEFAULT_PLACEMENT,
  },
];
