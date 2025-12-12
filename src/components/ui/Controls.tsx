import React from "react";
import {
  ArrowDownToLine,
  Box,
  Check,
  Eraser,
  Moon,
  Move3d,
  PenTool,
  RectangleHorizontal,
  Sun,
  Trash2,
} from "lucide-react";
import { BASKETS } from "../../data/catalog";
import { useConfigurator } from "../../context/ConfiguratorProvider";
import { Button } from "./Button";
import { ToggleIconButton } from "./ToggleIconButton";
import { PanelSection } from "./PanelSection";

export const Controls: React.FC = () => {
  const {
    currentBasket,
    selectBasket,
    dividers,
    items,
    placementMode,
    setPlacementMode,
    isDarkMode,
    toggleTheme,
    cameraView,
    isCameraLocked,
    setCameraView,
    reset,
  } = useConfigurator();

  const textClass = isDarkMode ? "text-white" : "text-gray-800";
  const subTextClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200";
  const mutedBgClass = isDarkMode ? "bg-gray-800/70" : "bg-gray-50";
  const hintTextClass = isDarkMode ? "text-gray-500" : "text-gray-400";

  const handleExport = async () => {
    const payload = {
      basket: currentBasket,
      dividers,
      items,
      generatedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(payload, null, 2);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(json);
        window.alert("Configuration copied to clipboard.");
        return;
      }
    } catch (error) {
      console.error("Clipboard export failed", error);
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `config-${currentBasket.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    window.alert("Configuration downloaded as JSON.");
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className={`p-6 border-b ${
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-teal-700"
        } flex justify-between items-center`}
      >
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-teal-400" : "text-white"}`}>
            <Box className="w-6 h-6" /> ScanModul Config
          </h1>
          <p className={`text-xs mt-1 opacity-80 ${isDarkMode ? "text-gray-400" : "text-teal-100"}`}>
            Supply Logistics Planner
          </p>
        </div>
        <Button
          onClick={toggleTheme}
          isDarkMode={isDarkMode}
          variant="muted"
          className={`p-2 rounded-full ${isDarkMode ? "text-yellow-400" : "text-teal-100"}`}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <div className="p-6 flex-1 space-y-8 overflow-y-auto">
        <PanelSection title="View Presets" isDarkMode={isDarkMode}>
          <div className="flex gap-2">
            {[
              { id: "iso", icon: Move3d, label: "ISO" },
              { id: "top", icon: ArrowDownToLine, label: "TOP" },
              { id: "front", icon: RectangleHorizontal, label: "FRONT" },
            ].map((view) => (
              <ToggleIconButton
                key={view.id}
                icon={view.icon}
                label={view.label}
                isDarkMode={isDarkMode}
                active={cameraView === view.id}
                disabled={isCameraLocked}
                onClick={() => {
                  if (isCameraLocked) return;
                  setCameraView(view.id as any);
                }}
                className={isCameraLocked ? "cursor-not-allowed" : ""}
              />
            ))}
          </div>
          {isCameraLocked && (
            <p className={`text-[11px] mt-2 ${subTextClass}`}>
              Divider selected: camera locked to top view until you deselect.
            </p>
          )}
        </PanelSection>

        <PanelSection title="1. Select Basket Size" isDarkMode={isDarkMode}>
          <div className="grid grid-cols-1 gap-2">
            {BASKETS.map((b) => (
              <Button
                key={b.id}
                onClick={() => selectBasket(b)}
                isDarkMode={isDarkMode}
                active={currentBasket.id === b.id}
                className="text-left p-3 w-full"
              >
                <div className={`font-bold text-sm flex justify-between items-center ${textClass}`}>
                  {b.name}
                  {currentBasket.id === b.id && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div className={`text-xs mt-1 ${subTextClass}`}>
                  {b.dimensions.width} x {b.dimensions.depth} x {b.dimensions.height} mm
                </div>
              </Button>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="2. Divider Tools" isDarkMode={isDarkMode}>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => {
                setPlacementMode((prev) => (prev === "z" ? null : "z"));
              }}
              isDarkMode={isDarkMode}
              active={placementMode === "z"}
              className="p-3 flex flex-col items-center gap-2 transition-all text-xs font-bold"
            >
              <div className="flex items-center gap-1">
                <PenTool className="w-4 h-4" />
                <span>Place</span>
              </div>
              <span className={subTextClass}>Y-axis</span>
              <span className={`text-[10px] ${hintTextClass}`}>Shortcut: 1</span>
            </Button>

            <Button
              onClick={() => {
                setPlacementMode((prev) => (prev === "x" ? null : "x"));
              }}
              isDarkMode={isDarkMode}
              active={placementMode === "x"}
              className="p-3 flex flex-col items-center gap-2 transition-all text-xs font-bold"
            >
              <div className="flex items-center gap-1">
                <PenTool className="w-4 h-4" />
                <span>Place</span>
              </div>
              <span className={subTextClass}>X-axis</span>
              <span className={`text-[10px] ${hintTextClass}`}>Shortcut: 2</span>
            </Button>

            <Button
              onClick={() => setPlacementMode((prev) => (prev === "remove" ? null : "remove"))}
              isDarkMode={isDarkMode}
              active={placementMode === "remove"}
              className="p-3 flex flex-col items-center gap-2 transition-all text-xs font-bold"
            >
              <div className="flex items-center gap-1">
                <Eraser className="w-4 h-4" />
                <span>Remove</span>
              </div>
              <span className={subTextClass}>Delete dividers</span>
              <span className={`text-[10px] ${hintTextClass}`}>Shortcut: Esc</span>
            </Button>
          </div>
          <p className={`text-[11px] mt-2 leading-relaxed ${subTextClass}`}>
            • Click in the basket to start a divider. Drag to set custom length. Shift-drag will be full length.
            <br />• Right-click a divider to select. Drag yellow handles to resize. Press Delete to remove selected.
          </p>
        </PanelSection>

        <PanelSection title={`3. Placed Dividers (${dividers.length})`} isDarkMode={isDarkMode}>
          <div className={`space-y-2 p-3 rounded-lg border ${borderClass} ${mutedBgClass}`}>
            {dividers.length === 0 ? (
              <p className={subTextClass}>No dividers placed yet.</p>
            ) : (
              dividers.map((d) => (
                <div
                  key={d.id}
                  className={`text-sm px-3 py-2 rounded-lg flex justify-between items-center ${
                    isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
                  } ${borderClass}`}
                >
                  <div>
                    <div className="font-semibold">{d.axis.toUpperCase()}-Divider</div>
                    <div className={`text-xs ${subTextClass}`}>
                      Pos: {Math.round(d.position)} mm | Len: {Math.round(d.length)} mm | Height: {Math.round(d.height)} mm
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PanelSection>

        <PanelSection title="Export / Actions" isDarkMode={isDarkMode}>
          <div className="grid grid-cols-2 gap-3">
            <Button
              isDarkMode={isDarkMode}
              variant="muted"
              className="p-3 flex items-center gap-2"
              onClick={handleExport}
            >
              <Box className="w-4 h-4" />
              <span className="text-sm font-semibold">Export Config</span>
            </Button>
            <Button
              isDarkMode={isDarkMode}
              variant="muted"
              className="p-3 flex items-center gap-2"
              onClick={reset}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Clear All</span>
            </Button>
          </div>
        </PanelSection>
      </div>
    </div>
  );
};
