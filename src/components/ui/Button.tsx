import React from "react";

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type ButtonVariant = "surface" | "muted" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDarkMode?: boolean;
  active?: boolean;
  variant?: ButtonVariant;
}

const getSurfaceClasses = (isDarkMode: boolean, active?: boolean) => {
  if (active) {
    return isDarkMode
      ? "border-teal-500 bg-teal-900/30 ring-2 ring-teal-500/20 text-teal-200"
      : "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20 text-teal-800";
  }

  return isDarkMode
    ? "bg-gray-800 border-gray-700 hover:border-teal-500 hover:bg-gray-700 text-gray-100"
    : "bg-white border-gray-200 hover:border-teal-300 hover:bg-gray-50 text-gray-700";
};

const getMutedClasses = (isDarkMode: boolean, active?: boolean) => {
  if (active) return getSurfaceClasses(isDarkMode, active);

  return isDarkMode
    ? "bg-gray-800 border-gray-700 hover:border-teal-500 text-gray-100"
    : "bg-white border-gray-200 hover:border-teal-300 text-gray-800";
};

const getGhostClasses = (isDarkMode: boolean) =>
  isDarkMode
    ? "bg-transparent border-gray-700 text-gray-200 hover:border-teal-500"
    : "bg-transparent border-gray-200 text-gray-700 hover:border-teal-300";

const getVariantClasses = (variant: ButtonVariant, isDarkMode: boolean, active?: boolean) => {
  switch (variant) {
    case "muted":
      return getMutedClasses(isDarkMode, active);
    case "ghost":
      return getGhostClasses(isDarkMode);
    default:
      return getSurfaceClasses(isDarkMode, active);
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isDarkMode = false, active = false, variant = "surface", className, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={classNames(
          "rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          getVariantClasses(variant, isDarkMode, active),
          className
        )}
        type={type}
        aria-pressed={props.role === "switch" ? undefined : active}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
