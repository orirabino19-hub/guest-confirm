import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { he } from './locales/he';
import { en } from './locales/en';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jaddfwycowygakforhro.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZGRmd3ljb3d5Z2FrZm9yaHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODQzMzEsImV4cCI6MjA3MjU2MDMzMX0.exxl8LRrKSVuTPMVGXRR-Uh-yWDITdAoL_gdrkpztQc";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const resources = {
  he: {
    translation: he
  },
  en: {
    translation: en
  }
};

// Extract lang and event info from URL
const urlParams = new URLSearchParams(window.location.search);
const langFromUrl = urlParams.get('lang');
const supportedLanguages = ['he', 'en', 'de', 'ar', 'ru', 'fr', 'es'];
const pathname = window.location.pathname;

// Extract event ID from URL patterns like /rsvp/8/open or /s/abc
let eventIdentifier: string | null = null;
const rsvpMatch = pathname.match(/\/rsvp\/([^\/]+)/);
const shortMatch = pathname.match(/\/s\/([^\/]+)/);

if (rsvpMatch) {
  eventIdentifier = rsvpMatch[1];
} else if (shortMatch) {
  eventIdentifier = shortMatch[1];
}

// Cache key for translations
const getCacheKey = (eventId: string, lang: string) => `i18n_cache_${eventId}_${lang}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to load dynamic translations from Supabase
async function loadDynamicTranslations(eventId: string, language: string): Promise<Record<string, string> | null> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(eventId, language);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('🎯 Using cached translations for', language);
        return data;
      }
    }

    console.log('📥 Fetching translations from Supabase for event:', eventId, 'language:', language);

    // First, try to get event by short_code
    let { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('short_code', eventId)
      .single();

    // If not found by short_code, try by UUID
    if (eventError || !event) {
      const { data: eventById, error: eventByIdError } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

      if (eventByIdError || !eventById) {
        console.log('❌ Event not found');
        return null;
      }
      event = eventById;
    }

    // Get translations for this event and language
    const { data: translations, error: translationsError } = await supabase
      .from('event_languages')
      .select('translations')
      .eq('event_id', event.id)
      .eq('locale', language)
      .single();

    if (translationsError || !translations) {
      console.log('⚠️ No translations found for language:', language);
      return null;
    }

    // Convert Supabase format to i18n format
    const i18nTranslations: Record<string, string> = {};
    const translationsData = translations.translations as Record<string, any>;

    Object.entries(translationsData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested structure like { he: "text", en: "text" }
        if (value[language]) {
          i18nTranslations[key] = value[language];
        }
      } else if (typeof value === 'string') {
        i18nTranslations[key] = value;
      }
    });

    // Cache the translations
    localStorage.setItem(cacheKey, JSON.stringify({
      data: i18nTranslations,
      timestamp: Date.now()
    }));

    console.log('✅ Loaded', Object.keys(i18nTranslations).length, 'translations');
    return i18nTranslations;
  } catch (error) {
    console.error('❌ Error loading translations:', error);
    return null;
  }
}

// Initialize i18n and return a promise
export const initI18n = async (): Promise<void> => {
  const targetLang = (langFromUrl && supportedLanguages.includes(langFromUrl)) ? langFromUrl : 'he';
  
  // Load dynamic translations BEFORE initializing i18n
  const finalResources = { ...resources };
  
  if (eventIdentifier && langFromUrl && supportedLanguages.includes(langFromUrl)) {
    const dynamicTranslations = await loadDynamicTranslations(eventIdentifier, langFromUrl);
    
    if (dynamicTranslations && Object.keys(dynamicTranslations).length > 0) {
      // Add dynamic translations to resources before init
      finalResources[langFromUrl] = {
        translation: dynamicTranslations
      };
      console.log('🌐 Dynamic translations loaded for', langFromUrl, '- total keys:', Object.keys(dynamicTranslations).length);
    }
  }
  
  // Now initialize i18n with all resources ready
  await i18n
    .use(initReactI18next)
    .init({
      resources: finalResources,
      lng: targetLang,
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
    });

  console.log('✅ i18n initialized with language:', targetLang);

  // Remove loading screen
  const loadingScreen = document.getElementById('i18n-loading');
  if (loadingScreen) {
    loadingScreen.remove();
  }
};

export default i18n;