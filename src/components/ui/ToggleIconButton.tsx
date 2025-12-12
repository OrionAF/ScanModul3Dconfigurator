import React from "react";
import { LucideIcon } from "lucide-react";
import { Button, ButtonProps } from "./Button";

type ToggleIconButtonProps = Omit<ButtonProps, "children"> & {
  icon: LucideIcon;
  label: string;
};

export const ToggleIconButton: React.FC<ToggleIconButtonProps> = ({
  icon: Icon,
  label,
  className,
  ...props
}) => {
  return (
    <Button
      {...props}
      className={`flex-1 py-2 px-3 flex flex-col items-center gap-1 text-[10px] font-bold ${className ?? ""}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  );
};
