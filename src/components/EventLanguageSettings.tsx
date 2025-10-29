import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Save, X, Edit3, RotateCcw } from "lucide-react";
import type { Event } from "@/components/EventManager";
import { supabase } from "@/integrations/supabase/client";
// Language configuration interface
interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

interface EventLanguageSettingsProps {
  event: Event | null;
  onEventUpdate: (eventId: string, updates: Partial<Event>) => void;
}

// Default translatable keys that can be overridden per event
const EDITABLE_KEYS = [
  { key: 'rsvp.welcome', label: 'Welcome Message', defaultEn: 'Hello {{name}}! 👋', defaultHe: 'שלום {{name}}! 👋' },
  { key: 'rsvp.eventInvitation', label: 'Event Invitation', defaultEn: 'We are honored to invite you to {{eventName}}', defaultHe: 'אנחנו מתכבדים להזמינכם ל{{eventName}}' },
  { key: 'rsvp.confirmTitle', label: 'Confirm Title', defaultEn: 'RSVP Confirmation', defaultHe: 'אישור הגעה' },
  { key: 'rsvp.confirmDescription', label: 'Confirm Description', defaultEn: 'Please confirm the number of guests', defaultHe: 'אנא אמתו את מספר המוזמנים' },
  { key: 'rsvp.fillDetailsInstruction', label: 'Fill Details Instruction', defaultEn: 'Please fill in your details to participate in the event', defaultHe: 'אנא מלא את פרטיך להשתתפות באירוע' },
  { key: 'rsvp.submitButton', label: 'Submit Button', defaultEn: '✅ Confirm Attendance', defaultHe: '✅ אשר הגעה' },
  { key: 'rsvp.eventTime', label: 'Event Time', defaultEn: '🕐 The event will take place on the scheduled date and time', defaultHe: '🕐 האירוע יתקיים בתאריך ובשעה שנקבעו' },
  { key: 'open_rsvp.first_name', label: 'First Name Label', defaultEn: 'First Name', defaultHe: 'שם פרטי' },
  { key: 'open_rsvp.last_name', label: 'Last Name Label', defaultEn: 'Last Name', defaultHe: 'שם משפחה' },
  { key: 'rsvp.numberOfParticipants', label: 'Number of Participants', defaultEn: 'Number of Participants', defaultHe: 'מספר משתתפים' },
  { key: 'rsvp.menLabel', label: 'Men Label', defaultEn: 'Men', defaultHe: 'גברים' },
  { key: 'rsvp.womenLabel', label: 'Women Label', defaultEn: 'Women', defaultHe: 'נשים' }
];

interface TextOverrides {
  [key: string]: {
    [language: string]: string;
  } & {
    hidden?: boolean;
  };
}

const EventLanguageSettings = ({ event, onEventUpdate }: EventLanguageSettingsProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(event?.languages || []);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [textOverrides, setTextOverrides] = useState<TextOverrides>({});
  const [storedLanguages, setStoredLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);
  // Load event languages from Supabase when event changes
  // Keep local state (selectedLanguages) in sync so the UI reflects reality
  // Note: event.languages is not persisted in DB; we use table event_languages
  // to store languages per event
  
  // Load system languages for the language picker
  useEffect(() => {
    const loadSystemLanguages = async () => {
      const { data, error } = await supabase
        .from('system_languages')
        .select('code, name, native_name, flag, rtl');
      
      if (!error && data) {
        const langs = data.map(lang => ({
          code: lang.code,
          name: lang.name,
          nativeName: lang.native_name,
          flag: lang.flag || '🌐',
          rtl: lang.rtl
        }));
        setAvailableLanguages(langs);
      }
    };
    loadSystemLanguages();
  }, []);

  useEffect(() => {
    const loadLanguagesAndTexts = async () => {
      if (!event?.id) return;
      const { data, error } = await supabase
        .from('event_languages')
        .select('locale, is_default, translations')
        .eq('event_id', event.id);
      if (!error && data) {
        const locales = data.map(l => l.locale as string);
        const unique = Array.from(new Set(locales));
        setStoredLanguages(unique);
        setSelectedLanguages(unique);
        
        // Load text overrides from the translations field
        const overrides: TextOverrides = {};
        data.forEach(lang => {
          if (lang.translations && typeof lang.translations === 'object') {
            const translations = lang.translations as Record<string, any>;
            Object.entries(translations).forEach(([key, value]) => {
              if (!overrides[key]) overrides[key] = {};
              if (typeof value === 'object' && value !== null) {
                // New format: {text: {he: "...", en: "..."}, hidden: boolean}
                if (value.text) {
                  Object.entries(value.text).forEach(([locale, text]) => {
                    overrides[key][locale] = text as string;
                  });
                }
                if (value.hidden !== undefined) {
                  overrides[key].hidden = value.hidden;
                }
              } else {
                // Old format: direct string value
                overrides[key][lang.locale] = value as string;
              }
            });
          }
        });
        setTextOverrides(overrides);
      }
    };
    loadLanguagesAndTexts();
  }, [event?.id]);

  const handleSaveLanguages = async () => {
    if (!event) return;

    try {
      // Always fetch current DB state to avoid race conditions
      const { data: current, error: currErr } = await supabase
        .from('event_languages')
        .select('locale')
        .eq('event_id', event.id);
      if (currErr) throw currErr;
      const currentLocales = Array.from(new Set((current || []).map(l => l.locale as string)));

      const toAdd = selectedLanguages.filter(l => !currentLocales.includes(l));
      const toDelete = currentLocales.filter(l => !selectedLanguages.includes(l));

      // Delete languages that were unchecked
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('event_languages')
          .delete()
          .eq('event_id', event.id)
          .in('locale', toDelete);
        if (delErr) throw delErr;
      } else if (selectedLanguages.length === 0 && currentLocales.length > 0) {
        // If nothing selected, remove all languages for this event
        const { error: delAllErr } = await supabase
          .from('event_languages')
          .delete()
          .eq('event_id', event.id);
        if (delAllErr) throw delAllErr;
      }

      // Insert newly added languages (idempotent)
      if (toAdd.length > 0) {
        const inserts = toAdd.map(locale => ({ event_id: event.id, locale, is_default: false }));
        const { error: upErr } = await supabase
          .from('event_languages')
          .upsert(inserts, { onConflict: 'event_id,locale' });
        if (upErr) throw upErr;
      }

      // Ensure one default language when we still have any
      if (selectedLanguages.length > 0) {
        await supabase.from('event_languages')
          .update({ is_default: false })
          .eq('event_id', event.id);
        await supabase.from('event_languages')
          .update({ is_default: true })
          .eq('event_id', event.id)
          .eq('locale', selectedLanguages[0]);
      }

      // Refetch from DB to ensure UI reflects persisted state
      const { data: refreshed, error: refErr } = await supabase
        .from('event_languages')
        .select('locale, is_default')
        .eq('event_id', event.id);
      if (refErr) throw refErr;
      const locales = (refreshed || []).map(l => l.locale as string);
      const unique = Array.from(new Set(locales));
      setStoredLanguages(unique);
      setSelectedLanguages(unique);

      setIsEditDialogOpen(false);

      toast({
        title: i18n.language === 'he' ? "נשמר בהצלחה" : "Saved Successfully",
        description: i18n.language === 'he' ? "שפות האירוע עודכנו" : "Event languages have been updated",
      });
    } catch (err: any) {
      toast({
        title: i18n.language === 'he' ? 'שגיאה בשמירת שפות' : 'Error saving languages',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleTextChange = (textKey: string, language: string, value: string) => {
    setTextOverrides(prev => ({
      ...prev,
      [textKey]: {
        ...prev[textKey],
        [language]: value
      }
    }));
  };

  const handleHiddenChange = async (textKey: string, hidden: boolean) => {
    if (!event) return;
    
    // Update local state immediately
    setTextOverrides(prev => {
      const existing = prev[textKey] || {} as { [key: string]: string };
      return {
        ...prev,
        [textKey]: {
          ...(existing as any),
          hidden
        }
      } as TextOverrides;
    });

    // Save to database immediately
    try {
      const langs = storedLanguages.length > 0 ? storedLanguages : ['he', 'en'];
      const { data: rows, error } = await supabase
        .from('event_languages')
        .select('locale, translations')
        .eq('event_id', event.id)
        .in('locale', langs);
      if (error) throw error;

      const rowsMap = new Map<string, any>((rows || []).map(r => [r.locale as string, r]));
      const updates = langs.map((locale) => {
        const existing = (rowsMap.get(locale)?.translations as Record<string, any>) || {};
        const newTranslations = { ...existing };

        // Get existing text data or create new structure
        const existingTextData = existing[textKey];
        const textData = {
          text: (existingTextData?.text || {}),
          hidden
        };

        // Only save if we have text or hidden flag
        if (Object.keys(textData.text).length > 0 || hidden) {
          newTranslations[textKey] = textData;
        } else {
          delete newTranslations[textKey];
        }

        return { event_id: event.id, locale, translations: newTranslations, is_default: false };
      });

      const { error: upErr } = await supabase
        .from('event_languages')
        .upsert(updates, { onConflict: 'event_id,locale' });
      if (upErr) throw upErr;

      toast({
        title: i18n.language === 'he' ? "נשמר" : "Saved",
        description: hidden 
          ? (i18n.language === 'he' ? "הטקסט מוסתר מהדף" : "Text hidden from page")
          : (i18n.language === 'he' ? "הטקסט מוצג בדף" : "Text shown on page"),
      });
    } catch (err: any) {
      toast({
        title: i18n.language === 'he' ? 'שגיאה בשמירה' : 'Error saving',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveTexts = async () => {
    if (!event || !editingKey) return;
    
    try {
      const langs = storedLanguages.length > 0 ? storedLanguages : ['he', 'en'];
      // Fetch existing translations for these locales
      const { data: rows, error } = await supabase
        .from('event_languages')
        .select('locale, translations')
        .eq('event_id', event.id)
        .in('locale', langs);
      if (error) throw error;

      // Build the combined text data with all language translations
      const hidden = textOverrides[editingKey!]?.hidden || false;
      const textData: any = {
        text: {},
        hidden
      };

      // Collect all language translations for this key
      langs.forEach(locale => {
        const value = textOverrides[editingKey!]?.[locale];
        if (value && value !== '') {
          textData.text[locale] = value;
        }
      });

      const rowsMap = new Map<string, any>((rows || []).map(r => [r.locale as string, r]));
      const updates = langs.map((locale) => {
        const existing = (rowsMap.get(locale)?.translations as Record<string, any>) || {};
        const newTranslations = { ...existing };

        // Save the same text data structure to all locales
        if (Object.keys(textData.text).length > 0 || hidden) {
          newTranslations[editingKey!] = textData;
        } else {
          delete newTranslations[editingKey!];
        }

        return { event_id: event.id, locale, translations: newTranslations, is_default: false };
      });

      const { error: upErr } = await supabase
        .from('event_languages')
        .upsert(updates, { onConflict: 'event_id,locale' });
      if (upErr) throw upErr;

      setEditingKey(null);
      
      toast({
        title: i18n.language === 'he' ? "נשמר בהצלחה" : "Saved Successfully",
        description: i18n.language === 'he' ? "טקסטים מותאמים אישית נשמרו" : "Custom texts have been saved",
      });
    } catch (err: any) {
      toast({
        title: i18n.language === 'he' ? 'שגיאה בשמירת טקסטים' : 'Error saving texts',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleResetText = async (textKey: string) => {
    if (!event) return;

    try {
      const langs = storedLanguages.length > 0 ? storedLanguages : ['he', 'en'];
      const { data: rows, error } = await supabase
        .from('event_languages')
        .select('locale, translations')
        .eq('event_id', event.id)
        .in('locale', langs);
      if (error) throw error;

      const rowsMap = new Map<string, any>((rows || []).map(r => [r.locale as string, r]));
      const updates = langs.map((locale) => {
        const existing = (rowsMap.get(locale)?.translations as Record<string, string>) || {};
        const newTranslations = { ...existing };
        delete newTranslations[textKey];
        return { event_id: event.id, locale, translations: newTranslations, is_default: false };
      });

      const { error: upErr } = await supabase
        .from('event_languages')
        .upsert(updates, { onConflict: 'event_id,locale' });
      if (upErr) throw upErr;

      const newOverrides = { ...textOverrides };
      delete newOverrides[textKey];
      setTextOverrides(newOverrides);
      
      toast({
        title: i18n.language === 'he' ? "אופס" : "Reset",
        description: i18n.language === 'he' ? "הטקסט חזר לברירת המחדל" : "Text reset to default",
      });
    } catch (err: any) {
      toast({
        title: i18n.language === 'he' ? 'שגיאה באיפוס טקסט' : 'Error resetting text',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getDisplayText = (textKey: string, language: string, defaultText: string) => {
    return textOverrides[textKey]?.[language] || defaultText;
  };

  const isOverridden = (textKey: string) => {
    return textOverrides[textKey] && Object.keys(textOverrides[textKey]).length > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {i18n.language === 'he' ? 'הגדרות שפה וטקסטים' : 'Language & Text Settings'}
        </CardTitle>
        {event && (
          <p className="text-sm text-muted-foreground">
            {i18n.language === 'he' 
              ? `אירוע: ${event.title}`
              : `Event: ${event.title}`
            }
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!event ? (
          <p className="text-center text-muted-foreground py-8">
            {i18n.language === 'he' ? 'בחר אירוע כדי לנהל הגדרות שפה וטקסטים' : 'Select an event to manage language and text settings'}
          </p>
        ) : (
          <Tabs defaultValue="languages" className="space-y-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="languages">
                {i18n.language === 'he' ? 'שפות נתמכות' : 'Languages'}
              </TabsTrigger>
              <TabsTrigger value="texts">
                {i18n.language === 'he' ? 'טקסטים מותאמים' : 'Custom Texts'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="languages" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {i18n.language === 'he' ? 'שפות נתמכות' : 'Supported Languages'}
                  </h3>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        {i18n.language === 'he' ? 'ערוך שפות' : 'Edit Languages'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                      <DialogHeader>
                        <DialogTitle>
                          {i18n.language === 'he' ? 'ערוך שפות האירוע' : 'Edit Event Languages'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          {availableLanguages.map((lang) => (
                            <div key={lang.code} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={lang.code}
                                checked={selectedLanguages.includes(lang.code)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLanguages([...selectedLanguages, lang.code]);
                                  } else {
                                    setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code));
                                  }
                                }}
                              />
                              <Label htmlFor={lang.code} className="flex items-center gap-2 cursor-pointer">
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            <X className="h-4 w-4 mr-2" />
                            {i18n.language === 'he' ? 'ביטול' : 'Cancel'}
                          </Button>
                          <Button onClick={handleSaveLanguages}>
                            <Save className="h-4 w-4 mr-2" />
                            {i18n.language === 'he' ? 'שמור' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((langCode) => {
                    const language = availableLanguages.find(l => l.code === langCode);
                    return language ? (
                      <Badge key={langCode} variant="secondary" className="flex items-center gap-1">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="texts" className="space-y-6">
              {EDITABLE_KEYS.map((item) => (
                <div key={item.key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Label className="font-medium">{item.label}</Label>
                       {isOverridden(item.key) && (
                         <Badge variant="secondary" className="text-xs">
                           {i18n.language === 'he' ? 'מותאם אישית' : 'Customized'}
                         </Badge>
                       )}
                       {textOverrides[item.key]?.hidden && (
                         <Badge variant="outline" className="text-xs">
                           {i18n.language === 'he' ? 'מוסתר' : 'Hidden'}
                         </Badge>
                       )}
                     </div>
                    <div className="flex gap-2">
                      {editingKey === item.key ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleSaveTexts}
                            className="h-7 px-2"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingKey(null)}
                            className="h-7 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingKey(item.key)}
                            className="h-7 px-2"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          {isOverridden(item.key) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetText(item.key)}
                              className="h-7 px-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hidden checkbox */}
                  <div className="flex items-center space-x-2 space-x-reverse mb-4">
                    <Checkbox
                      id={`hidden-${item.key}`}
                      checked={textOverrides[item.key]?.hidden || false}
                      onCheckedChange={(checked) => handleHiddenChange(item.key, !!checked)}
                    />
                    <Label htmlFor={`hidden-${item.key}`} className="text-sm">
                      {i18n.language === 'he' ? 'הסתר בדף האירוע' : 'Hide on event page'}
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storedLanguages.map(langCode => {
                      const langConfig = availableLanguages.find(l => l.code === langCode);
                      const langName = langConfig?.nativeName || langCode.toUpperCase();
                      const isRtl = langConfig?.rtl || false;
                      
                      // Get default text based on language
                      let defaultText = '';
                      if (langCode === 'he') defaultText = item.defaultHe;
                      else if (langCode === 'en') defaultText = item.defaultEn;
                      
                      return (
                        <div key={langCode} className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {langConfig?.flag} {langName}
                          </Label>
                          {editingKey === item.key ? (
                            <Textarea
                              dir={isRtl ? 'rtl' : 'ltr'}
                              value={getDisplayText(item.key, langCode, defaultText)}
                              onChange={(e) => handleTextChange(item.key, langCode, e.target.value)}
                              className={`min-h-[60px] ${isRtl ? 'text-right' : ''}`}
                              placeholder={defaultText || `Enter text in ${langName}`}
                            />
                          ) : (
                            <div className={`p-3 bg-muted/50 rounded border ${isRtl ? 'text-right' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                              {getDisplayText(item.key, langCode, defaultText) || (
                                <span className="text-muted-foreground italic">
                                  {i18n.language === 'he' ? 'לא הוגדר' : 'Not set'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {editingKey && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveTexts}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {i18n.language === 'he' ? 'שמור שינויים' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingKey(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {i18n.language === 'he' ? 'ביטול' : 'Cancel'}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default EventLanguageSettings;