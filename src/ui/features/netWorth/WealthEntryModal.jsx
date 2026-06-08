import { useEffect, useState } from "react";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "../../../constants/netWorth/categories.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Button, inputClassName } from "../../index.js";

const emptyForm = (kind) => ({
  kind,
  categoryId: kind === "asset" ? "bank" : "personal_loan",
  name: "",
  value: "",
  notes: "",
  interestRate: "",
  emi: "",
});

export default function WealthEntryModal({ open, kind, entry, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => emptyForm(kind || "asset"));

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setForm({
        kind: entry.kind,
        categoryId: entry.categoryId,
        name: entry.name,
        value: String(entry.value),
        notes: entry.notes || "",
        interestRate: entry.interestRate != null ? String(entry.interestRate) : "",
        emi: entry.emi != null ? String(entry.emi) : "",
      });
    } else {
      setForm(emptyForm(kind || "asset"));
    }
  }, [open, entry, kind]);

  if (!open) return null;

  const categories = form.kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const fieldClass = inputClassName();

  const submit = () => {
    if (!form.name.trim() || !form.value) return;
    onSave({
      kind: form.kind,
      categoryId: form.categoryId,
      name: form.name.trim(),
      value: Number(form.value),
      notes: form.notes.trim(),
      interestRate: form.interestRate !== "" ? Number(form.interestRate) : undefined,
      emi: form.emi !== "" ? Number(form.emi) : undefined,
    });
    onClose();
  };

  return (
    <Modal
      title={t(entry ? "netWorth.editEntry" : form.kind === "asset" ? "netWorth.addAsset" : "netWorth.addLiability")}
      onClose={onClose}
      footer={
        <Button type="button" size="lg" className="w-full" onClick={submit}>
          {t("common.save")}
        </Button>
      }
    >
      <div className="ct-stack">
        <div>
          <label className="ct-field-label">{t("netWorth.form.category")}</label>
          <select
            className={fieldClass}
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ct-field-label">{t("netWorth.form.name")}</label>
          <input
            className={fieldClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("netWorth.form.namePh")}
          />
        </div>
        <div>
          <label className="ct-field-label">{t("netWorth.form.value")}</label>
          <input
            type="number"
            min="0"
            className={fieldClass}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
        </div>
        {form.kind === "liability" && (
          <>
            <div>
              <label className="ct-field-label">{t("netWorth.form.interest")}</label>
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
              <label className="ct-field-label">{t("netWorth.form.emi")}</label>
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
        <div>
          <label className="ct-field-label">{t("netWorth.form.notes")}</label>
          <textarea
            className={`${fieldClass} min-h-[64px]`}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}
