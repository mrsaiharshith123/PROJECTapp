import { UI_THEME_ID } from "../constants/uiTheme.js";

export function applyUiThemeToDocument() {
  document.documentElement.dataset.ui = UI_THEME_ID;
}
