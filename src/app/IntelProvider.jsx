import { CommitIntelContext } from "../hooks/intelContext.js";
import { useCommitIntelInternal } from "../hooks/useCommitIntel.js";

/** Computes commit intel once per tree — wrap app with this inside PerovoProvider. */
export function IntelProvider({ children }) {
  const value = useCommitIntelInternal();
  return <CommitIntelContext.Provider value={value}>{children}</CommitIntelContext.Provider>;
}
