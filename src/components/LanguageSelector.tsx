import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  eventId?: string;
}

// Default flags for common languages
const DEFAULT_FLAGS: Record<string, string> = {
  'he': '🇮🇱',
  'en': '🇺🇸',
  'de': '🇩🇪',
  'fr': '🇫🇷',
  'es': '🇪🇸',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'ru': '🇷🇺',
  'ar': '🇸🇦',
  'zh': '🇨🇳',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
};

const LanguageSelector = ({ eventId }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ]);

  useEffect(() => {
    const loadLanguages = async () => {
      if (!eventId) return;

      try {
        // Load event languages
        const { data: eventLangs, error: eventError } = await supabase
          .from('event_languages')
          .select('locale')
          .eq('event_id', eventId);

        if (eventError || !eventLangs || eventLangs.length === 0) {
          return; // Keep default languages
        }

        const locales = eventLangs.map(l => l.locale);

        // Load system language details
        const { data: systemLangs, error: systemError } = await supabase
          .from('system_languages')
          .select('code, name, native_name, flag')
          .in('code', locales);

        if (!systemError && systemLangs && systemLangs.length > 0) {
          const loadedLanguages = systemLangs.map(lang => ({
            code: lang.code,
            name: lang.native_name,
            flag: lang.flag || DEFAULT_FLAGS[lang.code] || '🌐'
          }));
          setLanguages(loadedLanguages);
          
          // If current language is not in the event's languages, switch to first available
          const currentLangExists = loadedLanguages.some(lang => lang.code === i18n.language);
          if (!currentLangExists && loadedLanguages.length > 0) {
            const firstLang = loadedLanguages[0];
            i18n.changeLanguage(firstLang.code);
            document.documentElement.dir = firstLang.code === 'he' || firstLang.code === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = firstLang.code;
          }
        }
      } catch (error) {
        console.error('Error loading languages:', error);
      }
    };

    loadLanguages();
  }, [eventId, i18n]);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Update document direction based on language
    document.documentElement.dir = languageCode === 'he' ? 'rtl' : 'ltr';
    // Update document language
    document.documentElement.lang = languageCode;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer gap-2 ${
              i18n.language === language.code ? 'bg-accent' : ''
            }`}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;