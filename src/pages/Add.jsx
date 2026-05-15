import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import { PRIORITIES } from "../constants/priority.js";
import { evaluateNewCommitmentAffordability, affordabilityBadgeClass } from "../engines/affordability.js";
import { getUserModeConfig } from "../constants/userModes.js";

const repeatOptions = [
  { value: "none", label: "Does not repeat" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const Add = () => {
  const { addCommitment, commitments, settings, todayStr, getEffectiveStatus } = useCommitTrack();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
    repeatType: "none",
    priority: "medium",
    notes: "",
    annualInterestRate: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    return errs;
  };

  const showAffordability = getUserModeConfig(settings.userMode || "salaried").showAffordabilityOnAdd;

  const affordability = useMemo(() => {
    if (!showAffordability) return null;
    const amt = Number(form.amount) || 0;
    if (amt <= 0) return null;
    const income = Math.max(0, Number(settings.monthlyIncome) || 0);
    if (income <= 0) return null;
    const draft = {
      amount: amt,
      remainingAmount: amt,
      repeatType: form.repeatType,
      category: form.category || "Other",
      dueDate: form.dueDate || todayStr,
      status: "pending",
    };
    return evaluateNewCommitmentAffordability(income, commitments, draft, getEffectiveStatus);
  }, [
    showAffordability,
    form.amount,
    form.repeatType,
    form.category,
    form.dueDate,
    commitments,
    settings.monthlyIncome,
    todayStr,
    getEffectiveStatus,
  ]);

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const category = form.category || "Other";
    const draft = {
      id: Date.now(),
      name: form.name.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      category,
      repeatType: form.repeatType,
      priority: form.priority,
      notes: form.notes.trim(),
      annualInterestRate:
        form.annualInterestRate === "" ? null : Math.min(60, Math.max(0, Number(form.annualInterestRate) || 0)),
      payments: [],
      status: "pending",
    };
    const effective = getEffectiveStatus({
      ...draft,
      remainingAmount: Number(form.amount),
    });

    addCommitment({
      ...draft,
      status: effective === "overdue" ? "overdue" : "pending",
    });
    navigate("/commitments");
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">New Entry</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Add Commitment
        </h1>
      </div>

      <Card className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commitment Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Bike EMI, Netflix, Rent"
            className={inputClass("name")}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={`${inputClass("amount")} pl-8`}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            className={inputClass("dueDate")}
          />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass("category")}>
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Repeat</label>
          <select name="repeatType" value={form.repeatType} onChange={handleChange} className={inputClass("repeatType")}>
            {repeatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className={inputClass("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Est. annual interest % <span className="text-gray-400 font-normal">(optional, for payoff intel)</span>
          </label>
          <input
            type="number"
            name="annualInterestRate"
            value={form.annualInterestRate}
            onChange={handleChange}
            min="0"
            max="60"
            step="0.1"
            placeholder="e.g. 12 for EMI, 36 for card"
            className={inputClass("annualInterestRate")}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Account number, lender, reminders…"
            className={`${inputClass("notes")} min-h-[72px] resize-y`}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-indigo-200 active:scale-95"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Add Commitment
        </button>
      </Card>

      {affordability && (
        <Card className="space-y-2 border-indigo-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Affordability</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${affordabilityBadgeClass(affordability.tier)}`}
            >
              {affordability.label}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            After adding: ~₹{Math.round(affordability.newTotalBurden).toLocaleString()}/mo burden vs income (
            {affordability.committedPercent != null ? `${affordability.committedPercent}%` : "—"} committed). Free
            money ≈ ₹{Math.round(affordability.freeMoneyAfter).toLocaleString()}.
          </p>
          <p className="text-[11px] text-gray-400">Set monthly income in Analytics or Profile if this shows “—”.</p>
        </Card>
      )}

      <Card className="bg-indigo-50 border-indigo-100">
        <p className="text-sm font-semibold text-indigo-700 mb-2">Quick tips</p>
        <ul className="space-y-1.5 text-xs text-indigo-500">
          <li>• Data stays on this device only</li>
          <li>• Record partial payments from Commitments</li>
          <li>• Monthly and yearly items roll forward after you clear the cycle</li>
        </ul>
      </Card>
    </div>
  );
};

export default Add;
