import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Event } from "./EventManager";

// Language configuration interface
interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

interface EventLanguageSettingsProps {
  selectedEvent: Event | null;
  onEventUpdate: (eventId: string, updates: Partial<Event>) => void;
}

const EventLanguageSettings = ({ selectedEvent, onEventUpdate }: EventLanguageSettingsProps) => {
  const { toast } = useToast();
  
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

  const handleLanguageChange = (newLanguage: string) => {
    if (!selectedEvent) return;
    
    onEventUpdate(selectedEvent.id, { language: newLanguage });
    
    const languageConfig = availableLanguages.find(l => l.code === newLanguage);
    toast({
      title: "✅ שפת האירוע עודכנה",
      description: `השפה שונתה ל${languageConfig ? languageConfig.nativeName : newLanguage}`
    });
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            בחר אירוע כדי לערוך את הגדרות השפה שלו
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentLanguage = availableLanguages.find(l => l.code === selectedEvent.language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌍 הגדרות שפה לאירוע
          <Badge variant="outline">{selectedEvent.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-language">שפה נוכחית</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-3">
              <span className="text-2xl">{currentLanguage?.flag || '🌐'}</span>
              <div>
                <div className="font-medium">
                  {currentLanguage?.nativeName || selectedEvent.language}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentLanguage?.name || 'שפה לא מוכרת'}
                </div>
              </div>
              {currentLanguage?.rtl && (
                <Badge variant="secondary" className="mr-auto">
                  RTL
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="language-select">שנה שפה</Label>
            <Select 
              value={selectedEvent.language} 
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="בחר שפה חדשה" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag}</span>
                      <span>{language.nativeName}</span>
                      {language.rtl && (
                        <Badge variant="outline" className="text-xs">RTL</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">📋 מידע נוסף</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>כיוון כתיבה:</span>
              <span>{currentLanguage?.rtl ? 'ימין לשמאל (RTL)' : 'שמאל לימין (LTR)'}</span>
            </div>
            <div className="flex justify-between">
              <span>קוד שפה:</span>
              <span className="font-mono">{selectedEvent.language}</span>
            </div>
            <div className="flex justify-between">
              <span>שם באנגלית:</span>
              <span>{currentLanguage?.name || 'לא זמין'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventLanguageSettings;