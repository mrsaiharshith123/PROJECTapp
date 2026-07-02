import { recognizeWithVision, isVisionConfigured } from "../services/ocr/googleVision.js";

/** @param {File} file */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * @param {File} imageFile
 * @param {(pct: number) => void} [onProgress]
 */
async function recognizeWithTesseract(imageFile, onProgress) {
  const { default: Tesseract } = await import("tesseract.js");
  const {
    data: { text },
  } = await Tesseract.recognize(imageFile, "eng+hin", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return text;
}

/**
 * @param {File} imageFile
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ text: string, engine: "vision" | "tesseract" }>}
 */
export async function recognizeTextFromImage(imageFile, onProgress) {
  if (isVisionConfigured()) {
    onProgress?.(20);
    const base64 = await fileToBase64(imageFile);
    const visionText = await recognizeWithVision(base64);
    onProgress?.(100);
    if (visionText) return { text: visionText, engine: "vision" };
  }

  const text = await recognizeWithTesseract(imageFile, onProgress);
  return { text, engine: "tesseract" };
}

/** @param {string} ocrText */
export function extractBillData(ocrText) {
  const amountPatterns = [
    /(?:total|amount\s*due|payable|net\s*amount)[:\s]+(?:₹|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)(?=\s*(?:₹|rs|only))/i,
  ];

  let amount = null;
  for (const pattern of amountPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ""));
      if (amount > 0 && amount < 1000000) break;
    }
  }

  const datePatterns = [
    /(?:due\s*date|pay\s*by|last\s*date|before)[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
    /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/,
  ];

  let dueDate = null;
  for (const pattern of datePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const raw = match[1];
      const parts = raw.split(/[/\-.]/);
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (y.length === 2) y = `20${y}`;
        if (y.length === 4) {
          dueDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }
      if (dueDate) break;
    }
  }

  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);
  const merchantHint = lines[0]?.slice(0, 60) || "";

  let category = "Utility";
  if (/electricity|bescom|mseb|wbsedcl|tsspdcl|tneb|besst|discom/i.test(ocrText)) category = "Electricity";
  else if (/water|jal\s*board|municipal\s*water/i.test(ocrText)) category = "Utility";
  else if (/broadband|internet|fiber|airtel|jio|bsnl|act\s*fibernet/i.test(ocrText)) category = "Utility";
  else if (/gas|png|mgl|adani\s*gas|indane/i.test(ocrText)) category = "Utility";
  else if (/insurance|premium|lic|policy/i.test(ocrText)) category = "Insurance";
  else if (/school|college|fee|tuition/i.test(ocrText)) category = "School";
  else if (/emi|loan|installment/i.test(ocrText)) category = "EMI";

  return { amount, dueDate, merchantHint, category };
}
