import Card from "../components/Card";

const statusConfig = {
  paid:    { label: "Paid",    classes: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-700 border border-amber-200" },
  overdue: { label: "Overdue", classes: "bg-red-100 text-red-600 border border-red-200" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const Commitments = ({ commitments, onMarkPaid, onDelete }) => {
  const counts = {
    paid:    commitments.filter((c) => c.status === "paid").length,
    pending: commitments.filter((c) => c.status === "pending").length,
    overdue: commitments.filter((c) => c.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Monthly</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Commitments
        </h1>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600" style={{ fontFamily: "'Sora', sans-serif" }}>{counts.paid}</p>
          <p className="text-xs text-emerald-500 font-medium mt-0.5">Paid</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600" style={{ fontFamily: "'Sora', sans-serif" }}>{counts.pending}</p>
          <p className="text-xs text-amber-500 font-medium mt-0.5">Pending</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>{counts.overdue}</p>
          <p className="text-xs text-red-400 font-medium mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Empty state */}
      {commitments.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-600">No commitments yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap "Add" to create your first one</p>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {commitments.map((item) => {
          const { label, classes } = statusConfig[item.status] || statusConfig.pending;
          const isOverdue = item.status === "overdue";
          return (
            <Card
              key={item.id}
              className={`space-y-3 ${isOverdue ? "border-red-100 bg-red-50" : ""}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.category && <span>{item.category} · </span>}
                    Due {formatDate(item.dueDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ₹{Number(item.amount).toLocaleString()}
                  </p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${classes}`}>{label}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                {item.status !== "paid" && (
                  <button
                    onClick={() => onMarkPaid(item.id)}
                    className="flex-1 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    ✓ Mark as Paid
                  </button>
                )}
                {item.status === "paid" && (
                  <div className="flex-1 py-2 text-xs font-semibold text-center text-emerald-600 bg-emerald-50 rounded-lg">
                    ✓ Payment Complete
                  </div>
                )}
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Commitments;
