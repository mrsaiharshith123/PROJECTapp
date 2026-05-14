import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const statusIcon = { paid: "✅", pending: "🕐", overdue: "⚠️" };

const Home = ({ commitments }) => {
  const navigate = useNavigate();

  const total     = commitments.reduce((s, c) => s + Number(c.amount), 0);
  const paid      = commitments.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
  const remaining = total - paid;
  const paidPct   = total > 0 ? Math.round((paid / total) * 100) : 0;

  const upcoming = commitments
    .filter((c) => c.status === "pending")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const overdue = commitments.filter((c) => c.status === "overdue");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Overview</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Dashboard
        </h1>
      </div>

      {/* Summary card */}
      <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200">
        <p className="text-indigo-200 text-sm font-medium mb-4">Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-indigo-200 text-xs mb-1">Total Due</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs mb-1">Paid</p>
            <p className="text-2xl font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{paid.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs mb-1">Remaining</p>
            <p className="text-2xl font-bold text-amber-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{remaining.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-indigo-200 mb-2">
            <span>Progress</span>
            <span>{paidPct}% paid</span>
          </div>
          <div className="h-2 bg-indigo-500/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Upcoming Payments</h2>
          <button
            onClick={() => navigate("/commitments")}
            className="text-xs text-indigo-500 font-medium hover:underline"
          >
            View all →
          </button>
        </div>

        {upcoming.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-gray-500">No pending payments!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item) => (
              <Card key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg">
                    {statusIcon[item.status]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">Due: {formatDate(item.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ₹{Number(item.amount).toLocaleString()}
                  </p>
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
            Overdue
          </h2>
          <div className="space-y-3">
            {overdue.map((item) => (
              <Card key={item.id} className="flex items-center justify-between border-red-100 bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg">⚡</div>
                  <div>
                    <p className="font-semibold text-red-700">{item.name}</p>
                    <p className="text-xs text-red-400">Was due {formatDate(item.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ₹{Number(item.amount).toLocaleString()}
                  </p>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium border border-red-200">
                    Overdue
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add CTA */}
      <button
        onClick={() => navigate("/add")}
        className="w-full py-3.5 border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold rounded-2xl hover:bg-indigo-50 transition-all text-sm"
      >
        + Add New Commitment
      </button>
    </div>
  );
};

export default Home;
