import { numberToWords } from "./numberToWords.js";
import { sanitizeName, sanitizeText } from "./sanitize.js";

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

/** @param {object} lending */
function documentReference(lending) {
  return `PEROVO-${String(lending.id || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase() || "DRAFT"}`;
}

let clauseCounter = 0;
/** @param {string} title */
function clauseHeading(title) {
  clauseCounter += 1;
  return { text: `${clauseCounter}. ${title}`, style: "section" };
}

/** @param {object} lending @param {object} [settings] */
export function buildAgreementDocDefinition(lending, settings = {}) {
  clauseCounter = 0;
  const lender = sanitizeName(lending.lenderFullName || settings?.displayName || "Lender");
  const borrower = sanitizeName(lending.borrowerFullName || lending.personName || "Borrower");
  const city = sanitizeText(lending.agreementCity || "India", 80);
  const amount = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const amountWords = numberToWords(amount);
  const penalty = lending.penaltyRatePerMonth || 2;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ref = documentReference(lending);

  return {
    pageSize: "A4",
    pageMargins: [60, 70, 60, 60],
    background: function background(_currentPage, pageSize) {
      return [
        {
          canvas: [
            {
              type: "rect",
              x: 24,
              y: 24,
              w: pageSize.width - 48,
              h: pageSize.height - 48,
              lineColor: "#1a1a1a",
              lineWidth: 1.5,
            },
          ],
        },
      ];
    },
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
      docref: { fontSize: 8, color: "#666666" },
      stampTitle: { fontSize: 8, bold: true, color: "#999999", alignment: "center" },
      stampSub: { fontSize: 7.5, color: "#aaaaaa", alignment: "center", margin: [20, 4, 20, 0] },
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
      {
        columns: [
          { text: `Ref: ${ref}`, style: "docref" },
          { text: today, style: "docref", alignment: "right" },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                border: [true, true, true, true],
                fillColor: "#fafafa",
                margin: [10, 14, 10, 14],
                stack: [
                  { text: "SPACE RESERVED FOR STAMP PAPER", style: "stampTitle" },
                  {
                    text: "Print this document onto non-judicial stamp paper of the value required in your state under the Indian Stamp Act 1899, or affix a genuine e-stamp certificate here. Do not substitute this box for real stamp paper.",
                    style: "stampSub",
                  },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#999999",
          vLineColor: () => "#999999",
          hLineStyle: () => ({ dash: { length: 3, space: 2 } }),
          vLineStyle: () => ({ dash: { length: 3, space: 2 } }),
        },
        margin: [0, 0, 0, 16],
      },
      { text: "PROMISSORY NOTE", style: "heading" },
      { text: `Date: ${city}, ${today}`, margin: [0, 0, 0, 16] },
      clauseHeading("PARTIES"),
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
      clauseHeading("PROMISE TO PAY"),
      {
        text: `For value received, I/We ${borrower} (hereinafter "the Borrower") unconditionally promise to pay ${lender} (hereinafter "the Holder") or order, the sum of Rupees ${amountWords} only (₹${amount.toLocaleString("en-IN")}) with interest at ${lending.interestRate || 0}% per annum on the unpaid balance.`,
        margin: [0, 0, 0, 12],
      },
      clauseHeading("LOAN DETAILS"),
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
            clauseHeading("REPAYMENT SCHEDULE"),
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
      clauseHeading("DEFAULT CONSEQUENCES"),
      {
        text: "In the event of non-payment, the entire outstanding amount shall become immediately due. The Holder may file a summary suit under Order XXXVII of the Code of Civil Procedure 1908, or approach Lok Adalat for settlement.",
        margin: [0, 0, 0, 12],
      },
      ...(lending.arbitrationClause !== false
        ? [
            clauseHeading("ARBITRATION"),
            {
              text: `Any dispute shall be resolved by arbitration under the Arbitration and Conciliation Act 1996. Seat of arbitration: ${city}.`,
              margin: [0, 0, 0, 12],
            },
          ]
        : []),
      clauseHeading("GOVERNING LAW"),
      {
        text: `This agreement is governed by the laws of India. Jurisdiction: courts of ${city}.`,
        margin: [0, 0, 0, 24],
      },
      clauseHeading("SIGNATURES"),
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
        text: `Perovo Financial OS · Ref ${ref} · Generated ${today}. This document is for record purposes. Consult a qualified advocate for amounts above ₹1,00,000 or complex arrangements.`,
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

/** @param {object} lending @param {object} [settings] @returns {Promise<{ blob: Blob, fileName: string }>} */
export async function getAgreementPdfBlob(lending, settings = {}) {
  const pdfMake = await loadPdfMake();
  const docDef = buildAgreementDocDefinition(lending, settings);
  const pdf = pdfMake.createPdf(docDef);
  const fileName = `perovo-agreement-${lending.id || Date.now()}.pdf`;
  const blob = await pdf.getBlob();
  return { blob, fileName };
}

/**
 * Shares the agreement PDF via the native share sheet (WhatsApp, email, etc.)
 * when the platform supports sharing files, falling back to a plain download
 * everywhere else (most desktop browsers).
 * @param {object} lending @param {object} [settings]
 * @returns {Promise<{ method: "share" | "download" }>}
 */
export async function shareOrDownloadAgreementPdf(lending, settings = {}) {
  const { blob, fileName } = await getAgreementPdfBlob(lending, settings);

  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Promissory note — ${lending.personName || "loan"}`,
        });
        return { method: "share" };
      }
    } catch (e) {
      if (e instanceof Error && (e.name === "AbortError" || e.name === "NotAllowedError")) {
        return { method: "share" };
      }
      /* fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return { method: "download" };
}
