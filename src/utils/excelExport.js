import ExcelJS from "exceljs";

async function downloadWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function addCommitmentSheet(wb, commitments) {
  const ws = wb.addWorksheet("Commitments");
  ws.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Category", key: "category", width: 15 },
    { header: "Amount (₹)", key: "amount", width: 14 },
    { header: "Frequency", key: "frequency", width: 12 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Notes", key: "notes", width: 30 },
  ];
  for (const c of commitments || []) {
    ws.addRow({
      name: c.name || "",
      category: c.category || "",
      amount: Number(c.amount) || 0,
      frequency: c.repeatType || "",
      dueDate: c.dueDate || "",
      status: c._computedStatus || c.effectiveStatus || "",
      notes: c.notes || "",
    });
  }
}

export async function exportCommitmentsToExcel(commitments) {
  const wb = new ExcelJS.Workbook();
  addCommitmentSheet(wb, commitments);
  await downloadWorkbook(wb, `perovo-commitments-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportLendingToExcel(lendings) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Lending");
  ws.columns = [
    { header: "Person", key: "person", width: 24 },
    { header: "Type", key: "type", width: 12 },
    { header: "Principal (₹)", key: "principal", width: 14 },
    { header: "Remaining (₹)", key: "remaining", width: 14 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "Purpose", key: "purpose", width: 24 },
    { header: "eSign Status", key: "esign", width: 12 },
  ];
  for (const l of lendings || []) {
    ws.addRow({
      person: l.personName || "",
      type: l.type === "lent" ? "Lent" : "Borrowed",
      principal: Number(l.principalAmount ?? l.totalAmount) || 0,
      remaining: Number(l.remainingAmount) || 0,
      startDate: l.startDate || "",
      purpose: l.notes || "",
      esign: l.esignStatus || "none",
    });
  }
  await downloadWorkbook(wb, `perovo-lending-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportAnnualReportToExcel({ commitments, lendings, snapshots }) {
  const wb = new ExcelJS.Workbook();
  const monthly = wb.addWorksheet("Monthly Summary");
  monthly.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Pressure Score", key: "pressureScore", width: 14 },
    { header: "Monthly Burden (₹)", key: "monthlyBurden", width: 18 },
    { header: "Free Cash (₹)", key: "freeMoney", width: 16 },
    { header: "Overdue Count", key: "overdueCount", width: 14 },
  ];
  for (const s of snapshots || []) {
    monthly.addRow({
      month: s.month,
      pressureScore: s.pressureScore,
      monthlyBurden: s.monthlyBurden,
      freeMoney: s.freeMoney,
      overdueCount: s.overdueCount || 0,
    });
  }
  addCommitmentSheet(wb, commitments);
  const lending = wb.addWorksheet("Lending");
  lending.columns = [
    { header: "Person", key: "person", width: 24 },
    { header: "Type", key: "type", width: 12 },
    { header: "Principal", key: "principal", width: 14 },
    { header: "Remaining", key: "remaining", width: 14 },
  ];
  for (const l of lendings || []) {
    lending.addRow({
      person: l.personName || "",
      type: l.type,
      principal: Number(l.principalAmount ?? l.totalAmount) || 0,
      remaining: Number(l.remainingAmount) || 0,
    });
  }
  await downloadWorkbook(wb, `perovo-annual-report-${new Date().getFullYear()}.xlsx`);
}
