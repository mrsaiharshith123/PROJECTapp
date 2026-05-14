import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Commitments from "./pages/Commitments";
import Add from "./pages/Add";
import Lending from "./pages/Lending";
import Profile from "./pages/Profile";

// Seed data shown on first load (before user adds anything)
const SEED_COMMITMENTS = [
  { id: 1, name: "Bike EMI", amount: 2500, dueDate: "2026-05-20", status: "pending" },
  { id: 2, name: "Netflix", amount: 199, dueDate: "2026-05-05", status: "paid" },
  { id: 3, name: "Electricity Bill", amount: 1400, dueDate: "2026-05-01", status: "overdue" },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem("commitments");
    if (raw) return JSON.parse(raw);
  } catch {}
  // First visit: save seed data and return it
  localStorage.setItem("commitments", JSON.stringify(SEED_COMMITMENTS));
  return SEED_COMMITMENTS;
}

function App() {
  const [commitments, setCommitments] = useState(loadFromStorage);

  // Persist every change to localStorage
  useEffect(() => {
    localStorage.setItem("commitments", JSON.stringify(commitments));
  }, [commitments]);

  function addCommitment(commitment) {
    setCommitments((prev) => [...prev, commitment]);
  }

  function markPaid(id) {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "paid" } : c))
    );
  }

  function deleteCommitment(id) {
    setCommitments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="md:pt-20 pb-24 md:pb-8 px-4 max-w-2xl mx-auto">
          <div className="pt-6">
            <Routes>
              <Route path="/" element={<Home commitments={commitments} />} />
              <Route
                path="/commitments"
                element={
                  <Commitments
                    commitments={commitments}
                    onMarkPaid={markPaid}
                    onDelete={deleteCommitment}
                  />
                }
              />
              <Route path="/add" element={<Add onAdd={addCommitment} />} />
              <Route path="/lending" element={<Lending />} />
              <Route path="/profile" element={<Profile commitments={commitments} />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
