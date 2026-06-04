/**
 * Structured app logging — dev-friendly, production-safe (no passwords / full emails).
 */

const IS_DEV = import.meta.env.DEV;
const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = IS_DEV ? LEVEL_RANK.debug : LEVEL_RANK.warn;

function maskEmail(value) {
  if (typeof value !== "string" || !value.includes("@")) return value;
  const [user, domain] = value.split("@");
  const head = user.length <= 2 ? "*" : `${user.slice(0, 2)}***`;
  return `${head}@${domain}`;
}

/** @param {unknown} meta */
function sanitizeMeta(meta) {
  if (meta == null || typeof meta !== "object") return meta;
  const out = { .../** @type {Record<string, unknown>} */ (meta) };
  for (const key of Object.keys(out)) {
    const lower = key.toLowerCase();
    if (lower.includes("password") || lower.includes("token") || lower === "accesstoken") {
      out[key] = "[redacted]";
    } else if (lower === "email" || lower === "useremail") {
      out[key] = maskEmail(String(out[key]));
    }
  }
  return out;
}

/**
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} scope
 * @param {string} message
 * @param {unknown} [meta]
 */
function write(level, scope, message, meta) {
  if (LEVEL_RANK[level] < MIN_LEVEL) return;

  const prefix = `[CommitTrack:${scope}]`;
  const line = meta != null ? [message, sanitizeMeta(meta)] : [message];
  if (level === "error") console.error(prefix, ...line);
  else if (level === "warn") console.warn(prefix, ...line);
  else if (level === "info") console.info(prefix, ...line);
  else console.debug(prefix, ...line);
}

function createLogger(scope) {
  return {
    debug: (message, meta) => write("debug", scope, message, meta),
    info: (message, meta) => write("info", scope, message, meta),
    warn: (message, meta) => write("warn", scope, message, meta),
    error: (message, meta) => write("error", scope, message, meta),
  };
}

export const log = {
  app: createLogger("app"),
  auth: createLogger("auth"),
  sync: createLogger("sync"),
  storage: createLogger("storage"),
};

export { maskEmail, sanitizeMeta };
