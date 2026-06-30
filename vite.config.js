/* global process */
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

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
const updateTestShell = process.env.VITE_UPDATE_TEST_SHELL === "1";
const appVersion = process.env.VITE_APP_VERSION || pkg.version || "0.0.0";
let appBuiltAt = "";
try {
  const manifestPath = path.join(process.cwd(), "public/app-version.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  appBuiltAt = manifest.builtAt || "";
} catch {
  /* dev without generated manifest */
}

const capgoNotifyEnabled = embeddedApp || updateTestShell;
const capgoNotifyEntry = updateTestShell
  ? path.resolve(process.cwd(), "src/capgo-notify-update-test-only.js")
  : path.resolve(process.cwd(), "src/capgo-notify-only.js");

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
  if (updateTestShell) {
    return path.resolve(process.cwd(), "update-test.html");
  }
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
  publicDir: updateTestShell ? false : "public",
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(appBuiltAt),
    "import.meta.env.VITE_UPDATE_TEST_SHELL": JSON.stringify(updateTestShell ? "1" : ""),
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: resolveBuildInput(),
      output: updateTestShell
        ? { entryFileNames: "assets/[name]-[hash].js" }
        : {
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
            },
          },
    },
  },
  plugins: [
    react(),
    ...(capgoNotifyEnabled ? [capgoNotifyFirstPlugin()] : []),
  ],
});
