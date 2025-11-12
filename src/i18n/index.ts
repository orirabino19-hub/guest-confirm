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

// ✅ Read language from URL BEFORE initializing i18n
const getInitialLanguage = (): string => {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  
  if (langParam && ['he', 'en', 'de', 'ar', 'ru', 'fr', 'es'].includes(langParam)) {
    console.log('🌐 Initial language from URL:', langParam);
    return langParam;
  }
  
  // Fallback to localStorage or default
  const storedLang = localStorage.getItem('i18nextLng');
  if (storedLang && ['he', 'en', 'de', 'ar', 'ru', 'fr', 'es'].includes(storedLang)) {
    return storedLang;
  }
  
  return 'he'; // Default to Hebrew
};

const initialLanguage = getInitialLanguage();

// ✅ Initialize i18n synchronously with the correct language
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'he',
      lng: initialLanguage, // ✅ Use language from URL
      debug: false,

      interpolation: {
        escapeValue: false, // React already escapes
      },

      detection: {
        order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
    });
}

export default i18n;