from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/pages/Lending.jsx"
t = p.read_text(encoding="utf-8")
needle = '            <div>\n              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>'
block = r'''            <motionlessPanel className="grid grid-cols-2 gap-2">
              <motionlessPanel>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Interest rate % *</label>
                <input type="number" min="0" max="60" step="0.1" className={inputClass("interestRate")} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
                {formErrors.interestRate && <p className="text-xs text-red-500 mt-1">{formErrors.interestRate}</p>}
              </motionlessPanel>
              <motionlessPanel>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Frequency</label>
                <select className={inputClass("repaymentFrequency")} value={form.repaymentFrequency} onChange={(e) => setForm({ ...form, repaymentFrequency: e.target.value, repaymentType: e.target.value })}>
                  <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="lumpsum">Lump sum</option>
                </select>
              </motionlessPanel>
            </motionlessPanel>
            <motionlessPanel className="grid grid-cols-2 gap-2">
              <motionlessPanel>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start</label>
                <input type="date" className={inputClass("startDate")} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </motionlessPanel>
              <motionlessPanel>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End</label>
                <input type="date" className={inputClass("endDate")} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </motionlessPanel>
            </motionlessPanel>
            <motionlessPanel>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship</label>
              <select className={inputClass("relationshipTag")} value={form.relationshipTag} onChange={(e) => setForm({ ...form, relationshipTag: e.target.value })}>
                {["Friend", "Family", "Business", "Other"].map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </motionlessPanel>
'''
block = block.replace("motionlessPanel", "div")
if needle in t and "interestRate" not in t.split(needle)[0][-400:]:
    p.write_text(t.replace(needle, block + needle, 1), encoding="utf-8")
    print("patched")
else:
    print("skipped", needle in t)
