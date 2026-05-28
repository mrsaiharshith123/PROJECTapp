import { isEnhancedUi } from "../constants/uiTheme.js";

const Card = ({ children, className = "" }) => {
  const enhanced = isEnhancedUi();
  return (
    <div
      className={`${
        enhanced
          ? "ui-card"
          : "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700"
      } p-5 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
