import React from "react";

interface LayoutProps {
  isDarkMode: boolean;
  canvas: React.ReactNode;
  sidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ isDarkMode, canvas, sidebar }) => {
  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen h-dvh w-full ${
        isDarkMode ? "bg-[#252525]" : "bg-gray-100"
      } transition-colors duration-200`}
    >
      <div className="flex-1 relative min-w-0 min-h-[50vh] lg:min-h-0">{canvas}</div>

      <aside className="w-full lg:w-[400px] flex-shrink-0 z-10 max-h-[45vh] lg:max-h-none overflow-y-auto">
        <div
          className={`h-full flex flex-col border-l shadow-xl transition-colors duration-200 ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          {sidebar}
        </div>
      </aside>
    </div>
  );
};
