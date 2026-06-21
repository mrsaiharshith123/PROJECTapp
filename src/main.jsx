import { bootstrapThemeFromStorage } from "./utils/theme.js";
import { applyUiThemeToDocument } from "./utils/applyUiTheme.js";

bootstrapThemeFromStorage();
applyUiThemeToDocument();

await import("./renderApp.jsx");
