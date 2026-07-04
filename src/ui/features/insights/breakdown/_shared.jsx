/* eslint-disable react-refresh/only-export-components -- shared breakdown helpers */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { wealthCategoryLabel as wealthCategoryLabelUtil } from "../../../../utils/netWorth/wealthCategoryLabel.js";
import EditorialSubMasthead from "../../../patterns/EditorialSubMasthead.jsx";

export function InsightsBreakdownShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ed-page-full ed-ins-page">
      <EditorialSubMasthead
        title={title}
        tagline={subtitle}
        onBack={() => navigate("/insights")}
        backLabel={t("insights.subpages.back")}
      />
      {children}
    </div>
  );
}

export function billStatusLabel(t, status) {
  const key = `bill.status.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

export function openBillDetail({ navigate, billId }) {
  navigate("/ledger/bills", { state: { openBillId: billId } });
}

export function openWealthDetail({ navigate, entryId }) {
  navigate(`/insights/entry/${entryId}`);
}

export const wealthCategoryLabel = wealthCategoryLabelUtil;

export const ROW_CLICK = { cursor: "pointer" };

/** Keyboard-accessible row that behaves like a button. */
export function rowButtonProps(onActivate) {
  return {
    role: "button",
    tabIndex: 0,
    style: ROW_CLICK,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(e);
      }
    },
  };
}
