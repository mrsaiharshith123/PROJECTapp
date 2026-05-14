import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

const categories = ["Loan", "Subscription", "Utility", "Health", "Rent", "Other"];

const Add = ({ onAdd }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", amount: "", dueDate: "", category: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const newCommitment = {
      id: Date.now(),
      name: form.name.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      category: form.category || "Other",
      status: "pending",
    };
    onAdd(newCommitment);
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
        {/* Name */}
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

        {/* Amount */}
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

        {/* Due Date */}
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

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Category <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={inputClass("category")}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-indigo-200 active:scale-95"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Add Commitment
        </button>
      </Card>

      <Card className="bg-indigo-50 border-indigo-100">
        <p className="text-sm font-semibold text-indigo-700 mb-2">💡 Quick Tips</p>
        <ul className="space-y-1.5 text-xs text-indigo-500">
          <li>• Commitments are saved locally on your device</li>
          <li>• Mark as paid once you've completed a payment</li>
          <li>• Your dashboard updates automatically</li>
        </ul>
      </Card>
    </div>
  );
};

export default Add;
