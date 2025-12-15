import { useMemo } from "react";
import { BasketType } from "../types/basket";

type UsePlacementProps = {
  basket: BasketType;
};

/**
 * Temporary placement helper that simply exposes the divider plane height.
 * Snap-grid previews are disabled while divider placement is being reworked.
 */
export const usePlacement = ({ basket }: UsePlacementProps) => {
  const planeY = useMemo(() => basket.dimensions.height / 2, [basket.dimensions.height]);

  return {
    planeY,
  };
};
