import { BasketType } from "../types/basket";
import { SPECS } from "../components/geometry/constants";

export const BASKETS: BasketType[] = [
  { id: "b-600-400-200", name: "600×400×200", dimensions: { width: 600, depth: 400, height: 200 }, specs: SPECS },
  { id: "b-600-400-100", name: "600×400×100", dimensions: { width: 600, depth: 400, height: 100 }, specs: SPECS },
];
