/**
 * Scroll to first invalid field, mark red, return false if invalid.
 *
 * @example
 * const { register, validate, errors, clearError } = useFormValidation();
 * if (!validate({ amount: { required: true, label: "Amount", getValue: () => form.amount } })) return;
 */
import { useRef, useState, useCallback } from "react";

/** @typedef {{ required?: boolean, label?: string, message?: string, value?: unknown, getValue?: () => unknown }} ValidationRule */

export function useFormValidation() {
  /** @type {import("react").MutableRefObject<Record<string, HTMLElement | null>>} */
  const fieldRefs = useRef({});
  /** @type {[Record<string, string>, import("react").Dispatch<import("react").SetStateAction<Record<string, string>>>]} */
  const [errors, setErrors] = useState(() => (/** @type {Record<string, string>} */ ({})));

  const register = useCallback((name) => (el) => {
    if (el) fieldRefs.current[name] = el;
  }, []);

  const validate = useCallback((rules = {}) => {
    /** @type {Record<string, string>} */
    const newErrors = {};
    /** @type {HTMLElement | null} */
    let firstErrorEl = null;

    Object.entries(rules).forEach(([name, rule]) => {
      if (!rule.required) return;

      const el = fieldRefs.current[name];
      const value = (() => {
        if (typeof rule.getValue === "function") {
          return String(rule.getValue() ?? "").trim();
        }
        if (rule.value !== undefined) {
          return String(rule.value ?? "").trim();
        }
        if (el && "value" in el && typeof el.value === "string") {
          return el.value.trim();
        }
        return null;
      })();

      if (value === null) return;

      const isEmpty = value === "" || value === "null" || value === "undefined";

      if (isEmpty) {
        newErrors[name] = rule.message || `${rule.label || name} is required`;
        if (!firstErrorEl && el) firstErrorEl = el;
      }
    });

    setErrors(newErrors);

    if (firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => firstErrorEl.focus?.(), 350);
      return false;
    }

    return true;
  }, []);

  const clearError = useCallback((name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors(/** @type {Record<string, string>} */ ({})), []);

  return { register, validate, errors, clearError, clearAll };
}
