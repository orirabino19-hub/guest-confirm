import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Globe, Plus, Edit, Save, X, Trash2 } from "lucide-react";

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

interface Translation {
  key: string;
  values: { [languageCode: string]: string };
}

const LanguageSystemManager = () => {
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedTranslations, setEditedTranslations] = useState<{[key: string]: {[lang: string]: string}}>({});
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    code: "",
    name: "",
    nativeName: "",
    flag: "",
    rtl: false
  });

  // Available languages - this would be stored in state/database
  const [languages, setLanguages] = useState<LanguageConfig[]>([
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false }
  ]);

  // Sample translations that support all languages
  const [translations, setTranslations] = useState<Translation[]>([
    {
      key: "index.title",
      values: {
        he: "מערכת ניהול אירועים והזמנות",
        en: "Event Management & Invitation System",
        ar: "نظام إدارة الأحداث والدعوات",
        ru: "Система управления событиями и приглашениями",
        fr: "Système de gestion d'événements et d'invitations"
      }
    },
    {
      key: "index.subtitle",
      values: {
        he: "ברוכים הבאים למערכת המתקדמת לניהול אירועים ואישור הגעה",
        en: "Welcome to the advanced system for event management and RSVP confirmation",
        ar: "مرحباً بكم في النظام المتقدم لإدارة الأحداث وتأكيد الحضور",
        ru: "Добро пожаловать в продвинутую систему управления событиями и подтверждения участия",
        fr: "Bienvenue dans le système avancé de gestion d'événements et de confirmation RSVP"
      }
    },
    {
      key: "rsvp.confirmTitle",
      values: {
        he: "🎉 אישור הגעה",
        en: "🎉 RSVP Confirmation",
        ar: "🎉 تأكيد الحضور",
        ru: "🎉 Подтверждение участия",
        fr: "🎉 Confirmation RSVP"
      }
    },
    {
      key: "common.submit",
      values: {
        he: "שלח",
        en: "Submit",
        ar: "إرسال",
        ru: "Отправить",
        fr: "Soumettre"
      }
    }
  ]);

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    if (languages.find(lang => lang.code === newLanguage.code)) {
      toast({
        title: "❌ שגיאה",
        description: "קוד השפה כבר קיים במערכת",
        variant: "destructive"
      });
      return;
    }

    const language: LanguageConfig = {
      ...newLanguage,
      flag: newLanguage.flag || "🌐"
    };

    setLanguages(prev => [...prev, language]);
    
    // Add empty translations for the new language
    setTranslations(prev => prev.map(translation => ({
      ...translation,
      values: {
        ...translation.values,
        [newLanguage.code]: ""
      }
    })));

    setNewLanguage({ code: "", name: "", nativeName: "", flag: "", rtl: false });
    setIsAddLanguageOpen(false);
    
    toast({
      title: "✅ שפה נוספה בהצלחה",
      description: `השפה ${newLanguage.nativeName} נוספה למערכת`
    });
  };

  const handleDeleteLanguage = (languageCode: string) => {
    if (languageCode === 'he' || languageCode === 'en') {
      toast({
        title: "❌ לא ניתן למחוק",
        description: "לא ניתן למחוק את השפות הבסיסיות (עברית ואנגלית)",
        variant: "destructive"
      });
      return;
    }

    setLanguages(prev => prev.filter(lang => lang.code !== languageCode));
    setTranslations(prev => prev.map(translation => {
      const newValues = { ...translation.values };
      delete newValues[languageCode];
      return { ...translation, values: newValues };
    }));

    toast({
      title: "✅ שפה נמחקה",
      description: "השפה וכל התרגומים שלה נמחקו מהמערכת"
    });
  };

  const handleEditStart = (key: string, translation: Translation) => {
    setEditingKey(key);
    setEditedTranslations({
      ...editedTranslations,
      [key]: { ...translation.values }
    });
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditedTranslations({});
  };

  const handleEditSave = (key: string) => {
    setTranslations(prev => prev.map(translation =>
      translation.key === key
        ? { ...translation, values: editedTranslations[key] }
        : translation
    ));

    toast({
      title: "✅ תרגום נשמר",
      description: `התרגום עבור ${key} עודכן בהצלחה`
    });
    setEditingKey(null);
  };

  const handleTranslationChange = (key: string, lang: string, value: string) => {
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            ניהול מערכת שפות
          </CardTitle>
          <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                הוסף שפה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת שפה חדשה</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLanguage} className="space-y-4">
                <div>
                  <Label htmlFor="lang-code">קוד השפה *</Label>
                  <Input
                    id="lang-code"
                    value={newLanguage.code}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                    placeholder="לדוגמא: es, it, de"
                    maxLength={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    קוד ISO 639-1 (2-3 אותיות)
                  </p>
                </div>
                <div>
                  <Label htmlFor="lang-name">שם השפה באנגלית *</Label>
                  <Input
                    id="lang-name"
                    value={newLanguage.name}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="לדוגמא: Spanish"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lang-native">שם השפה המקורי *</Label>
                  <Input
                    id="lang-native"
                    value={newLanguage.nativeName}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, nativeName: e.target.value }))}
                    placeholder="לדוגמא: Español"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lang-flag">דגל השפה</Label>
                  <Input
                    id="lang-flag"
                    value={newLanguage.flag}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, flag: e.target.value }))}
                    placeholder="🇪🇸"
                    maxLength={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lang-rtl"
                    checked={newLanguage.rtl}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, rtl: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="lang-rtl">שפה מימין לשמאל (RTL)</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    הוסף שפה
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddLanguageOpen(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="languages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="languages">שפות זמינות</TabsTrigger>
            <TabsTrigger value="translations">תרגומים</TabsTrigger>
            <TabsTrigger value="settings">הגדרות</TabsTrigger>
          </TabsList>

          <TabsContent value="languages">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {languages.map((language) => (
                  <Card key={language.code} className="relative">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{language.flag}</span>
                          <div>
                            <h3 className="font-medium">{language.nativeName}</h3>
                            <p className="text-sm text-muted-foreground">{language.name}</p>
                          </div>
                        </div>
                        {language.code !== 'he' && language.code !== 'en' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`האם אתה בטוח שברצונך למחוק את השפה ${language.nativeName}?`)) {
                                handleDeleteLanguage(language.code);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {language.code.toUpperCase()}
                        </Badge>
                        {language.rtl && (
                          <Badge variant="secondary" className="text-xs">
                            RTL
                          </Badge>
                        )}
                        {(language.code === 'he' || language.code === 'en') && (
                          <Badge variant="default" className="text-xs">
                            בסיסית
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="translations">
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <strong>הערה:</strong> עריכת תרגומים כאן תשפיע על כל הטקסטים באתר. 
                  ודא שכל השפות מתורגמות באופן מלא וזהה.
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
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {languages.map((language) => (
                              <div key={language.code}>
                                <Label className="flex items-center gap-1">
                                  <span>{language.flag}</span>
                                  {language.nativeName}
                                </Label>
                                <Textarea
                                  value={editedTranslations[translation.key]?.[language.code] || translation.values[language.code] || ""}
                                  onChange={(e) => handleTranslationChange(translation.key, language.code, e.target.value)}
                                  className="mt-1 min-h-[60px]"
                                  dir={language.rtl ? "rtl" : "ltr"}
                                  placeholder={`תרגום ל${language.nativeName}...`}
                                />
                              </div>
                            ))}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {languages.map((language) => (
                            <div key={language.code}>
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>{language.flag}</span>
                                {language.nativeName}
                              </Label>
                              <p 
                                className="text-sm p-2 bg-muted/50 rounded mt-1 min-h-[40px]" 
                                dir={language.rtl ? "rtl" : "ltr"}
                              >
                                {translation.values[language.code] || (
                                  <span className="text-muted-foreground italic">טרם תורגם</span>
                                )}
                              </p>
                            </div>
                          ))}
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
                      <Select defaultValue="he">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              {language.flag} {language.nativeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

export default LanguageSystemManager;