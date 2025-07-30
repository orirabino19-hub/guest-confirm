import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Globe, Edit, Save, X } from "lucide-react";

interface Translation {
  key: string;
  he: string;
  en: string;
}

const LanguageManager = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedTranslations, setEditedTranslations] = useState<{[key: string]: {he: string, en: string}}>({});

  // Sample translations from our i18n files for demo
  const [translations] = useState<Translation[]>([
    {
      key: "index.title",
      he: "מערכת ניהול אירועים והזמנות",
      en: "Event Management & Invitation System"
    },
    {
      key: "index.subtitle", 
      he: "ברוכים הבאים למערכת המתקדמת לניהול אירועים ואישור הגעה",
      en: "Welcome to the advanced system for event management and RSVP confirmation"
    },
    {
      key: "rsvp.welcome",
      he: "שלום {{name}}! 👋",
      en: "Hello {{name}}! 👋"
    },
    {
      key: "rsvp.confirmTitle",
      he: "🎉 אישור הגעה",
      en: "🎉 RSVP Confirmation"
    },
    {
      key: "common.submit",
      he: "שלח",
      en: "Submit"
    },
    {
      key: "common.cancel",
      he: "ביטול", 
      en: "Cancel"
    }
  ]);

  const handleEditStart = (key: string, translation: Translation) => {
    setEditingKey(key);
    setEditedTranslations({
      ...editedTranslations,
      [key]: {
        he: translation.he,
        en: translation.en
      }
    });
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditedTranslations({});
  };

  const handleEditSave = (key: string) => {
    // In a real app, this would save to backend/Supabase
    toast({
      title: "✅ תרגום נשמר",
      description: `התרגום עבור ${key} עודכן בהצלחה`
    });
    setEditingKey(null);
  };

  const handleTranslationChange = (key: string, lang: 'he' | 'en', value: string) => {
    setEditedTranslations({
      ...editedTranslations,
      [key]: {
        ...editedTranslations[key],
        [lang]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          ניהול שפות ותרגומים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="translations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="translations">תרגומים</TabsTrigger>
            <TabsTrigger value="settings">הגדרות שפה</TabsTrigger>
          </TabsList>

          <TabsContent value="translations">
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <strong>הערה:</strong> עריכת תרגומים כאן תשפיע על כל הטקסטים באתר. שימו לב לשמור על פורמט של משתנים במידה וקיימים.
                </p>
              </div>
              
              <div className="space-y-3">
                {translations.map((translation) => (
                  <Card key={translation.key} className="relative">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {translation.key}
                        </code>
                        {editingKey !== translation.key && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(translation.key, translation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {editingKey === translation.key ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>עברית 🇮🇱</Label>
                              <Textarea
                                value={editedTranslations[translation.key]?.he || translation.he}
                                onChange={(e) => handleTranslationChange(translation.key, 'he', e.target.value)}
                                className="mt-1 min-h-[60px]"
                                dir="rtl"
                              />
                            </div>
                            <div>
                              <Label>English 🇺🇸</Label>
                              <Textarea
                                value={editedTranslations[translation.key]?.en || translation.en}
                                onChange={(e) => handleTranslationChange(translation.key, 'en', e.target.value)}
                                className="mt-1 min-h-[60px]"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleEditSave(translation.key)}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              שמור
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleEditCancel}
                            >
                              <X className="h-4 w-4 mr-1" />
                              בטל
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">עברית 🇮🇱</Label>
                            <p className="text-sm p-2 bg-muted/50 rounded mt-1" dir="rtl">
                              {translation.he}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">English 🇺🇸</Label>
                            <p className="text-sm p-2 bg-muted/50 rounded mt-1" dir="ltr">
                              {translation.en}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>שפת ברירת מחדל</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        השפה שתוצג למשתמשים חדשים
                      </p>
                      <select className="w-full p-2 border rounded-md">
                        <option value="he">עברית</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>זיהוי שפה אוטומטי</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        זהה שפה לפי הגדרות הדפדפן
                      </p>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>

                    <Button className="w-full">
                      שמור הגדרות
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LanguageManager;