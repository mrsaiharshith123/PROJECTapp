/* global process */
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webfontDownload from "vite-plugin-webfont-dl";
import pkg from "./package.json" with { type: "json" };

const SELF_HOSTED_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400;9..144,0,600;9..144,0,700;9..144,1,400;9..144,1,600;9..144,1,700&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Sans+Ol+Chiki:wght@400;500;600;700&family=Noto+Sans+Oriya:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap";

/** GitHub Pages project site: https://user.github.io/PROJECTapp/ */
function resolveViteBase(raw) {
  const value = raw || "/PROJECTapp/";
  if (value === "./" || value === ".") return "./";
  if (value.startsWith("/")) {
    return value.endsWith("/") ? value : `${value}/`;
  }
  return `/${value}/`;
}

const basePath = resolveViteBase(process.env.VITE_BASE_PATH);
const embeddedApp = process.env.VITE_EMBEDDED_APP === "1";
const appVersion = process.env.VITE_APP_VERSION || pkg.version || "0.0.0";
let appBuiltAt = "";
try {
  const manifestPath = path.join(process.cwd(), "public/app-version.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  appBuiltAt = manifest.builtAt || "";
} catch {
  /* dev without generated manifest */
}

const capgoNotifyEnabled = embeddedApp;
const capgoNotifyEntry = path.resolve(process.cwd(), "src/capgo-notify-only.js");

function capgoAssetPath(fileName) {
  if (basePath === "./") return `./${fileName}`;
  return `${basePath}${fileName}`.replace(/\/{2,}/g, "/");
}

/** Capgo must receive notifyAppReady before React chunks load — separate tiny entry injected first. */
function capgoNotifyFirstPlugin() {
  return {
    name: "capgo-notify-first",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const capgoChunk = Object.values(ctx.bundle).find(
          (item) => item.type === "chunk" && item.name === "capgo-notify",
        );
        if (!capgoChunk || typeof capgoChunk.fileName !== "string") return html;

        const capgoSrc = capgoAssetPath(capgoChunk.fileName);
        const tag = `<script type="module" crossorigin src="${capgoSrc}"></script>`;
        let out = html.replace(/<script type="module" src="\/src\/capgo-notify[^"]*"><\/script>\s*/g, "");
        if (out.includes(capgoSrc)) return out;
        return out.replace(/<script type="module"/, `${tag}\n    <script type="module"`);
      },
    },
  };
}

function resolveBuildInput() {
  const mainHtml = path.resolve(process.cwd(), "index.html");
  if (!capgoNotifyEnabled) return mainHtml;
  return {
    main: mainHtml,
    "capgo-notify": capgoNotifyEntry,
  };
}

// PRODUCT RULE: the app must never be publicly web-hosted.
// Production build (npm run build, used by GitHub Pages) outputs ONLY the
// landing page via scripts/vite-build-pages.mjs. The app is local-dev-only
// (npm run dev) and Android-APK-only for real users.

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  publicDir: "public",
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(appBuiltAt),
  },
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    include: ["react-is", "recharts"],
  },
  build: {
    rollupOptions: {
      input: resolveBuildInput(),
      output: {
            entryFileNames: "assets/[name]-[hash].js",
            manualChunks(id) {
              const norm = id.replace(/\\/g, "/");
              if (norm.includes("/ui/providers/I18nProvider")) {
                return "i18n-core";
              }
              if (!norm.includes("node_modules")) return;
              if (id.includes("recharts") || id.includes("d3-")) return "charts";
              if (id.includes("@supabase")) return "supabase";
              if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
              if (id.includes("date-fns")) return "date-fns";
              if (id.includes("tesseract")) return "ocr";
              if (id.includes("pdfmake") || id.includes("pdfjs-dist")) return "pdf";
              if (id.includes("exceljs")) return "excel";
              if (id.includes("fuse.js")) return "search";
              if (id.includes("@lottiefiles") || id.includes("lottie")) return "lottie";
              if (id.includes("decimal.js")) return "decimal";
              if (id.includes("posthog")) return "analytics";
            },
          },
    },
  },
  plugins: [
    react(),
    webfontDownload([SELF_HOSTED_FONTS_URL]),
    ...(capgoNotifyEnabled ? [capgoNotifyFirstPlugin()] : []),
  ],
});
