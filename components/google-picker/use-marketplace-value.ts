"use client";

import { useCallback, useState } from "react";
import { useOptionalMarketplaceClient } from "@/components/providers/marketplace";

export function toMarketplaceJsonData<T>(items: T[], multiSelect: boolean): T | T[] {
  return multiSelect || items.length > 1 ? items : items[0];
}

export function useMarketplaceValue() {
  const client = useOptionalMarketplaceClient();
  const [error, setError] = useState<string | null>(null);

  const commitValue = useCallback(
    <T,>(items: T[], multiSelect: boolean): boolean => {
      if (items.length === 0) {
        return false;
      }

      setError(null);
      const jsonData = toMarketplaceJsonData(items, multiSelect);
      const jsonString = JSON.stringify(jsonData, null, 2);

      if (!client) {
        return true;
      }

      try {
        client.setValue(jsonString, true);
        client.closeApp();
        return true;
      } catch (err) {
        console.error("Error saving value to Marketplace client:", err);
        setError(`Failed to save selection: ${err instanceof Error ? err.message : String(err)}`);
        return false;
      }
    },
    [client]
  );

  return { client, commitValue, error, setError };
}
