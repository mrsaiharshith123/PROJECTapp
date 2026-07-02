import { createContext, useContext } from "react";

/** @type {import('react').Context<ReturnType<import('./useCommitIntel.js').useCommitIntelInternal> | null>} */
export const CommitIntelContext = createContext(null);

export function useCommitIntelFromContext() {
  return useContext(CommitIntelContext);
}
