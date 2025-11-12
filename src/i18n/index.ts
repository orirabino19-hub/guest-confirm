import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { he } from './locales/he';
import { en } from './locales/en';

const resources = {
  he: {
    translation: he
  },
  en: {
    translation: en
  }
};

// Extract lang from URL if present
const urlParams = new URLSearchParams(window.location.search);
const langFromUrl = urlParams.get('lang');
const supportedLanguages = ['he', 'en', 'de', 'ar', 'ru', 'fr', 'es'];

// If lang is in URL, use it directly without LanguageDetector
if (langFromUrl && supportedLanguages.includes(langFromUrl)) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: langFromUrl,
      fallbackLng: 'he',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
    });
} else {
  // Use LanguageDetector only when no URL param
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'he',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
    });
}

export default i18n;