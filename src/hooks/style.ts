import { useMemo } from "react";

export function useRem(): number {
  const itemSize = useMemo(
    () => parseInt(getComputedStyle(document.documentElement).fontSize),
    []
  );
  return itemSize;
}
