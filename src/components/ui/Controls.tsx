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

export const Controls: React.FC = () => {
  const {
    currentBasket,
    selectBasket,
    dividers,
    placementMode,
    setPlacementMode,
    isDarkMode,
    toggleTheme,
    cameraView,
    isCameraLocked,
    setCameraView,
  } = useConfigurator();
  const bgClass = isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textClass = isDarkMode ? "text-white" : "text-gray-800";
  const subTextClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200";
  const hoverBorderClass = isDarkMode ? "hover:border-teal-500" : "hover:border-teal-300";

  const activeClass = (active: boolean) => {
    if (active) {
      return isDarkMode
        ? "border-teal-500 bg-teal-900/30 ring-2 ring-teal-500/20"
        : "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20";
    }
    return `${borderClass} ${hoverBorderClass} ${isDarkMode ? "bg-gray-800" : "bg-white"}`;
  };

  return (
    <div className={`h-full flex flex-col border-l shadow-xl transition-colors duration-200 ${bgClass}`}>
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
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-teal-800 text-teal-100 hover:bg-teal-600"
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-6 flex-1 space-y-8 overflow-y-auto">
        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>View Presets</h2>
          <div className="flex gap-2">
            {[
              { id: "iso", icon: Move3d, label: "ISO" },
              { id: "top", icon: ArrowDownToLine, label: "TOP" },
              { id: "front", icon: RectangleHorizontal, label: "FRONT" },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => {
                  if (isCameraLocked) return;
                  setCameraView(view.id as any);
                }}
                disabled={isCameraLocked}
                className={`flex-1 py-2 px-3 rounded-md border flex flex-col items-center gap-1 transition-all ${
                  cameraView === view.id
                    ? isDarkMode
                      ? "bg-teal-900/50 border-teal-500 text-teal-300"
                      : "bg-teal-50 border-teal-500 text-teal-700"
                    : isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                } ${isCameraLocked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <view.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{view.label}</span>
              </button>
            ))}
          </div>
          {isCameraLocked && (
            <p className={`text-[11px] mt-2 ${subTextClass}`}>
              Divider selected: camera locked to top view until you deselect.
            </p>
          )}
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>1. Select Basket Size</h2>
          <div className="grid grid-cols-1 gap-2">
            {BASKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBasket(b)}
                className={`text-left p-3 rounded-lg border transition-all ${activeClass(currentBasket.id === b.id)}`}
              >
                <div className={`font-bold text-sm flex justify-between items-center ${textClass}`}>
                  {b.name}
                  {currentBasket.id === b.id && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div className={`text-xs mt-1 ${subTextClass}`}>
                  {b.dimensions.width} x {b.dimensions.depth} x {b.dimensions.height} mm
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>2. Divider Tools</h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setPlacementMode((prev) => (prev === "z" ? null : "z"));
              }}
              className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-xs font-bold ${activeClass(
                placementMode === "z"
              )}`}
            >
              <div className="flex items-center gap-1">
                <PenTool className="w-4 h-4" />
                <span>Place</span>
              </div>
              <span className={subTextClass}>Y-axis</span>
              <span className="text-[10px] text-gray-400">Shortcut: 1</span>
            </button>

            <button
              onClick={() => {
                setPlacementMode((prev) => (prev === "x" ? null : "x"));
              }}
              className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-xs font-bold ${activeClass(
                placementMode === "x"
              )}`}
            >
              <div className="flex items-center gap-1">
                <PenTool className="w-4 h-4" />
                <span>Place</span>
              </div>
              <span className={subTextClass}>X-axis</span>
              <span className="text-[10px] text-gray-400">Shortcut: 2</span>
            </button>

            <button
              onClick={() => setPlacementMode((prev) => (prev === "remove" ? null : "remove"))}
              className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-xs font-bold ${activeClass(
                placementMode === "remove"
              )}`}
            >
              <div className="flex items-center gap-1">
                <Eraser className="w-4 h-4" />
                <span>Remove</span>
              </div>
              <span className={subTextClass}>Delete dividers</span>
              <span className="text-[10px] text-gray-400">Shortcut: Esc</span>
            </button>
          </div>
          <p className={`text-[11px] mt-2 leading-relaxed ${subTextClass}`}>
            • Click in the basket to start a divider. Drag to set custom length. Shift-drag will be full length.
            <br />• Right-click a divider to select. Drag yellow handles to resize. Press Delete to remove selected.
          </p>
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>
            3. Placed Dividers ({dividers.length})
          </h2>
          <div className={`space-y-2 p-3 rounded-lg border ${borderClass} ${isDarkMode ? "bg-gray-800/70" : "bg-gray-50"}`}>
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
        </section>

        <section>
          <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${subTextClass}`}>Export / Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className={`p-3 rounded-lg border ${borderClass} flex items-center gap-2 ${hoverBorderClass}`}>
              <Box className="w-4 h-4" />
              <span className="text-sm font-semibold">Export Config</span>
            </button>
            <button className={`p-3 rounded-lg border ${borderClass} flex items-center gap-2 ${hoverBorderClass}`}>
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Clear All</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
