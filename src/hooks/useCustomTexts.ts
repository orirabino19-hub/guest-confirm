import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomTexts {
  [key: string]: {
    [language: string]: string;
  } & {
    hidden?: boolean;
  };
}

export const useCustomTexts = (eventId?: string) => {
  const [customTexts, setCustomTexts] = useState<CustomTexts>({});
  const [loading, setLoading] = useState(false);

  const getCustomText = (key: string, language: string, defaultText: string): string => {
    const textOverride = customTexts[key];
    if (!textOverride || textOverride.hidden) {
      return defaultText;
    }
    return textOverride[language] || defaultText;
  };

  const isTextHidden = (key: string): boolean => {
    return customTexts[key]?.hidden === true;
  };

  useEffect(() => {
    const fetchCustomTexts = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_languages')
          .select('locale, translations')
          .eq('event_id', eventId);

        if (!error && data) {
          const texts: CustomTexts = {};
          
          data.forEach(lang => {
            if (lang.translations && typeof lang.translations === 'object') {
              const translations = lang.translations as Record<string, any>;
              Object.entries(translations).forEach(([key, value]) => {
                if (!texts[key]) texts[key] = {};
                
                if (typeof value === 'object' && value !== null) {
                  // New format: {text: {he: "...", en: "..."}, hidden: boolean}
                  if (value.text) {
                    Object.entries(value.text).forEach(([locale, text]) => {
                      texts[key][locale] = text as string;
                    });
                  }
                  if (value.hidden !== undefined) {
                    texts[key].hidden = value.hidden;
                  }
                } else {
                  // Old format: direct string value
                  texts[key][lang.locale] = value as string;
                }
              });
            }
          });
          
          setCustomTexts(texts);
        }
      } catch (error) {
        console.error('Error fetching custom texts:', error);
      }
      setLoading(false);
    };

    fetchCustomTexts();
  }, [eventId]);

  return {
    customTexts,
    loading,
    getCustomText,
    isTextHidden
  };
};