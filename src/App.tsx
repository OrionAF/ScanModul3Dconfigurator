import React, { useEffect } from "react";
import { Scene3D } from "./components/Scene3D";
import { Controls } from "./components/ui/Controls";
import { ConfiguratorProvider, useConfigurator } from "./context/ConfiguratorProvider";
import { Layout } from "./components/Layout";

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
            setPlacementMode((prev) => (prev === "divider" ? null : "divider"));
            selectDivider(null);
            break;
          case "Escape":
            setPlacementMode((prev) => (prev ? null : prev));
            selectDivider(null);
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
    <Layout
      isDarkMode={isDarkMode}
      canvas={
        <>
          <Scene3D />
          <div className="absolute top-4 left-4 pointer-events-none">
            <div
              className={`backdrop-blur p-3 rounded shadow-sm ${
                isDarkMode ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"
              }`}
            >
              <h3 className="font-bold">ScanModul Visualizer</h3>
                <div className={`text-xs mt-1 space-y-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <div>Left Click: Select/Rotate | Right Click: Pan | Scroll: Zoom</div>
                  <div className={isDarkMode ? "text-teal-300" : "text-teal-600"}>
                    Tip: Divider mode: click the basket floor to drop a divider aligned to the nearest short-side bar.
                  </div>
                  <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    Right-click a divider to select; resize with handles when not placing.
                  </div>
                </div>
            </div>
          </div>
        </>
      }
      sidebar={<Controls />}
    />
  );
};

export default function App() {
  return (
    <ConfiguratorProvider>
      <AppContent />
    </ConfiguratorProvider>
  );
}
