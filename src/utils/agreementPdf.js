import { numberToWords } from "../engines/lendingAgreement.js";

/** @returns {Promise<typeof import("pdfmake/build/pdfmake.js")>} */
async function loadPdfMake() {
  const [pdfMakeMod, pdfFontsMod] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  const pdfMake = pdfMakeMod.default;
  const pdfFonts = pdfFontsMod.default;
  pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts;
  return pdfMake;
}

/** @param {object} lending @param {object} [settings] */
export function buildAgreementDocDefinition(lending, settings = {}) {
  const lender = lending.lenderFullName || settings?.displayName || "Lender";
  const borrower = lending.borrowerFullName || lending.personName || "Borrower";
  const city = lending.agreementCity || "India";
  const amount = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const amountWords = numberToWords(amount);
  const penalty = lending.penaltyRatePerMonth || 2;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    pageSize: "A4",
    pageMargins: [60, 60, 60, 60],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#1a1a1a",
    },
    styles: {
      heading: { fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 16] },
      section: { fontSize: 12, bold: true, margin: [0, 16, 0, 6] },
      label: { bold: true },
      footer: { fontSize: 9, color: "#888888", alignment: "center", margin: [0, 24, 0, 0] },
      disclaimer: {
        fontSize: 9,
        color: "#555555",
        italics: true,
        margin: [0, 16, 0, 0],
        fillColor: "#f5f5f5",
      },
    },
    content: [
      { text: "PROMISSORY NOTE", style: "heading" },
      { text: `Date: ${city}, ${today}`, margin: [0, 0, 0, 16] },
      { text: "PARTIES", style: "section" },
      {
        table: {
          widths: ["30%", "70%"],
          body: [
            [
              { text: "Lender", style: "label" },
              lender + (lending.lenderAddress ? `\n${lending.lenderAddress}` : ""),
            ],
            [
              { text: "Borrower", style: "label" },
              borrower + (lending.borrowerAddress ? `\n${lending.borrowerAddress}` : ""),
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 16],
      },
      { text: "PROMISE TO PAY", style: "section" },
      {
        text: `For value received, I/We ${borrower} (hereinafter "the Borrower") unconditionally promise to pay ${lender} (hereinafter "the Holder") or order, the sum of Rupees ${amountWords} only (₹${amount.toLocaleString("en-IN")}) with interest at ${lending.interestRate || 0}% per annum on the unpaid balance.`,
        margin: [0, 0, 0, 12],
      },
      { text: "LOAN DETAILS", style: "section" },
      {
        table: {
          widths: ["45%", "55%"],
          body: [
            [
              { text: "Principal Amount", style: "label" },
              `₹${amount.toLocaleString("en-IN")} (${amountWords})`,
            ],
            [{ text: "Date of Advance", style: "label" }, lending.startDate || today],
            [{ text: "Purpose", style: "label" }, lending.loanPurpose || "Personal"],
            [{ text: "Repayment Due", style: "label" }, lending.endDate || "On demand"],
            [
              { text: "Penalty on Default", style: "label" },
              `${penalty}% per month on outstanding`,
            ],
            ...(lending.idProofType
              ? [
                  [
                    { text: "Borrower ID", style: "label" },
                    `${lending.idProofType} ending ${lending.idProofLast4 || "****"}`,
                  ],
                ]
              : []),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 16],
      },
      ...(lending.repaymentSchedule?.length > 0
        ? [
            { text: "REPAYMENT SCHEDULE", style: "section" },
            {
              table: {
                headerRows: 1,
                widths: ["10%", "35%", "30%", "25%"],
                body: [
                  [
                    { text: "#", bold: true },
                    { text: "Due Date", bold: true },
                    { text: "Amount (₹)", bold: true },
                    { text: "Status", bold: true },
                  ],
                  ...lending.repaymentSchedule.map((r, i) => [
                    String(i + 1),
                    r.dueDate || "",
                    `₹${Number(r.totalPayment || 0).toLocaleString("en-IN")}`,
                    r.paymentStatus === "paid" ? "Paid" : "Unpaid",
                  ]),
                ],
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 16],
            },
          ]
        : []),
      { text: "DEFAULT CONSEQUENCES", style: "section" },
      {
        text: "In the event of non-payment, the entire outstanding amount shall become immediately due. The Holder may file a summary suit under Order XXXVII of the Code of Civil Procedure 1908, or approach Lok Adalat for settlement.",
        margin: [0, 0, 0, 12],
      },
      ...(lending.arbitrationClause !== false
        ? [
            {
              text: `ARBITRATION: Any dispute shall be resolved by arbitration under the Arbitration and Conciliation Act 1996. Seat of arbitration: ${city}.`,
              margin: [0, 0, 0, 12],
            },
          ]
        : []),
      { text: "GOVERNING LAW", style: "section" },
      {
        text: `This agreement is governed by the laws of India. Jurisdiction: courts of ${city}.`,
        margin: [0, 0, 0, 24],
      },
      { text: "SIGNATURES", style: "section" },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: "BORROWER", bold: true },
              { text: "\n\n________________________" },
              { text: borrower },
              ...(lending.borrowerOtpVerifiedAt
                ? [
                    {
                      text: `OTP Confirmed: ${new Date(lending.borrowerOtpVerifiedAt).toLocaleString("en-IN")}`,
                      fontSize: 9,
                      color: "#555555",
                    },
                  ]
                : []),
              ...(lending.esignStatus === "completed"
                ? [
                    {
                      text: `Aadhaar eSign: ${new Date(lending.esignCompletedAt || "").toLocaleString("en-IN")}`,
                      fontSize: 9,
                      color: "#0d9488",
                    },
                  ]
                : []),
            ],
          },
          {
            width: "50%",
            stack: [
              { text: "LENDER", bold: true },
              { text: "\n\n________________________" },
              { text: lender },
              ...(lending.lenderOtpVerifiedAt
                ? [
                    {
                      text: `OTP Confirmed: ${new Date(lending.lenderOtpVerifiedAt).toLocaleString("en-IN")}`,
                      fontSize: 9,
                      color: "#555555",
                    },
                  ]
                : []),
            ],
          },
        ],
        margin: [0, 0, 0, 24],
      },
      ...(lending.witness1Name
        ? [
            {
              text: `WITNESS: ${lending.witness1Name} — Phone: ${lending.witness1Phone || "N/A"}`,
              fontSize: 10,
              margin: [0, 0, 0, 24],
            },
          ]
        : []),
      {
        text: "STAMP DUTY NOTICE: This promissory note requires applicable stamp duty under the Indian Stamp Act 1899. Print on stamp paper of the appropriate denomination for your state, or use an e-stamp from shcilestamp.com.",
        style: "disclaimer",
      },
      {
        text: `Generated via Perovo Financial OS on ${today}. This document is for record purposes. Consult a qualified advocate for amounts above ₹1,00,000 or complex arrangements.`,
        style: "footer",
      },
    ],
  };
}

/** @param {object} lending @param {object} [settings] */
export async function generateAgreementPdfBase64(lending, settings = {}) {
  const pdfMake = await loadPdfMake();
  const docDef = buildAgreementDocDefinition(lending, settings);
  return new Promise((resolve, reject) => {
    try {
      const pdf = pdfMake.createPdf(docDef);
      pdf.getBase64((data) => resolve(data));
    } catch (e) {
      reject(e);
    }
  });
}

/** @param {object} lending @param {object} [settings] */
export async function downloadAgreementPdf(lending, settings = {}) {
  const pdfMake = await loadPdfMake();
  const docDef = buildAgreementDocDefinition(lending, settings);
  const pdf = pdfMake.createPdf(docDef);
  const fileName = `perovo-agreement-${lending.id || Date.now()}.pdf`;
  pdf.download(fileName);
}
