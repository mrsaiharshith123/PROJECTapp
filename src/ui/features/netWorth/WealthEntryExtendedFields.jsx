import { MONTH_OPTIONS } from "./wealthEntryFormState.js";
import { applyStockSplitOrBonus, parseSplitMultiplier } from "../../../utils/netWorth/corporateActions.js";

export default function WealthEntryExtendedFields({
  form,
  setForm,
  fieldClass,
  t,
  isStock,
  isMutualFund,
  isCrypto,
  isFdInstrument,
}) {
  return (
    <>
      {form.kind === "liability" && (
        <>
          <div>
            <label className="ed-field-label">{t("netWorth.form.originalLoanAmount")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.originalLoanAmount}
              onChange={(e) => setForm((f) => ({ ...f, originalLoanAmount: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("netWorth.form.interest")}</label>
            <input
              type="number"
              min="0"
              max="60"
              className={fieldClass}
              value={form.interestRate}
              onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("netWorth.form.emi")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.emi}
              onChange={(e) => setForm((f) => ({ ...f, emi: e.target.value }))}
            />
          </div>
        </>
      )}

      {isStock && (
        <>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.ticker")}</label>
              <input
                className={fieldClass}
                value={form.ticker}
                onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                placeholder={t("netWorth.form.tickerPh")}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.exchange")}</label>
              <select
                className={fieldClass}
                value={form.exchange}
                onChange={(e) => setForm((f) => ({ ...f, exchange: e.target.value }))}
              >
                {["NSE", "BSE", "NASDAQ", "NYSE"].map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.quantity")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.buyPrice")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.buyPrice}
                onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
              />
            </div>
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
              <input
                type="number"
                min="1950"
                max="2100"
                className={fieldClass}
                value={form.purchaseYear}
                onChange={(e) => setForm((f) => ({ ...f, purchaseYear: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseMonth")}</label>
              <select
                className={fieldClass}
                value={form.purchaseMonth}
                onChange={(e) => setForm((f) => ({ ...f, purchaseMonth: e.target.value }))}
              >
                <option value="">{t("netWorth.form.purchaseMonthPh")}</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div className="ed-field-label">{t("netWorth.form.corporateActions")}</div>
            <p className="ed-caption">{t("netWorth.form.corporateActionsHint")}</p>
            {form.corporateActions.map((action, i) => (
              <div key={i} className="ed-grid-2 gap-2" style={{ marginBottom: 8 }}>
                <select
                  className={fieldClass}
                  value={action.type || "split"}
                  onChange={(e) =>
                    setForm((f) => {
                      const next = [...f.corporateActions];
                      next[i] = { ...next[i], type: e.target.value };
                      return { ...f, corporateActions: next };
                    })
                  }
                >
                  <option value="split">{t("wealthDetail.stock.action.split")}</option>
                  <option value="bonus">{t("wealthDetail.stock.action.bonus")}</option>
                  <option value="dividend">{t("wealthDetail.stock.action.dividend")}</option>
                </select>
                <input
                  className={fieldClass}
                  value={action.ratio || action.amount || ""}
                  placeholder={t("netWorth.form.corporateActionDetailPh")}
                  onChange={(e) =>
                    setForm((f) => {
                      const next = [...f.corporateActions];
                      const val = e.target.value;
                      const type = next[i]?.type || action.type;
                      next[i] =
                        type === "dividend"
                          ? { ...next[i], amount: val, ratio: undefined }
                          : { ...next[i], ratio: val, amount: undefined };
                      return { ...f, corporateActions: next };
                    })
                  }
                />
                <input
                  type="date"
                  className={fieldClass}
                  value={action.date || ""}
                  onChange={(e) =>
                    setForm((f) => {
                      const next = [...f.corporateActions];
                      next[i] = { ...next[i], date: e.target.value };
                      return { ...f, corporateActions: next };
                    })
                  }
                />
                {(action.type === "split" || action.type === "bonus") && (
                  <button
                    type="button"
                    className="ed-btn ed-btn-ghost"
                    disabled={action.applied || parseSplitMultiplier(action.ratio) == null}
                    onClick={() =>
                      setForm((f) => {
                        const result = applyStockSplitOrBonus({
                          quantity: f.quantity,
                          buyPrice: f.buyPrice,
                          ratio: action.ratio,
                        });
                        if (!result) return f;
                        const next = [...f.corporateActions];
                        next[i] = { ...next[i], applied: true };
                        return {
                          ...f,
                          quantity: String(result.quantity),
                          buyPrice: String(result.buyPrice),
                          corporateActions: next,
                        };
                      })
                    }
                  >
                    {action.applied ? t("netWorth.form.corporateActionApplied") : t("netWorth.form.corporateActionApply")}
                  </button>
                )}
                <button
                  type="button"
                  className="ed-btn ed-btn-ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      corporateActions: f.corporateActions.filter((_, j) => j !== i),
                    }))
                  }
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ed-btn ed-btn-ghost"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  corporateActions: [...f.corporateActions, { type: "split", date: "", ratio: "" }],
                }))
              }
            >
              {t("netWorth.form.addCorporateAction")}
            </button>
          </div>
        </>
      )}

      {isMutualFund && (
        <>
          <div>
            <label className="ed-field-label">{t("netWorth.form.fundSubType")}</label>
            <select
              className={fieldClass}
              value={form.fundSubType}
              onChange={(e) => setForm((f) => ({ ...f, fundSubType: e.target.value }))}
            >
              {["equity", "debt", "hybrid", "elss", "index"].map((ft) => (
                <option key={ft} value={ft}>
                  {t(`wealthDetail.mf.type.${ft}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.investedAmount")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
              <input
                type="number"
                min="1950"
                max="2100"
                className={fieldClass}
                value={form.purchaseYear}
                onChange={(e) => setForm((f) => ({ ...f, purchaseYear: e.target.value }))}
              />
            </div>
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.monthlySip")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.monthlySip}
                onChange={(e) => setForm((f) => ({ ...f, monthlySip: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.folio")}</label>
              <input
                className={fieldClass}
                value={form.folio}
                onChange={(e) => setForm((f) => ({ ...f, folio: e.target.value }))}
              />
            </div>
          </div>
        </>
      )}

      {isCrypto && (
        <div className="ed-grid-2 gap-2">
          <div>
            <label className="ed-field-label">{t("netWorth.form.purchasePrice")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.purchasePrice}
              onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
            <input
              type="number"
              min="2010"
              max="2100"
              className={fieldClass}
              value={form.purchaseYear}
              onChange={(e) => setForm((f) => ({ ...f, purchaseYear: e.target.value }))}
            />
          </div>
        </div>
      )}

      {isFdInstrument && (
        <>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.interest")}</label>
              <input
                type="number"
                min="0"
                max="20"
                className={fieldClass}
                value={form.interestRate}
                onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.maturityDate")}</label>
              <input
                type="date"
                className={fieldClass}
                value={form.maturityDate}
                onChange={(e) => setForm((f) => ({ ...f, maturityDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.investedAmount")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
              <input
                type="number"
                min="1950"
                max="2100"
                className={fieldClass}
                value={form.purchaseYear}
                onChange={(e) => setForm((f) => ({ ...f, purchaseYear: e.target.value }))}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
