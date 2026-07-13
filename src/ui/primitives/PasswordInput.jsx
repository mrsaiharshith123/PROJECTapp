import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "../utils/cn.js";
import { useTranslation } from "../../i18n/I18nProvider.js";

/**
 * @param {import('react').InputHTMLAttributes<HTMLInputElement> & { className?: string }} props
 */
export function PasswordInput({ className = "", value, onChange, ...props }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  return (
    <div className="ed-input-prefix">
      <input
        type={show ? "text" : "password"}
        className={cn("ed-input", className)}
        value={value}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        className="ed-password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
      >
        {show ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
      </button>
    </div>
  );
}

export default PasswordInput;
