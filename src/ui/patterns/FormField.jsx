import { Stack } from "../primitives/Stack.jsx";
import { Caption } from "../primitives/Text.jsx";

/**
 * @param {{ label?: string, hint?: string, children: import('react').ReactNode }} props
 */
export function FormField({ label, hint, children }) {
  return (
    <Stack gap="sm">
      {label && <Caption className="font-semibold text-[var(--ct-text-secondary)]">{label}</Caption>}
      {children}
      {hint && <Caption>{hint}</Caption>}
    </Stack>
  );
}
