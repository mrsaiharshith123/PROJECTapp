from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src/pages/Lending.jsx"
t = p.read_text(encoding="utf-8")
replacement = """          <div className="space-y-4">
            <LendingFormFields form={form} setForm={setForm} formErrors={formErrors} inputClass={inputClass} />
          </div>"""

t2, n = re.subn(
    r'<div className="space-y-4">\s*<div>\s*<label className="block text-xs font-semibold text-gray-600 mb-1">Person</label>.*?</div>\s*</div>\s*</Modal>',
    replacement + "\n        </Modal>",
    t,
    count=2,
    flags=re.DOTALL,
)
if n == 2:
    p.write_text(t2, encoding="utf-8")
    print("replaced", n, "modals")
else:
    print("failed", n)
