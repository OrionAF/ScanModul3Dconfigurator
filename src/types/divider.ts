export type Divider = {
  id: string;
  axis: "x" | "z";
  position: number; // for axis x: z position; for axis z: x position
  length: number;
  height: number;
  offsetAlongAxis?: number; // center offset along divider axis
};
