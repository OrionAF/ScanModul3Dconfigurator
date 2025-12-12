import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { BASKETS } from "../data/catalog";
import { BasketType } from "../types/basket";
import { Divider } from "../types/divider";
import { PlacedItem } from "../types/item";

export type PlacementMode = "divider" | "remove" | null;
export type CameraView = "iso" | "top" | "front";

type ConfiguratorContextValue = {
  currentBasket: BasketType;
  dividers: Divider[];
  items: PlacedItem[];
  placementMode: PlacementMode;
  selectedDividerId: string | null;
  isDarkMode: boolean;
  cameraView: CameraView;
  effectiveCameraView: CameraView;
  isCameraLocked: boolean;
  reset: () => void;
  setPlacementMode: (mode: PlacementMode) => void;
  setCameraView: (view: CameraView) => void;
  toggleTheme: () => void;
  selectBasket: (basket: BasketType) => void;
  placeDivider: (position: number, axis: "x" | "z", length?: number, offset?: number) => void;
  updateDivider: (id: string, updates: Partial<Divider>) => void;
  removeDivider: (id: string) => void;
  selectDivider: (id: string | null) => void;
  deselectAll: () => void;
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | undefined>(undefined);

export const ConfiguratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBasket, setCurrentBasket] = useState<BasketType>(BASKETS[0]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [items, setItems] = useState<PlacedItem[]>([]);

  const [placementMode, setPlacementMode] = useState<PlacementMode>(null);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cameraView, setCameraView] = useState<CameraView>("iso");

  const isCameraLocked = !!selectedDividerId;
  const effectiveCameraView = isCameraLocked ? "top" : cameraView;

  const selectBasket = useCallback((basket: BasketType) => {
    setCurrentBasket(basket);
    setDividers([]);
    setItems([]);
    setPlacementMode(null);
    setSelectedDividerId(null);
  }, []);

  const placeDivider = useCallback(
    (position: number, axis: "x" | "z", length?: number, offset?: number) => {
      const finalLength =
        length ||
        (axis === "x"
          ? currentBasket.specs.dimensions.internalBottom.length
          : currentBasket.specs.dimensions.internalBottom.width);

      const height = currentBasket.specs.holes.vertical.dividerHeight;

      const newDivider: Divider = {
        id: `div-${Date.now()}`,
        axis,
        position,
        length: finalLength,
        height,
        offsetAlongAxis: offset || 0,
      };

      setDividers((prev) => [...prev, newDivider]);
    },
    [currentBasket]
  );

  const updateDivider = useCallback((id: string, updates: Partial<Divider>) => {
    setDividers((prev) => prev.map((divider) => (divider.id === id ? { ...divider, ...updates } : divider)));
  }, []);

  const removeDivider = useCallback((id: string) => {
    setDividers((prev) => prev.filter((d) => d.id !== id));
    setSelectedDividerId((prev) => (prev === id ? null : prev));
  }, []);

  const selectDivider = useCallback((id: string | null) => {
    setSelectedDividerId(id);
  }, []);

  const deselectAll = useCallback(() => {
    setPlacementMode(null);
    setSelectedDividerId(null);
  }, []);

  const reset = useCallback(() => {
    setDividers([]);
    setItems([]);
    setPlacementMode(null);
    setSelectedDividerId(null);
  }, []);

  const toggleTheme = useCallback(() => setIsDarkMode((prev) => !prev), []);

  const value = useMemo(
    () => ({
      currentBasket,
      dividers,
      items,
      placementMode,
      selectedDividerId,
      isDarkMode,
      cameraView,
      effectiveCameraView,
      isCameraLocked,
      reset,
      setPlacementMode,
      setCameraView,
      toggleTheme,
      selectBasket,
      placeDivider,
      updateDivider,
      removeDivider,
      selectDivider,
      deselectAll,
    }),
    [
      cameraView,
      currentBasket,
      deselectAll,
      dividers,
      effectiveCameraView,
      isCameraLocked,
      isDarkMode,
      items,
      placeDivider,
      placementMode,
      removeDivider,
      reset,
      selectBasket,
      selectDivider,
      toggleTheme,
      updateDivider,
    ]
  );

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>;
};

export const useConfigurator = () => {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) throw new Error("useConfigurator must be used within a ConfiguratorProvider");
  return ctx;
};
