export type SnapPoint = { x: number; z: number; side?: "x" | "z" };

export type BasketSnapMap = {
  startSnaps: SnapPoint[];
  adjacency: Record<string, SnapPoint[]>;
};

export const snapKey = (snap: SnapPoint) => `${snap.x}-${snap.z}`;
