import { Caption } from "../../../primitives/Text.jsx";

export function ChartEmpty({ message = "Nothing to show yet." }) {
  return (
    <div className="ct-chart-empty">
      <Caption>{message}</Caption>
    </div>
  );
}
