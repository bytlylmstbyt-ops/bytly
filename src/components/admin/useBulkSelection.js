import { useState, useCallback } from "react";

export function useBulkSelection() {
  const [selected, setSelected] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids) => {
    setSelected((prev) => {
      if (!ids.length) return prev;
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id) => selected.has(id), [selected]);

  return {
    selected,
    selectedIds: Array.from(selected),
    selectedCount: selected.size,
    toggle,
    toggleAll,
    clear,
    isSelected,
  };
}