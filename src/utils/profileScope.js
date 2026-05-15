/** Filter records by active profile. */
export function filterByProfile(items, activeProfileId) {
  const pid = activeProfileId || "default";
  return (items || []).filter((item) => (item.profileId || "default") === pid);
}
