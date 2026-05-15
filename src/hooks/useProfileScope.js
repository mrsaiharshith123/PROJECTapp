import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";

/** Profile-scoped data (context already filters by active profile). */
export function useProfileScope() {
  const ctx = useCommitTrack();
  const activeProfileId = ctx.settings.activeProfileId || "default";

  return useMemo(
    () => ({
      activeProfileId,
      commitments: ctx.commitments,
      lendings: ctx.lendings,
      goals: ctx.goals,
      sortedCommitments: ctx.sortedCommitments,
      allCommitments: ctx.allCommitments,
      allLendings: ctx.allLendings,
    }),
    [
      activeProfileId,
      ctx.commitments,
      ctx.lendings,
      ctx.goals,
      ctx.sortedCommitments,
      ctx.allCommitments,
      ctx.allLendings,
    ]
  );
}
