/**
 * Loan sanction letter and insurance policy field extraction — same OCR
 * pipeline as billOcr.js (recognizeTextFromImage), different regex
 * extractors per document type. Kept as a separate file from billOcr.js
 * since these aren't bills; re-exports the shared OCR call so callers
 * don't need to know it lives in billOcr.js.
 */
export { recognizeTextFromImage } from "./billOcr.js";

/** @param {string} ocrText */
export function extractLoanSanctionData(ocrText) {
  const text = String(ocrText || "");

  const principalPatterns = [
    /(?:sanctioned\s*(?:loan\s*)?amount|loan\s*amount|principal)[:\s]+(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:only|\/-)/i,
  ];
  let principal = null;
  for (const pattern of principalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (value > 0) {
        principal = value;
        break;
      }
    }
  }

  const rateMatch = text.match(/(?:rate\s*of\s*interest|interest\s*rate|roi)[:\s]+([\d.]+)\s*%/i);
  const interestRate = rateMatch ? parseFloat(rateMatch[1]) : null;

  const tenureMatch = text.match(/(?:tenure|loan\s*term|repayment\s*period)[:\s]+(\d+)\s*(months?|years?|yrs?)/i);
  let tenureMonths = null;
  if (tenureMatch) {
    const value = parseInt(tenureMatch[1], 10);
    tenureMonths = /year|yr/i.test(tenureMatch[2]) ? value * 12 : value;
  }

  const emiMatch = text.match(/(?:emi|equated\s*monthly\s*installment)[:\s]+(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const emi = emiMatch ? parseFloat(emiMatch[1].replace(/,/g, "")) : null;

  let lender = "";
  const lenderPatterns = [
    /(?:bank|nbfc|lender)[:\s]+([A-Za-z\s.&]{3,50})/i,
    /^([A-Z][A-Za-z\s.&]{3,50}(?:bank|finance|financial|nbfc))/im,
  ];
  for (const pattern of lenderPatterns) {
    const match = text.match(pattern);
    if (match) {
      lender = match[1].trim().slice(0, 50);
      break;
    }
  }

  let loanType = "personal_loan";
  if (/home\s*loan|housing\s*loan/i.test(text)) loanType = "home_loan";
  else if (/vehicle\s*loan|car\s*loan|auto\s*loan/i.test(text)) loanType = "vehicle_loan";
  else if (/education\s*loan|student\s*loan/i.test(text)) loanType = "education_loan";
  else if (/business\s*loan/i.test(text)) loanType = "business_debt";

  return { principal, interestRate, tenureMonths, emi, lender, loanType };
}

/** @param {string} ocrText */
export function extractInsurancePolicyData(ocrText) {
  const text = String(ocrText || "");

  const sumAssuredMatch = text.match(/(?:sum\s*assured|coverage\s*amount|sum\s*insured)[:\s]+(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const sumAssured = sumAssuredMatch ? parseFloat(sumAssuredMatch[1].replace(/,/g, "")) : null;

  const premiumMatch = text.match(/(?:premium\s*(?:amount)?)[:\s]+(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const premium = premiumMatch ? parseFloat(premiumMatch[1].replace(/,/g, "")) : null;

  const termMatch = text.match(/(?:policy\s*term|term)[:\s]+(\d+)\s*years?/i);
  const termYears = termMatch ? parseInt(termMatch[1], 10) : null;

  const policyNumberMatch = text.match(/(?:policy\s*(?:no\.?|number))[:\s]+([A-Z0-9\-/]{5,25})/i);
  const policyNumber = policyNumberMatch ? policyNumberMatch[1].trim() : "";

  let frequency = "yearly";
  if (/monthly\s*premium/i.test(text)) frequency = "monthly";
  else if (/quarterly\s*premium/i.test(text)) frequency = "quarterly";
  else if (/half[\s-]*yearly\s*premium/i.test(text)) frequency = "half_yearly";

  let insurer = "";
  const insurerMatch = text.match(/^([A-Z][A-Za-z\s.&]{3,50}(?:life|insurance|assurance))/im);
  if (insurerMatch) insurer = insurerMatch[1].trim().slice(0, 50);

  const nomineeMatch = text.match(/(?:nominee)[:\s]+([A-Za-z\s.]{2,40})/i);
  const nomineeName = nomineeMatch ? nomineeMatch[1].trim() : "";

  return { sumAssured, premium, termYears, policyNumber, frequency, insurer, hasNominee: Boolean(nomineeName), nomineeName };
}
