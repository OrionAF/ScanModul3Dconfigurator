import * as THREE from "three";
import { BasketSpecs } from "../../types/basket";

export const SPECS: BasketSpecs = {
  dimensions: {
    external: { length: 600, width: 400, height: 100 },
    internalTop: { length: 545, width: 345 },
    internalBottom: { length: 530, width: 330 },
  },
  holes: {
    longSide: {
      cols: 18,
      gap: 19,
      bar: 10,
      marginBottom: 9,
      marginTop: 16,
    },
    shortSide: {
      cols: 12,
      gap: 15,
      bar: 12,
      marginBottom: 9,
      marginTop: 16,
    },
    vertical: {
      bottomHoleHeight: 37,
      dividerHeight: 22,
      topHoleHeight: 40,
    },
    grid: {
      gap: 16,
      rib: 12,
      offsetX: 24,
      offsetZ: 30,
    },
  },
  rim: {
    width: 16,
  },
};

export const MATERIAL_PROPS: THREE.MeshStandardMaterialParameters = {
  color: "#b0b4aa",
  roughness: 0.4,
  metalness: 0.1,
  side: THREE.DoubleSide,
  shadowSide: THREE.DoubleSide,
};

export const EDGE_PROPS = {
  threshold: 1,
  color: "#737373",
  opacity: 1,
  transparent: true,
};

export const WALL_THICKNESS = 2;
export const FLOOR_THICKNESS = 1.5;
export const RIM_THICKNESS = 3;
export const CORNER_RADIUS = 3;
