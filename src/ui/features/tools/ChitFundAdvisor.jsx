import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import ToolSourcePicker from "./ToolSourcePicker.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { adviseChitTakeMonth, buildChitInstallmentSchedule } from "../../../engines/chitFund.js";
import { formatInr } from "../../../constants/symbols.js";
import { chitFieldsFromCommitment } from "../../../constants/chitFund.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

function ChitAnalysis({ params, commitments, settings, getEffectiveStatus, todayStr, onBack }) {
  const { t } = useTranslation();
  const [overrideLossPct, setOverrideLossPct] = useState("");
  const [showOverride, setShowOverride] = useState(false);

  const maxLossPercentOverride = useMemo(() => {
    if (!showOverride || overrideLossPct === "") return null;
    return (Number(overrideLossPct) || 0) / 100;
  }, [showOverride, overrideLossPct]);

  const advice = useMemo(
    () =>
      adviseChitTakeMonth({
        ...params,
        commitments,
        getEffectiveStatus,
        todayStr,
        monthlyIncome: settings.monthlyIncome,
        liquidSavings: settings.liquidSavings,
        maxLossPercent: maxLossPercentOverride,
      }),
    [params, commitments, getEffectiveStatus, todayStr, settings, maxLossPercentOverride]
  );

  const suggestedPct = Math.round((advice.lossSuggestion?.maxLossPercent ?? advice.maxLossPercent ?? 0.18) * 100);
  const schedule = useMemo(() => {
    if (params.chitValue <= 0 || params.totalMonths <= 0) return [];
    return buildChitInstallmentSchedule(params.chitValue, params.totalMonths);
  }, [params.chitValue, params.totalMonths]);

  return (
    <div className="ct-stack text-sm">
      <button type="button" onClick={onBack} className="ct-link !text-xs">
        ← {t("chit.advisor.chooseAnother")}
      </button>

      <Caption className="block">
        {t("chit.advisor.intro")}
        <InfoTip text={CALC_HELP.chitAdvisor} />
      </Caption>

      {advice.best && (
        <ToolAnswerHero
          tone="survival"
          label={t("chit.advisor.suggestedMonth", { month: advice.best.month })}
          value={formatInr(advice.best.payout)}
          subtitle={t("chit.advisor.payoutLine", {
            payout: formatInr(advice.best.payout),
            loss: formatInr(advice.best.loss),
          })}
        />
      )}

      {advice.lossSuggestion && params.chitValue > 0 && (
        <ToneSurface tone="warning" className="ct-stack-sm text-xs">
          <p className="font-semibold inline-flex items-center">
            {t("chit.advisor.suggestedMaxLoss")}
            <InfoTip text={CALC_HELP.chitMaxLoss} />
          </p>
          <p>
            {t("chit.advisor.upToLoss", {
              amount: formatInr(advice.maxLoss),
              percent: suggestedPct,
            })}
          </p>
          {advice.lossSuggestion.freeCash != null && (
            <p className="opacity-90">
              {t("chit.advisor.freeAfterDues", {
                free: formatInr(advice.lossSuggestion.freeCash),
                debt: formatInr(advice.lossSuggestion.openDebt),
              })}
            </p>
          )}
          {advice.lossSuggestion.reasons?.length > 0 && (
            <ul className="list-disc list-inside opacity-90 ct-stack-sm">
              {advice.lossSuggestion.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setShowOverride((v) => !v)}
            className="ct-link !text-[11px]"
          >
            {showOverride ? t("chit.advisor.useSuggestedCap") : t("chit.advisor.adjustCap")}
          </button>
          {showOverride && (
            <input
              type="number"
              min="5"
              max="35"
              className={fieldClass}
              value={overrideLossPct}
              onChange={(e) => setOverrideLossPct(e.target.value)}
              placeholder={t("chit.advisor.phSuggestedPct", { percent: suggestedPct })}
            />
          )}
        </ToneSurface>
      )}

      {advice.summary && (
        <div className="ct-stat-tile indigo text-xs">
          <p className="ct-stat-tile-value text-sm">{advice.summary}</p>
        </div>
      )}

      {advice.rows.length > 0 && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-[var(--ct-surface)]">
              <tr className="text-left ct-caption border-b">
                <th className="py-1 pr-2">{t("chit.advisor.colMo")}</th>
                <th className="py-1 pr-2">{t("chit.advisor.colPay")}</th>
                <th className="py-1 pr-2">{t("chit.advisor.colDisc")}</th>
                <th className="py-1 pr-2">{t("chit.advisor.colPayout")}</th>
                <th className="py-1 pr-2">{t("chit.advisor.colLoss")}</th>
                <th className="py-1">{t("chit.advisor.colOk")}</th>
              </tr>
            </thead>
            <tbody>
              {advice.rows.map((r) => (
                <tr
                  key={r.month}
                  className={
                    advice.best?.month === r.month ? "bg-[var(--ct-accent-soft)] font-semibold" : "border-b border-[var(--ct-border-subtle)]"
                  }
                >
                  <td className="py-1.5 pr-2">{r.month}</td>
                  <td className="py-1.5 pr-2">{formatInr(r.installment)}</td>
                  <td className="py-1.5 pr-2">{r.discountPct}%</td>
                  <td className="py-1.5 pr-2">{formatInr(r.payout)}</td>
                  <td className="py-1.5 pr-2">{formatInr(r.loss)}</td>
                  <td className="py-1.5">{r.lossOk ? t("chit.advisor.yes") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {schedule.length > 0 && schedule.length <= 30 && (
        <Caption className="block">
          {t("chit.advisor.installmentsRange", {
            start: formatInr(schedule[0].installment),
            end: formatInr(schedule[schedule.length - 1].installment),
          })}
        </Caption>
      )}
    </div>
  );
}

export default function ChitFundAdvisor({ commitments, settings, getEffectiveStatus, todayStr }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const chitBills = useMemo(
    () => commitments.filter((c) => c.category === "Chit Fund" && Number(c.chitValue) > 0),
    [commitments]
  );

  const pickerItems = useMemo(
    () =>
      chitBills.map((c) => {
        const f = chitFieldsFromCommitment(c);
        return {
          id: String(c.id),
          raw: c,
          title: c.name,
          subtitle: t("chit.advisor.monthSubtitle", {
            value: formatInr(Number(f.chitValue)),
            current: f.chitCurrentMonth,
            total: f.chitMonths,
          }),
          meta: c.chitTaken ? t("chit.advisor.prizeTaken") : t("chit.advisor.activeChit"),
        };
      }),
    [chitBills, t]
  );

  const [step, setStep] = useState("pick");
  const [selectedBill, setSelectedBill] = useState(null);
  const [manual, setManual] = useState({
    chitValue: "",
    chitMonths: "",
    currentMonth: "1",
    startDate: "",
    chitTaken: false,
  });

  const params = useMemo(() => {
    if (step === "calc" && selectedBill) {
      const f = chitFieldsFromCommitment(selectedBill);
      return {
        chitValue: Number(f.chitValue) || 0,
        totalMonths: Number(f.chitMonths) || 0,
        currentMonth: Number(f.chitCurrentMonth) || 1,
        startDate: selectedBill.startDate || selectedBill.dueDate || "",
        chitTaken: Boolean(selectedBill.chitTaken),
        foremanPct: Number(f.chitForemanPct) || 5,
        excludeCommitmentId: selectedBill.id,
      };
    }
    if (step === "manual") {
      return {
        chitValue: Number(manual.chitValue) || 0,
        totalMonths: Number(manual.chitMonths) || 0,
        currentMonth: Number(manual.currentMonth) || 1,
        startDate: manual.startDate,
        chitTaken: manual.chitTaken,
        foremanPct: 5,
        excludeCommitmentId: null,
      };
    }
    return null;
  }, [step, selectedBill, manual]);

  if (step === "pick") {
    return (
      <ToolSourcePicker
        accent="yellow"
        title={t("chit.pick.title")}
        hint={t("chit.pick.hint")}
        items={pickerItems}
        emptyMessage={t("chit.pick.empty")}
        manualLabel={t("chit.pick.manual")}
        addLabel={t("chit.pick.addBill")}
        onPick={(item) => {
          setSelectedBill(item.raw);
          setStep("calc");
        }}
        onManual={() => setStep("manual")}
        onAdd={() => navigate("/add")}
      />
    );
  }

  if (step === "manual" && !Number(manual.chitValue)) {
    return (
      <div className="ct-stack">
        <button type="button" onClick={() => setStep("pick")} className="ct-link !text-xs">
          ← {t("chit.advisor.back")}
        </button>
        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">{t("chit.advisor.chitValue")}</label>
            <input
              className={fieldClass}
              value={manual.chitValue}
              onChange={(e) => setManual((m) => ({ ...m, chitValue: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("chit.advisor.months")}</label>
            <input
              className={fieldClass}
              value={manual.chitMonths}
              onChange={(e) => setManual((m) => ({ ...m, chitMonths: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("chit.advisor.currentMonth")}</label>
            <input
              className={fieldClass}
              value={manual.currentMonth}
              onChange={(e) => setManual((m) => ({ ...m, currentMonth: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("chit.advisor.startDate")}</label>
            <input
              type="date"
              className={fieldClass}
              value={manual.startDate}
              onChange={(e) => setManual((m) => ({ ...m, startDate: e.target.value }))}
            />
          </div>
        </div>
      </div>
    );
  }

  if (params) {
    return (
      <ChitAnalysis
        params={params}
        commitments={commitments}
        settings={settings}
        getEffectiveStatus={getEffectiveStatus}
        todayStr={todayStr}
        onBack={() => setStep("pick")}
      />
    );
  }

  return null;
}
