import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGS, resources, type Lang } from './resources';

export const LANGUAGES = LANGS;
export type Language = Lang;

/** Native names for the language switcher. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  uz: "O'zbek",
  ru: 'Русский',
  en: 'English',
};

const STORAGE_KEY = 'rieltor.lang';

/** Saved choice wins; otherwise the app defaults to Uzbek (never the browser locale). */
function initialLanguage(): Language {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return (LANGS as readonly string[]).includes(saved ?? '') ? (saved as Language) : 'uz';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: 'uz',
  defaultNS: 'common',
  // Flat keys ('nav.home' is a literal key, not a path); ':' still separates namespace.
  keySeparator: false,
  nsSeparator: ':',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setLanguage(lang: Language): void {
  window.localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
}

export default i18n;
