/**
 * Extract plain text from PDF using pdfjs-dist (client-side).
 * Sorts text items by position so Indian bank statement tables read correctly.
 */

let workerReady = false;

async function ensurePdfWorker() {
  if (workerReady) return;
  const pdfjs = await import("pdfjs-dist");
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  workerReady = true;
  return pdfjs;
}

/**
 * Reconstruct reading-order lines from pdf.js text items.
 * @param {Array<{ str?: string, transform?: number[] }>} items
 */
export function textItemsToLines(items) {
  /** @type {Map<number, { x: number, str: string }[]>} */
  const rowMap = new Map();

  for (const item of items) {
    if (!("str" in item) || !item.str?.trim()) continue;
    const tr = item.transform || [1, 0, 0, 1, 0, 0];
    const y = Math.round(tr[5] / 2) * 2;
    const x = tr[4] || 0;
    if (!rowMap.has(y)) rowMap.set(y, []);
    rowMap.get(y).push({ x, str: item.str });
  }

  const sortedYs = [...rowMap.keys()].sort((a, b) => b - a);
  return sortedYs
    .map((y) =>
      rowMap
        .get(y)
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdfBuffer(buffer) {
  const pdfjs = await ensurePdfWorker();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const parts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = textItemsToLines(
      content.items.filter((item) => "str" in item),
    );
    parts.push(lines.join("\n"));
  }
  return parts.join("\n");
}

/**
 * @param {File} file
 */
export async function extractTextFromPdfFile(file) {
  const buffer = await file.arrayBuffer();
  return extractTextFromPdfBuffer(buffer);
}
