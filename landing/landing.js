const screens = ["home", "insights", "ledger", "agreements"];
let activeIdx = 0;

function cycleScreens() {
  const imgs = document.querySelectorAll(".l-phone-screen img");
  const dots = document.querySelectorAll(".l-phone-dot");
  imgs.forEach((img, i) => img.classList.toggle("active", i === activeIdx));
  dots.forEach((dot, i) => dot.classList.toggle("active", i === activeIdx));
  activeIdx = (activeIdx + 1) % screens.length;
}

const firstImg = document.querySelector(".l-phone-screen img");
if (firstImg && firstImg.complete) {
  cycleScreens();
} else if (firstImg) {
  firstImg.addEventListener("load", cycleScreens, { once: true });
} else {
  cycleScreens();
}
setInterval(cycleScreens, 2800);

const revealEls = document.querySelectorAll(".l-reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
);
revealEls.forEach((el) => observer.observe(el));

/** Same-origin APK mirrored on GitHub Pages (see deploy-pages workflow). */
function getApkUrl() {
  return new URL("./apk/Perovo-dev-latest.apk", window.location.href).href;
}

const GH_RELEASE_APK =
  "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";

async function downloadApk(button) {
  const statusEl = document.getElementById("download-status");
  const barFill = document.getElementById("download-bar-fill");
  const statusText = document.getElementById("download-status-text");
  const apkUrl = getApkUrl();

  statusEl.classList.add("show");
  button.style.pointerEvents = "none";
  button.style.opacity = "0.7";

  try {
    const response = await fetch(apkUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = response.headers.get("Content-Length");
    const total = contentLength ? Number.parseInt(contentLength, 10) : null;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) {
        const pct = Math.min(100, Math.round((received / total) * 100));
        barFill.style.width = `${pct}%`;
        statusText.textContent = `Downloading… ${pct}%`;
      } else {
        const mb = (received / 1024 / 1024).toFixed(1);
        statusText.textContent = `Downloading… ${mb} MB`;
      }
    }

    statusText.textContent = "Saving file…";
    const blob = new Blob(chunks, { type: "application/vnd.android.package-archive" });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "Perovo.apk";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);

    statusText.textContent = "Download complete. Check your Downloads folder.";
    barFill.style.width = "100%";
  } catch (err) {
    console.error("APK download failed:", err);
    statusText.textContent = "Download failed — opening direct link instead.";
    window.location.href = GH_RELEASE_APK;
  } finally {
    button.style.pointerEvents = "";
    button.style.opacity = "";
  }
}

document.querySelectorAll("[data-download-apk]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    downloadApk(btn);
  });
});

async function loadSiteMeta() {
  const el = document.getElementById("site-updated");
  if (!el) return;
  try {
    const res = await fetch("./app-version.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.builtAt) return;
    const date = new Date(data.builtAt);
    const formatted = date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const version = data.version ? ` · v${data.version}` : "";
    el.textContent = `Site last updated ${formatted}${version}`;
    el.hidden = false;
  } catch {
    /* optional */
  }
}

loadSiteMeta();
