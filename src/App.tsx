import React, { useEffect, useState } from "react";
import { BASKETS } from "./data/catalog";
import { SPECS } from "./components/geometry/constants";
import { BasketType } from "./types/basket";
import { Divider } from "./types/divider";
import { PlacedItem } from "./types/item";
import { Scene3D } from "./components/Scene3D";
import { Controls } from "./components/ui/Controls";

export default function App() {
  const [currentBasket, setCurrentBasket] = useState<BasketType>(BASKETS[0]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [items, setItems] = useState<PlacedItem[]>([]);

  const [placementMode, setPlacementMode] = useState<"x" | "z" | "remove" | null>(null);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cameraView, setCameraView] = useState<"iso" | "top" | "front">("iso");

  const isCameraLocked = !!selectedDividerId;
  const effectiveCameraView = isCameraLocked ? "top" : cameraView;

  const handleSelectBasket = (basket: BasketType) => {
    setCurrentBasket(basket);
    setDividers([]);
    setItems([]);
    setPlacementMode(null);
    setSelectedDividerId(null);
  };

  const handlePlaceDivider = (position: number, axis: "x" | "z", length?: number, offset?: number) => {
    const finalLength =
      length || (axis === "x" ? SPECS.dimensions.internalBottom.length : SPECS.dimensions.internalBottom.width);

    const height = currentBasket.dimensions.height;

    const newDivider: Divider = {
      id: `div-${Date.now()}`,
      axis,
      position,
      length: finalLength,
      height,
      offsetAlongAxis: offset || 0,
    };

    setDividers((prev) => [...prev, newDivider]);
  };

  const handleUpdateDivider = (id: string, updates: Partial<Divider>) => {
    setDividers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleRemoveDivider = (id: string) => {
    setDividers((prev) => prev.filter((d) => d.id !== id));
    setSelectedDividerId((prev) => (prev === id ? null : prev));
  };

  const handleSelectDivider = (id: string | null) => {
    setSelectedDividerId(id);
  };

  const handleDeselectAll = () => {
    setPlacementMode(null);
    setSelectedDividerId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "1":
          setPlacementMode((prev) => (prev === "z" ? null : "z"));
          setSelectedDividerId(null);
          break;
        case "2":
          setPlacementMode((prev) => (prev === "x" ? null : "x"));
          setSelectedDividerId(null);
          break;
        case "Escape":
          setPlacementMode((prev) => (prev ? null : prev));
          if (!placementMode) setSelectedDividerId(null);
          break;
        case "Delete":
        case "Backspace":
          if (selectedDividerId) handleRemoveDivider(selectedDividerId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placementMode, selectedDividerId]);

  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen h-dvh w-full ${
        isDarkMode ? "bg-[#252525]" : "bg-gray-100"
      }`}
    >
      <div className="flex-1 relative min-w-0 min-h-[50vh] lg:min-h-0">
        <Scene3D
          basket={currentBasket}
          dividers={dividers}
          items={items}
          placementMode={placementMode}
          selectedDividerId={selectedDividerId}
          isCameraLocked={isCameraLocked}
          onPlaceDivider={handlePlaceDivider}
          onRemoveDivider={handleRemoveDivider}
          onUpdateDivider={handleUpdateDivider}
          onSelectDivider={handleSelectDivider}
          onDeselectAll={handleDeselectAll}
          isDarkMode={isDarkMode}
          cameraView={effectiveCameraView}
        />

        <div className="absolute top-4 left-4 pointer-events-none">
          <div className={`backdrop-blur p-3 rounded shadow-sm ${isDarkMode ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"}`}>
            <h3 className="font-bold">ScanModul Visualizer</h3>
            <div className={`text-xs mt-1 space-y-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              <div>Left Click: Select/Rotate | Right Click: Pan | Scroll: Zoom</div>
              <div className={`font-semibold border-t pt-1 mt-1 ${
                isDarkMode ? "text-teal-400 border-gray-600" : "text-teal-700 border-gray-200"
              }`}>
                Note: The UI mentions Shift-to-force-full-length, but that behavior is not implemented.
              </div>
              <div className={isDarkMode ? "text-teal-300" : "text-teal-600"}>Tip: Right-click a divider to select; resize with handles.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[400px] flex-shrink-0 z-10 max-h-[45vh] lg:max-h-none overflow-y-auto">
        <Controls
          currentBasket={currentBasket}
          onSelectBasket={handleSelectBasket}
          dividers={dividers}
          placementMode={placementMode}
          setPlacementMode={setPlacementMode}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode((v) => !v)}
          cameraView={effectiveCameraView}
          cameraLocked={isCameraLocked}
          setCameraView={setCameraView}
        />
      </div>
    </div>
  );
}
