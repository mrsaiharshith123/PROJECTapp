import { PageLoader } from "../ui/patterns/Loading.jsx";

/** Boot / auth wait — editorial full-screen loader (Fraunces wordmark + tagline). */
export default function BootShell({ message, hint }) {
  return <PageLoader message={message} hint={hint} />;
}
