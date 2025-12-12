export type PlacedItem = {
  instanceId: string;
  name: string;
  dimensions: { width: number; depth: number; height: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};
