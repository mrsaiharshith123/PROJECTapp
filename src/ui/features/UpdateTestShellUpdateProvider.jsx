import UpdateProgressModal from "./UpdateProgressModal.jsx";
import { useUpdateTestShellAction } from "../../hooks/useUpdateTestShellAction.js";

/** @param {{ children: (api: ReturnType<typeof useUpdateTestShellAction>) => import('react').ReactNode }} props */
export function UpdateTestShellUpdateProvider({ children }) {
  const api = useUpdateTestShellAction();
  return (
    <>
      {children(api)}
      <UpdateProgressModal open={api.progressOpen} progress={api.progress} />
    </>
  );
}
