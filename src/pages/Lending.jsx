import Card from "../components/Card";

const lendings = [
  { name: "Harsha", amount: 2000, date: "20 Apr", status: "pending", avatar: "H", note: "Borrowed for medical" },
  { name: "Rahul", amount: 5000, date: "10 Apr", status: "paid", avatar: "R", note: "Travel expenses" },
  { name: "Priya", amount: 1500, date: "28 Apr", status: "pending", avatar: "P", note: "Shopping split" },
  { name: "Kiran", amount: 3000, date: "5 Apr", status: "paid", avatar: "K", note: "Bike repair" },
];

const avatarColors = {
  H: "bg-violet-100 text-violet-600",
  R: "bg-blue-100 text-blue-600",
  P: "bg-pink-100 text-pink-600",
  K: "bg-teal-100 text-teal-600",
};

const Lending = () => {
  const totalLent = lendings.reduce((sum, l) => sum + l.amount, 0);
  const totalPending = lendings
    .filter((l) => l.status === "pending")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalRecovered = lendings
    .filter((l) => l.status === "paid")
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">
          Tracker
        </p>
        <h1
          className="text-3xl font-bold text-gray-900 mt-1"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Lending
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-400 mb-1">Total Lent</p>
          <p className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
            ₹{totalLent.toLocaleString()}
          </p>
        </Card>
        <Card className="text-center p-4 bg-amber-50 border-amber-100">
          <p className="text-xs text-amber-500 mb-1">Pending</p>
          <p className="text-lg font-bold text-amber-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            ₹{totalPending.toLocaleString()}
          </p>
        </Card>
        <Card className="text-center p-4 bg-emerald-50 border-emerald-100">
          <p className="text-xs text-emerald-500 mb-1">Recovered</p>
          <p className="text-lg font-bold text-emerald-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            ₹{totalRecovered.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Lending List */}
      <div className="space-y-3">
        {lendings.map((item) => (
          <Card
            key={item.name}
            className={`flex items-center justify-between ${
              item.status === "pending" ? "" : "opacity-75"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold ${
                  avatarColors[item.avatar]
                }`}
              >
                {item.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{item.note}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <p
                className="font-bold text-gray-800"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                ₹{item.amount.toLocaleString()}
              </p>
              {item.status === "pending" ? (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                  Pending
                </span>
              ) : (
                <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  Paid back
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Lending;
