/**
 * Utility functions for managing dynamic meta tags and Open Graph properties
 */

export interface MetaTagsData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  eventName?: string;
  guestName?: string;
  locale?: string;
}

/**
 * Updates meta tags dynamically for social media sharing
 */
export const updateMetaTags = (data: MetaTagsData) => {
  const {
    title,
    description,
    image = '/fleishman-peles-logo.png',
    url = window.location.href,
    locale = 'he_IL'
  } = data;

  // Update document title
  document.title = title;

  // Helper function to update or create meta tag
  const updateMetaTag = (property: string, content: string, attributeName = 'property') => {
    let element = document.querySelector(`meta[${attributeName}="${property}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Update basic meta tags
  updateMetaTag('description', description, 'name');

  // Update Open Graph tags
  updateMetaTag('og:title', title);
  updateMetaTag('og:description', description);
  updateMetaTag('og:image', image);
  updateMetaTag('og:url', url);
  updateMetaTag('og:locale', locale);

  // Update Twitter tags
  updateMetaTag('twitter:title', title, 'name');
  updateMetaTag('twitter:description', description, 'name');
  updateMetaTag('twitter:image', image, 'name');

  console.log('📱 Meta tags updated for social sharing:', { title, description, image, url });
};

/**
 * Generate meta tags for RSVP page
 */
export const generateRSVPMetaTags = (eventName: string, guestName: string, invitationImage?: string): MetaTagsData => {
  const title = `הזמנה ל${eventName}`;
  const description = guestName 
    ? `היי ${guestName}! הוזמנת לאירוע "${eventName}". אשר את הגעתך כאן!`
    : `הוזמנת לאירוע "${eventName}". אשר את הגעתך כאן!`;

  return {
    title,
    description,
    eventName,
    guestName,
    url: window.location.href,
    image: invitationImage || '/fleishman-peles-logo.png' // Use uploaded invitation or fallback
  };
};

/**
 * Map language codes to Open Graph locales
 */
export const getOpenGraphLocale = (language: string): string => {
  const localeMap: Record<string, string> = {
    'he': 'he_IL',
    'en': 'en_US',
    'de': 'de_DE',
    'ar': 'ar_AR',
    'ru': 'ru_RU',
    'fr': 'fr_FR',
    'es': 'es_ES'
  };
  return localeMap[language] || 'he_IL';
};

/**
 * Generate meta tags for Open RSVP page
 */
export const generateOpenRSVPMetaTags = (
  eventName: string, 
  eventDescription?: string, 
  invitationImage?: string,
  locale?: string,
  translations?: {
    titlePrefix?: string;
    defaultDescription?: string;
    openRegistration?: string;
  }
): MetaTagsData => {
  const titlePrefix = translations?.titlePrefix || 'הזמנה ל';
  const title = `${titlePrefix}${eventName}`;
  
  const openRegistration = translations?.openRegistration || 'הרשמה פתוחה לכולם - הרשם עכשיו!';
  const defaultDescription = translations?.defaultDescription || `הוזמנת לאירוע "${eventName}". ${openRegistration}`;
  
  const description = eventDescription 
    ? `${eventDescription} - ${openRegistration}`
    : defaultDescription;

  return {
    title,
    description,
    eventName,
    url: window.location.href,
    image: invitationImage || '/fleishman-peles-logo.png',
    locale: locale || 'he_IL'
  };
};

/**
 * Generate meta tags for Admin page
 */
export const generateAdminMetaTags = (): MetaTagsData => {
  return {
    title: 'מערכת ניהול אירועים - אדמין',
    description: 'ממשק ניהול מתקדם לאירועים, אורחים ומערכת הזמנות',
    url: window.location.href
  };
};