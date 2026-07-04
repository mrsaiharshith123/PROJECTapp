import { useCallback, useRef } from "react";

/**
 * HTML5 drag-and-drop reorder for id lists.
 * @param {string[]} orderedIds
 * @param {(ids: string[]) => void} onReorder
 */
export function useDragReorder(orderedIds, onReorder) {
  const dragIdRef = useRef(null);

  const reorder = useCallback(
    (fromId, toId) => {
      if (!fromId || !toId || fromId === toId) return;
      const ids = [...orderedIds];
      const fromIdx = ids.indexOf(fromId);
      const toIdx = ids.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return;
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, fromId);
      onReorder(ids);
    },
    [orderedIds, onReorder],
  );

  const getDragProps = useCallback(
    (id, { enabled = true } = {}) => {
      if (!enabled) return {};
      return {
        draggable: true,
        onDragStart: (e) => {
          dragIdRef.current = id;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", id);
          e.currentTarget.classList.add("ed-drag-source");
        },
        onDragEnd: (e) => {
          dragIdRef.current = null;
          e.currentTarget.classList.remove("ed-drag-source");
          document.querySelectorAll(".ed-drag-over").forEach((el) => el.classList.remove("ed-drag-over"));
        },
        onDragOver: (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragIdRef.current !== id) e.currentTarget.classList.add("ed-drag-over");
        },
        onDragLeave: (e) => {
          e.currentTarget.classList.remove("ed-drag-over");
        },
        onDrop: (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("ed-drag-over");
          const fromId = dragIdRef.current || e.dataTransfer.getData("text/plain");
          reorder(fromId, id);
        },
      };
    },
    [reorder],
  );

  return { getDragProps };
}
