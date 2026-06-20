/** Minimal build used to test in-app updates — one screen, one Update button. */
export function isUpdateTestShell() {
  return import.meta.env.VITE_UPDATE_TEST_SHELL === "1";
}
