from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src/pages/Tools.jsx"
t = p.read_text(encoding="utf-8")
new_block = r'''            goals.map((g) => {
              const savedForGoal =
                g.type === "save_amount" ? Number(g.savedAmount) || 0 : settings.savedTowardGoals;
              const ctx = {
                openRemainingSum: openRemaining,
                burdenRatio: ratio,
                savedAmountTowardGoal: savedForGoal,
              };
              const p = computeGoalProgress(g, ctx);
              return (
                <motionlessPanel key={g.id} className="border border-gray-100 rounded-xl p-2 space-y-2">
                  <motionlessPanel className="flex items-center gap-2 text-sm">
                    <motionlessPanel className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{g.title}</p>
                      <p className="text-xs text-gray-500">{goalTypeLabel(g.type)}</p>
                      {g.type === "save_amount" && (
                        <p className="text-[10px] text-emerald-700">
                          Saved: ₹{Number(g.savedAmount || 0).toLocaleString()}
                          {g.targetAmount ? ` / ₹${Number(g.targetAmount).toLocaleString()}` : ""}
                        </p>
                      )}
                      <motionlessPanel className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motionlessPanel
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.round(p * 100)}%` }}
                        />
                      </motionlessPanel>
                    </motionlessPanel>
                    <button
                      type="button"
                      onClick={() => deleteGoal(g.id)}
                      className="text-xs text-red-500 shrink-0"
                    >
                      Remove
                    </button>
                  </motionlessPanel>
                  {g.type === "save_amount" && (
                    <motionlessPanel className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Log ₹"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                        value={goalLogAmounts[g.id] ?? ""}
                        onChange={(e) =>
                          setGoalLogAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          logSavingsToGoal(g.id, goalLogAmounts[g.id]);
                          setGoalLogAmounts((prev) => ({ ...prev, [g.id]: "" }));
                        }}
                        className="px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        Add
                      </button>
                    </motionlessPanel>
                  )}
                </motionlessPanel>
              );
            })'''
new_block = new_block.replace("motionlessPanel", "div")
pat = r"            goals\.map\(\(g\) => \{.*?            \}\)"
t2, n = re.subn(pat, new_block, t, count=1, flags=re.DOTALL)
if n:
    p.write_text(t2, encoding="utf-8")
    print("ok")
else:
    print("fail")
