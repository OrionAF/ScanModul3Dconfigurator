export type BasketSpecs = {
  dimensions: {
    external: { length: number; width: number; height: number };
    internalTop: { length: number; width: number };
    internalBottom: { length: number; width: number };
  };
  dividers: {
    height: number;
  };
  placement?: BasketPlacementConfig;
  holes: {
    longSide: {
      cols: number;
      gap: number;
      bar: number;
      marginBottom: number;
      marginTop: number;
    };
    shortSide: {
      cols: number;
      gap: number;
      bar: number;
      marginBottom: number;
      marginTop: number;
    };
    vertical: {
      bottomHoleHeight: number;
      topHoleHeight: number;
    };
    grid: {
      gap: number;
      rib: number;
      offsetX: number;
      offsetZ: number;
    };
  };
  rim: { width: number };
};

export type BasketPlacementConfig = {
  startSnaps?: {
    /**
     * Allowed x-axis snap coordinates for start points placed along the basket's z edges.
     * Defaults to all x snap grid positions when omitted.
     */
    x?: number[];
    /**
     * Allowed z-axis snap coordinates for start points placed along the basket's x edges.
     * Defaults to all z snap grid positions when omitted.
     */
    z?: number[];
    /**
     * When true, omits start snaps that sit at the first/last snap on their respective edge
     * to avoid corner placements.
     */
    excludeCorners?: boolean;
  };
};

export type BasketType = {
  id: string;
  name: string;
  dimensions: { width: number; depth: number; height: number };
  specs: BasketSpecs;
  placement?: BasketPlacementConfig;
};
