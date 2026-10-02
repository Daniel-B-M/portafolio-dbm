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
 *   [data-i18n-attr="attr:key; attr2:key2"]
 *                            each listed attribute is replaced (aria-label,
 *                            alt, title, content, …)
 *   [data-lang-btn="en|es"]  language switch; gets the `is-active` class
 *
 * Other modules can read strings with t(key), react to a switch by
 * listening for the "langchange" event on document, and measure layout in
 * every locale with forEachLanguage().
 */
import en from "./en.js";
import es from "./es.js";

const DEFAULT_LANG = "en";
const STORAGE_KEY = "pref-lang";
const dictionaries = { en, es };
let currentLang = DEFAULT_LANG;

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

/** Look up a string in the active locale (falls back to English). */
export function t(key) {
  const value = dictionaries[currentLang][key];
  return value !== undefined ? value : en[key];
}

function applyText(dict) {
  all("[data-i18n]").forEach((el) => {
    const value = dict[el.getAttribute("data-i18n")];
    if (value === undefined) return;
    if (value.indexOf("<") !== -1) el.innerHTML = value;
    else el.textContent = value;
  });
}

/**
 * Render the visible text in each locale in turn and call fn(lang) while it is
 * applied, then restore the active locale. Runs synchronously, so nothing is
 * painted in between — use it to measure layout across languages.
 */
export function forEachLanguage(fn) {
  Object.keys(dictionaries).forEach((lang) => {
    applyText(dictionaries[lang]);
    fn(lang);
  });
  applyText(dictionaries[currentLang]);
}

/** Apply a locale to the whole document. Unknown locales are ignored. */
export function setLanguage(lang) {
  const dict = dictionaries[lang];
  if (!dict) return;

  currentLang = lang;
  document.documentElement.lang = lang;

  applyText(dict);

  all("[data-i18n-href]").forEach((el) => {
    const href = dict[el.getAttribute("data-i18n-href")];
    if (href) el.setAttribute("href", href);
  });

  all("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((part) => part.trim());
      const value = attr && key ? dict[key] : undefined;
      if (value !== undefined) el.setAttribute(attr, value);
    });
  });

  all("[data-lang-btn]").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      btn.getAttribute("data-lang-btn") === lang
    );
  });

  storeLang(lang);
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
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
