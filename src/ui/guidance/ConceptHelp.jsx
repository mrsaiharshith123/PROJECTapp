import { conceptHelpText, getConcept } from "../../guidance/index.js";
import { InfoTip } from "../primitives/InfoTip.jsx";

/** Contextual metric help from the guidance registry. */
export function ConceptHelp({ conceptId, label = "What this means" }) {
  const text = conceptHelpText(conceptId);
  if (!text) return null;
  const c = getConcept(conceptId);
  const full = c?.calc ? `${text} ${c.calc}` : text;
  return <InfoTip text={full} label={label} />;
}

export default ConceptHelp;
