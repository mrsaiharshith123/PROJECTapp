import { useCallback, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Button } from "../../index.js";

function compute(a, b, op) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (op === "+") return x + y;
  if (op === "-") return x - y;
  if (op === "×") return x * y;
  if (op === "÷") return y === 0 ? null : x / y;
  return null;
}

function formatResult(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return String(Math.round(value * 1e8) / 1e8);
}

/** Quick arithmetic calculator for on-the-go bill math. */
export default function MathCalculatorModal({ onClose }) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState(null);
  const [operator, setOperator] = useState(null);
  const [fresh, setFresh] = useState(false);

  const inputDigit = useCallback(
    (digit) => {
      setDisplay((prev) => {
        if (fresh || prev === "0") {
          setFresh(false);
          return digit === "." ? "0." : digit;
        }
        if (digit === "." && prev.includes(".")) return prev;
        return prev + digit;
      });
    },
    [fresh],
  );

  const clearAll = () => {
    setDisplay("0");
    setStored(null);
    setOperator(null);
    setFresh(false);
  };

  const applyOp = (op) => {
    if (stored == null) {
      setStored(display);
      setOperator(op);
      setFresh(true);
      return;
    }
    if (fresh) {
      setOperator(op);
      return;
    }
    const result = compute(stored, display, operator);
    const next = formatResult(result);
    setDisplay(next);
    setStored(next);
    setOperator(op);
    setFresh(true);
  };

  const equals = () => {
    if (stored == null || !operator) return;
    const result = compute(stored, display, operator);
    setDisplay(formatResult(result));
    setStored(null);
    setOperator(null);
    setFresh(true);
  };

  const backspace = () => {
    setDisplay((prev) => {
      if (fresh || prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
    setFresh(false);
  };

  const onKey = (key) => {
    if (key === "C") {
      clearAll();
      return;
    }
    if (key === "⌫") {
      backspace();
      return;
    }
    if (key === "=") {
      equals();
      return;
    }
    if (["+", "-", "×", "÷"].includes(key)) {
      applyOp(key);
      return;
    }
    inputDigit(key);
  };

  const rows = [
    ["C", "⌫", "÷", "×"],
    ["7", "8", "9", "-"],
    ["4", "5", "6", "+"],
    ["1", "2", "3", "="],
  ];

  return (
    <Modal onClose={onClose} title={t("tools.mathCalc.title")}>
      <div className="ct-math-calc">
        <div className="ct-hero-card sim ct-math-calc-display-wrap">
        <div className="ct-math-calc-display ct-hero-number ct-numeral" aria-live="polite">
          {display}
        </div>
        </div>
        <div className="ct-math-calc-grid">
          {rows.flatMap((row, ri) =>
            row.map((key) => (
              <button
                key={`${ri}-${key}`}
                type="button"
                className={`ct-math-calc-key${key === "=" ? " ct-math-calc-key-equals" : ""}${["C", "⌫"].includes(key) ? " ct-math-calc-key-fn" : ""}${["+", "-", "×", "÷"].includes(key) ? " ct-math-calc-key-op" : ""}`}
                onClick={() => onKey(key)}
              >
                {key}
              </button>
            )),
          )}
          <button type="button" className="ct-math-calc-key ct-math-calc-key-zero" onClick={() => onKey("0")}>
            0
          </button>
          <button type="button" className="ct-math-calc-key" onClick={() => onKey(".")}>
            .
          </button>
          <span className="ct-math-calc-spacer" aria-hidden />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="mt-3 !w-full">
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}
