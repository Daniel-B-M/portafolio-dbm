/**
 * Internationalization.
 *
 * Content lives in ./en.js and ./es.js (one file per locale). This module owns
 * only the behaviour: applying a locale to the DOM, remembering the choice, and
 * wiring the EN / ES buttons.
 *
 * Markup contract:
 *   [data-i18n="key"]        text (or HTML, if the value contains "<") is replaced
 *   [data-i18n-href="key"]   the element's href is replaced
 *   [data-lang-btn="en|es"]  language switch; gets the `is-active` class
 */
import en from "./en.js";
import es from "./es.js";

const DEFAULT_LANG = "en";
const STORAGE_KEY = "pref-lang";
const dictionaries = { en, es };

const all = (selector) =>
  Array.prototype.slice.call(document.querySelectorAll(selector));

function readStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function storeLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    /* private mode / storage disabled — the choice just won't persist */
  }
}

/** Apply a locale to the whole document. Unknown locales are ignored. */
export function setLanguage(lang) {
  const dict = dictionaries[lang];
  if (!dict) return;

  document.documentElement.lang = lang;

  all("[data-i18n]").forEach((el) => {
    const value = dict[el.getAttribute("data-i18n")];
    if (value === undefined) return;
    if (value.indexOf("<") !== -1) el.innerHTML = value;
    else el.textContent = value;
  });

  all("[data-i18n-href]").forEach((el) => {
    const href = dict[el.getAttribute("data-i18n-href")];
    if (href) el.setAttribute("href", href);
  });

  all("[data-lang-btn]").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      btn.getAttribute("data-lang-btn") === lang
    );
  });

  storeLang(lang);
}

/** Pick the initial locale, wire the switch, and render it. */
export function initI18n() {
  const browserLang =
    navigator.language && navigator.language.startsWith("es") ? "es" : DEFAULT_LANG;
  const initialLang = readStoredLang() || browserLang;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-btn]");
    if (btn) setLanguage(btn.getAttribute("data-lang-btn"));
  });

  setLanguage(initialLang);
}
