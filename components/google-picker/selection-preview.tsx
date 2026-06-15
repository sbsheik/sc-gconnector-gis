"use client";

import { Button } from "@/components/ui/button";

type SelectionPreviewProps<T> = {
  value: T | T[];
  multiSelect: boolean;
  onSelect: () => void;
  selectLabel?: string;
};

export function SelectionPreview<T>({
  value,
  multiSelect,
  onSelect,
  selectLabel = "Select",
}: SelectionPreviewProps<T>) {
  const items = Array.isArray(value) ? value : [value];
  if (items.length === 0) {
    return null;
  }

  const displayValue = multiSelect || items.length > 1 ? items : items[0];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">JSON Template:</p>
      <div className="p-4 bg-muted rounded-lg border overflow-auto">
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(displayValue, null, 2)}
        </pre>
      </div>
      <Button onClick={onSelect} className="w-full sm:w-auto">
        {items.length > 1 ? `${selectLabel} (${items.length})` : selectLabel}
      </Button>
    </div>
  );
}
