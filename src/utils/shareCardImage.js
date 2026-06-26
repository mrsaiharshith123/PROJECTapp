const SHARE_URL = "https://perovo.app";
const CARD_W = 375;
const CARD_H = 220;

function tierRingColor(tone) {
  if (tone === "success" || tone === "ok") return "#2dd4bf";
  if (tone === "warning" || tone === "warn" || tone === "mid") return "#fbbf24";
  return "#f87171";
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawScoreRing(ctx, cx, cy, radius, score, color) {
  const start = -Math.PI / 2;
  const filled = Math.max(0, Math.min(1, score / 100)) * Math.PI * 2;
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + filled);
  ctx.stroke();
  ctx.fillStyle = "#0d0e18";
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0eff8";
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(score), cx, cy);
}

/**
 * Render a 375×220 score share card to PNG.
 * @param {{
 *   score: number,
 *   tierLabel: string,
 *   tierTone?: string,
 *   freeCashLabel: string,
 *   freeCash: string,
 *   runwayLabel: string,
 *   runway: string,
 *   brandName: string,
 *   subtitle: string,
 *   brandLine: string,
 * }} props
 * @returns {Promise<Blob>}
 */
export async function renderScoreShareCardPng(props) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const ringColor = tierRingColor(props.tierTone);

  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#0d0e18");
  bg.addColorStop(1, "#181930");
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 20);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(99,102,241,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(props.brandName.toUpperCase(), 20, 28);

  ctx.fillStyle = "#f0eff8";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText(props.subtitle, 20, 48);

  drawScoreRing(ctx, CARD_W - 52, 52, 28, props.score, ringColor);

  ctx.fillStyle = ringColor;
  ctx.font = "500 12px system-ui, sans-serif";
  ctx.fillText(props.tierLabel, 20, 72);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 10px system-ui, sans-serif";
  ctx.fillText(props.freeCashLabel.toUpperCase(), 20, 118);
  ctx.fillStyle = "#fcd34d";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText(props.freeCash, 20, 136);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 10px system-ui, sans-serif";
  ctx.fillText(props.runwayLabel.toUpperCase(), 170, 118);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText(props.runway, 170, 136);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(20, 158);
  ctx.lineTo(CARD_W - 20, 158);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "500 10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(props.brandLine, CARD_W - 20, CARD_H - 16);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("png"));
    }, "image/png");
  });
}

/**
 * Share PNG + link via Web Share API, or download + clipboard fallback.
 * @param {Blob} blob
 * @param {{ title?: string, url?: string }} [opts]
 */
export async function shareScoreCardImage(blob, opts = {}) {
  const { title = "Perovo", url = SHARE_URL } = opts;
  const file = new File([blob], "perovo-score.png", { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file], url });
    return { method: "share" };
  }
  if (navigator.share) {
    await navigator.share({ title, url });
    return { method: "share" };
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "perovo-score.png";
  link.click();
  URL.revokeObjectURL(link.href);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return { method: "download" };
  }
  return { method: "download" };
}
