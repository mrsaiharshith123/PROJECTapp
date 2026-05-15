import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { CATEGORIES } from "../constants/categories.js";
import { PRIORITIES } from "../constants/priority.js";

const repeatOptions = [
  { value: "none", label: "Does not repeat" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function formFromCommitment(c) {
  return {
    name: c.name || "",
    amount: String(c.amount ?? ""),
    dueDate: c.dueDate || "",
    category: c.category || "Other",
    repeatType: c.repeatType || "none",
    priority: c.priority || "medium",
    notes: c.notes || "",
    annualInterestRate: c.annualInterestRate != null ? String(c.annualInterestRate) : "",
    trialEnd: c.trialEnd || "",
  };
}

export default function CommitmentEditModal({ commitment, onClose, onSave }) {
  const [form, setForm] = useState(() => formFromCommitment(commitment));
  const [errors, setErrors] = useState({});

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = "Enter a valid amount";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(commitment.id, {
      name: form.name.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      category: form.category,
      repeatType: form.repeatType,
      priority: form.priority,
      notes: form.notes.trim(),
      annualInterestRate:
        form.annualInterestRate === "" ? null : Math.min(60, Math.max(0, Number(form.annualInterestRate) || 0)),
      trialEnd: form.category === "Subscription" ? form.trialEnd || "" : "",
    });
    onClose();
  };

  return (
    <Modal
      title="Edit commitment"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
          <input
            className={inputClass("name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹)</label>
          <input
            type="number"
            min="0"
            className={inputClass("amount")}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due date</label>
          <input
            type="date"
            className={inputClass("dueDate")}
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <select
            className={inputClass("category")}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Repeat</label>
          <select
            className={inputClass("repeat")}
            value={form.repeatType}
            onChange={(e) => setForm({ ...form, repeatType: e.target.value })}
          >
            {repeatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
          <select
            className={inputClass("priority")}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Est. annual interest % <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            min="0"
            max="60"
            step="0.1"
            className={inputClass("annualInterestRate")}
            value={form.annualInterestRate}
            onChange={(e) => setForm({ ...form, annualInterestRate: e.target.value })}
            placeholder="For payoff ranking"
          />
        </div>
        {form.category === "Subscription" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Trial ends <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className={inputClass("trialEnd")}
              value={form.trialEnd}
              onChange={(e) => setForm({ ...form, trialEnd: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
          <textarea
            className={`${inputClass("notes")} min-h-[80px] resize-y`}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>
    </Modal>
  );
}
