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
  { key: 'rsvp.confirmTitle', label: 'Confirm Title', defaultEn: '🎉 RSVP Confirmation', defaultHe: '🎉 אישור הגעה' },
  { key: 'rsvp.confirmDescription', label: 'Confirm Description', defaultEn: 'Please confirm the number of guests', defaultHe: 'אנא אמתו את מספר המוזמנים' },
  { key: 'rsvp.submitButton', label: 'Submit Button', defaultEn: '✅ Confirm Attendance', defaultHe: '✅ אשר הגעה' },
  { key: 'rsvp.eventTime', label: 'Event Time', defaultEn: '🕐 The event will take place on the scheduled date and time', defaultHe: '🕐 האירוע יתקיים בתאריך ובשעה שנקבעו' }
];

interface TextOverrides {
  [key: string]: {
    [language: string]: string;
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
  // Load event languages from Supabase when event changes
  // Keep local state (selectedLanguages) in sync so the UI reflects reality
  // Note: event.languages is not persisted in DB; we use table event_languages
  // to store languages per event
  
  useEffect(() => {
    const loadLanguages = async () => {
      if (!event?.id) return;
      const { data, error } = await supabase
        .from('event_languages')
        .select('locale, is_default')
        .eq('event_id', event.id);
      if (!error && data) {
        const locales = data.map(l => l.locale as string);
        setStoredLanguages(locales);
        setSelectedLanguages(locales);
      }
    };
    loadLanguages();
  }, [event?.id]);

  // Available languages - this matches EventManager
  const availableLanguages: LanguageConfig[] = [
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false }
  ];

  const handleSaveLanguages = async () => {
    if (!event) return;

    try {
      const toAdd = selectedLanguages.filter(l => !storedLanguages.includes(l));
      const toDelete = storedLanguages.filter(l => !selectedLanguages.includes(l));

      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('event_languages')
          .delete()
          .eq('event_id', event.id)
          .in('locale', toDelete);
        if (delErr) throw delErr;
      }

      if (toAdd.length > 0) {
        const inserts = toAdd.map(locale => ({ event_id: event.id, locale, is_default: false }));
        const { error: insErr } = await supabase
          .from('event_languages')
          .insert(inserts);
        if (insErr) throw insErr;
      }

      if (selectedLanguages.length > 0) {
        await supabase.from('event_languages')
          .update({ is_default: false })
          .eq('event_id', event.id);
        await supabase.from('event_languages')
          .update({ is_default: true })
          .eq('event_id', event.id)
          .eq('locale', selectedLanguages[0]);
      }

      setStoredLanguages(selectedLanguages);
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

  const handleSaveTexts = () => {
    if (!event) return;
    
    onEventUpdate(event.id, { languages: selectedLanguages });
    setEditingKey(null);
    
    toast({
      title: i18n.language === 'he' ? "נשמר בהצלחה" : "Saved Successfully",
      description: i18n.language === 'he' ? "טקסטים מותאמים אישית נשמרו" : "Custom texts have been saved",
    });
  };

  const handleResetText = (textKey: string) => {
    const newOverrides = { ...textOverrides };
    delete newOverrides[textKey];
    setTextOverrides(newOverrides);
    
    toast({
      title: i18n.language === 'he' ? "אופס" : "Reset",
      description: i18n.language === 'he' ? "הטקסט חזר לברירת המחדל" : "Text reset to default",
    });
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hebrew */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">עברית</Label>
                      {editingKey === item.key ? (
                        <Textarea
                          dir="rtl"
                          value={getDisplayText(item.key, 'he', item.defaultHe)}
                          onChange={(e) => handleTextChange(item.key, 'he', e.target.value)}
                          className="min-h-[60px] text-right"
                          placeholder={item.defaultHe}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded border text-right" dir="rtl">
                          {getDisplayText(item.key, 'he', item.defaultHe)}
                        </div>
                      )}
                    </div>

                    {/* English */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">English</Label>
                      {editingKey === item.key ? (
                        <Textarea
                          value={getDisplayText(item.key, 'en', item.defaultEn)}
                          onChange={(e) => handleTextChange(item.key, 'en', e.target.value)}
                          className="min-h-[60px]"
                          placeholder={item.defaultEn}
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded border">
                          {getDisplayText(item.key, 'en', item.defaultEn)}
                        </div>
                      )}
                    </div>
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