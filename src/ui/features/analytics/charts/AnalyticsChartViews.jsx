import { Caption } from "../../../primitives/Text.jsx";

export function ChartEmpty({ message = "Nothing to show yet." }) {
  return (
    <div className="ed-inset ed-caption">
      <Caption>{message}</Caption>
    </div>
  );
}
