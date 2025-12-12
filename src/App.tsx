import React, { useEffect } from "react";
import { Scene3D } from "./components/Scene3D";
import { Controls } from "./components/ui/Controls";
import { ConfiguratorProvider, useConfigurator } from "./context/ConfiguratorProvider";

const AppContent = () => {
  const {
    isDarkMode,
    placementMode,
    selectedDividerId,
    removeDivider,
    setPlacementMode,
    selectDivider,
  } = useConfigurator();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "1":
          setPlacementMode((prev) => (prev === "z" ? null : "z"));
          selectDivider(null);
          break;
        case "2":
          setPlacementMode((prev) => (prev === "x" ? null : "x"));
          selectDivider(null);
          break;
        case "Escape":
          setPlacementMode((prev) => (prev ? null : prev));
          if (!placementMode) selectDivider(null);
          break;
        case "Delete":
        case "Backspace":
          if (selectedDividerId) removeDivider(selectedDividerId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placementMode, removeDivider, selectDivider, selectedDividerId, setPlacementMode]);

  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen h-dvh w-full ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"}`}
    >
      <div className="flex-1 relative min-w-0 min-h-[50vh] lg:min-h-0">
        <Scene3D />

        <div className="absolute top-4 left-4 pointer-events-none">
          <div className={`backdrop-blur p-3 rounded shadow-sm ${isDarkMode ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"}`}>
            <h3 className="font-bold">ScanModul Visualizer</h3>
            <div className={`text-xs mt-1 space-y-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              <div>Left Click: Select/Rotate | Right Click: Pan | Scroll: Zoom</div>
              <div
                className={`font-semibold border-t pt-1 mt-1 ${
                  isDarkMode ? "text-teal-400 border-gray-600" : "text-teal-700 border-gray-200"
                }`}
              >
                Note: The UI mentions Shift-to-force-full-length, but that behavior is not implemented.
              </div>
              <div className={isDarkMode ? "text-teal-300" : "text-teal-600"}>
                Tip: Right-click a divider to select; resize with handles.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[400px] flex-shrink-0 z-10 max-h-[45vh] lg:max-h-none overflow-y-auto">
        <Controls />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ConfiguratorProvider>
      <AppContent />
    </ConfiguratorProvider>
  );
}
