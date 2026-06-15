"use client";

import React from "react";
import { Check, X, type LucideIcon } from "lucide-react";

export const DIRECTORY_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  width: "100%",
};

function DirectoryIcon({
  icon: Icon,
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconDim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div
      className={`${dim} shrink-0 rounded-full bg-muted flex items-center justify-center border border-border-color text-muted-foreground ${className}`}
      aria-hidden
    >
      <Icon className={iconDim} />
    </div>
  );
}

export function DirectoryTile({
  label,
  checked,
  icon,
  onClick,
}: {
  label: string;
  checked: boolean;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 flex flex-col items-center gap-2 p-3 rounded-md border transition-colors ${
        checked ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-slate-50"
      }`}
    >
      <div className="relative">
        <DirectoryIcon icon={icon} size="md" />
        {checked && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground border border-background">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <span className="text-xs text-center font-medium line-clamp-2 w-full leading-tight">{label}</span>
    </button>
  );
}

export function SelectedTile({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon: LucideIcon;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="min-w-0 flex flex-col items-center gap-1.5 p-2 rounded-md border bg-background group hover:bg-muted/50"
      title="Remove"
    >
      <div className="relative">
        <DirectoryIcon icon={icon} size="sm" className="group-hover:ring-2 group-hover:ring-primary/30" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border text-muted-foreground">
          <X className="h-2.5 w-2.5" />
        </span>
      </div>
      <span className="text-xs text-center line-clamp-2 w-full leading-tight">{label}</span>
    </button>
  );
}
