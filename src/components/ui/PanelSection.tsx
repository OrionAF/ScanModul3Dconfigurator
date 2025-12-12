import React from "react";

interface PanelSectionProps {
  title: string;
  isDarkMode: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PanelSection: React.FC<PanelSectionProps> = ({ title, isDarkMode, className, children }) => {
  const titleClass = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <section className={className}>
      <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${titleClass}`}>{title}</h2>
      {children}
    </section>
  );
};
