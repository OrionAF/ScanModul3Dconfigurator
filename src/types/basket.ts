export type BasketType = {
  id: string;
  name: string;
  dimensions: { width: number; depth: number; height: number };
};

export type BasketSpecs = {
  dimensions: {
    external: { length: number; width: number; height: number };
    internalTop: { length: number; width: number };
    internalBottom: { length: number; width: number };
  };
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
      dividerHeight: number;
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
