import Card from "../components/Card";

const Profile = ({ commitments }) => {
  const totalPaid = commitments
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);

  const stats = [
    { label: "Commitments", value: commitments.length, icon: "📋" },
    { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}`, icon: "✅" },
    { label: "Lent Out", value: "₹11.5K", icon: "🤝" },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Account</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Profile
        </h1>
      </div>

      <Card className="flex flex-col items-center py-8 bg-gradient-to-b from-indigo-50 to-white border-indigo-100">
        <div
          className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-indigo-200"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          S
        </div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Sora', sans-serif" }}>Sai</h2>
        <p className="text-sm text-gray-400 mt-1">Personal Finance Tracker</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center p-4">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-lg font-bold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Info</p>
        {[
          { icon: "👤", label: "Full Name", value: "Sai Kumar" },
          { icon: "📱", label: "Phone", value: "9876543210" },
          { icon: "📍", label: "Location", value: "Hyderabad, India" },
          { icon: "📅", label: "Member Since", value: "January 2025" },
        ].map((item, i, arr) => (
          <div key={item.label} className={`flex items-center gap-3 py-2 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-lg">{item.icon}</div>
            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="font-semibold text-gray-800">{item.value}</p>
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Settings</p>
        {[
          { icon: "🔔", label: "Notifications" },
          { icon: "🔒", label: "Privacy & Security" },
          { icon: "💾", label: "Export Data" },
          { icon: "🚪", label: "Sign Out" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 px-1 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
            <span className="text-gray-300 text-sm">›</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default Profile;
