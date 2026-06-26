/** @typedef {{ family: string, name: string, major: string }} OsInfo */
/** @typedef {{ family: string, name: string, major: string, version?: string }} BrowserInfo */
/** @typedef {{ os: OsInfo, browser: BrowserInfo, label: string, fingerprint: string, formFactor: 'mobile'|'desktop'|'tablet' }} DeviceInfo */

/**
 * Parse OS + browser from a user-agent string (sync; works in tests).
 * @param {string} [ua]
 * @returns {DeviceInfo}
 */
export function parseDeviceInfo(ua = "") {
  const os = parseOs(ua);
  const browser = parseBrowser(ua);
  const formFactor = detectFormFactor(ua, os.family);
  const label = `${os.name} · ${browser.name}`;
  const fingerprint = `${os.family}|${browser.family}`;
  return { os, browser, label, fingerprint, formFactor };
}

/** @returns {DeviceInfo} */
export function getDeviceInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  return parseDeviceInfo(ua);
}

/**
 * Refine Windows version + Chrome build via Client Hints (Chromium).
 * @param {DeviceInfo} base
 * @returns {Promise<DeviceInfo>}
 */
export async function refineDeviceInfoAsync(base) {
  if (typeof navigator === "undefined") return base;
  // @ts-expect-error Navigator.userAgentData — Client Hints (Chromium); not in default TS DOM lib
  const uaData = navigator.userAgentData;
  if (!uaData?.getHighEntropyValues) {
    return base;
  }
  try {
    const hints = await uaData.getHighEntropyValues(["platformVersion", "fullVersionList"]);
    const next = { ...base, os: { ...base.os }, browser: { ...base.browser } };

    if (base.os.family === "windows" && hints.platformVersion) {
      const major = Number.parseInt(String(hints.platformVersion).split(".")[0], 10);
      if (major >= 13) next.os.name = "Windows 11";
      else if (major >= 10) next.os.name = "Windows 10";
      else next.os.name = `Windows ${hints.platformVersion}`;
    }

    const chromeBrand = hints.fullVersionList?.find(
      (b) => b.brand === "Google Chrome" || b.brand === "Chromium",
    );
    if (chromeBrand?.version && base.browser.family === "chrome") {
      const parts = chromeBrand.version.split(".");
      next.browser.version = chromeBrand.version;
      next.browser.name = `Chrome ${parts[0]}${parts[1] ? `.${parts[1]}` : ""}`;
    }

    const edgeBrand = hints.fullVersionList?.find((b) => b.brand === "Microsoft Edge");
    if (edgeBrand?.version && base.browser.family === "edge") {
      const parts = edgeBrand.version.split(".");
      next.browser.version = edgeBrand.version;
      next.browser.name = `Edge ${parts[0]}${parts[1] ? `.${parts[1]}` : ""}`;
    }

    next.label = `${next.os.name} · ${next.browser.name}`;
    return next;
  } catch {
    return base;
  }
}

/**
 * @param {string} ua
 * @returns {OsInfo}
 */
function parseOs(ua) {
  const win = ua.match(/Windows NT (\d+)\.(\d+)/i);
  if (win) {
    const ntMajor = win[1];
    const ntMinor = win[2];
    const name =
      ntMajor === "10" && ntMinor === "0" ? "Windows 10/11" : `Windows NT ${ntMajor}.${ntMinor}`;
    return { family: "windows", name, major: ntMajor };
  }

  const mac = ua.match(/Mac OS X (\d+)[_.](\d+)/i);
  if (mac) {
    return { family: "macos", name: `macOS ${mac[1]}.${mac[2]}`, major: mac[1] };
  }

  const android = ua.match(/Android (\d+(?:\.\d+)?)/i);
  if (android) {
    return { family: "android", name: `Android ${android[1]}`, major: android[1].split(".")[0] };
  }

  if (/iPhone|iPad|iPod/i.test(ua)) {
    const ios = ua.match(/OS (\d+)[_.](\d+)/i);
    const ver = ios ? `${ios[1]}.${ios[2]}` : "";
    return { family: "ios", name: ver ? `iOS ${ver}` : "iPhone / iPad", major: ios?.[1] || "0" };
  }

  if (/Linux/i.test(ua)) {
    return { family: "linux", name: "Linux", major: "0" };
  }

  return { family: "unknown", name: "Unknown device", major: "0" };
}

/**
 * @param {string} ua
 * @returns {BrowserInfo}
 */
function parseBrowser(ua) {
  const edg = ua.match(/Edg\/(\d+)\.(\d+)/);
  if (edg) {
    return { family: "edge", name: `Edge ${edg[1]}`, major: edg[1], version: `${edg[1]}.${edg[2]}` };
  }

  const chrome = ua.match(/Chrome\/(\d+)\.(\d+)/);
  if (chrome && !/Edg\//i.test(ua)) {
    return {
      family: "chrome",
      name: `Chrome ${chrome[1]}`,
      major: chrome[1],
      version: `${chrome[1]}.${chrome[2]}`,
    };
  }

  const firefox = ua.match(/Firefox\/(\d+)\.(\d+)/);
  if (firefox) {
    return {
      family: "firefox",
      name: `Firefox ${firefox[1]}`,
      major: firefox[1],
      version: `${firefox[1]}.${firefox[2]}`,
    };
  }

  const safari = ua.match(/Version\/(\d+)\.(\d+).*Safari/i);
  if (safari && /Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return {
      family: "safari",
      name: `Safari ${safari[1]}`,
      major: safari[1],
      version: `${safari[1]}.${safari[2]}`,
    };
  }

  return { family: "unknown", name: "Browser", major: "0" };
}

/**
 * @param {string} ua
 * @param {string} osFamily
 * @returns {'mobile'|'desktop'|'tablet'}
 */
function detectFormFactor(ua, osFamily) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (osFamily === "android" && !/Mobile/i.test(ua)) return "tablet";
  if (osFamily === "ios" && /iPad/i.test(ua)) return "tablet";
  if (osFamily === "android" || osFamily === "ios") return "mobile";
  return "desktop";
}

/**
 * Fingerprint for deduping sessions — same OS + browser family = one device slot.
 * @param {{ device_label?: string, device_fingerprint?: string }} row
 * @returns {string}
 */
export function getSessionFingerprint(row) {
  if (row?.device_fingerprint) return row.device_fingerprint;
  const label = (row?.device_label || "").toLowerCase();
  let os = "unknown";
  if (label.includes("windows")) os = "windows";
  else if (label.includes("macos") || label.includes("mac")) os = "macos";
  else if (label.includes("android")) os = "android";
  else if (label.includes("iphone") || label.includes("ipad") || label.includes("ios")) os = "ios";
  else if (label.includes("linux")) os = "linux";

  let browser = "unknown";
  if (label.includes("edge")) browser = "edge";
  else if (label.includes("chrome")) browser = "chrome";
  else if (label.includes("firefox")) browser = "firefox";
  else if (label.includes("safari")) browser = "safari";

  return `${os}|${browser}`;
}

/**
 * Keep one row per fingerprint — prefer current device, else most recently active.
 * @param {object[]} rows
 * @param {string} currentDeviceId
 * @returns {object[]}
 */
export function dedupeSessionRows(rows, currentDeviceId) {
  const byFp = new Map();
  for (const row of rows) {
    const fp = getSessionFingerprint(row);
    const prev = byFp.get(fp);
    if (!prev) {
      byFp.set(fp, row);
      continue;
    }
    if (row.device_id === currentDeviceId) {
      byFp.set(fp, row);
      continue;
    }
    if (prev.device_id === currentDeviceId) continue;
    const rowAt = new Date(row.last_active_at || 0).getTime();
    const prevAt = new Date(prev.last_active_at || 0).getTime();
    if (rowAt > prevAt) byFp.set(fp, row);
  }
  return Array.from(byFp.values()).sort(
    (a, b) => new Date(b.last_active_at || 0).getTime() - new Date(a.last_active_at || 0).getTime(),
  );
}

/**
 * @param {object[]} rows
 * @param {string} currentDeviceId
 * @returns {string[]}
 */
export function findStaleSessionDeviceIds(rows, currentDeviceId) {
  const kept = dedupeSessionRows(rows, currentDeviceId);
  const keepIds = new Set(kept.map((r) => r.device_id));
  return rows.filter((r) => !keepIds.has(r.device_id)).map((r) => r.device_id);
}
