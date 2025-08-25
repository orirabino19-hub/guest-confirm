import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempLanguages, setTempLanguages] = useState<string[]>([]);
  
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

  const handleEditOpen = () => {
    if (!selectedEvent) return;
    setTempLanguages([...selectedEvent.languages]);
    setIsEditOpen(true);
  };

  const handleLanguageToggle = (languageCode: string) => {
    const isSelected = tempLanguages.includes(languageCode);
    
    if (isSelected) {
      // Don't allow removing the last language
      if (tempLanguages.length === 1) {
        toast({
          title: "❌ שגיאה",
          description: "חייב להשאיר לפחות שפה אחת",
          variant: "destructive"
        });
        return;
      }
      setTempLanguages(prev => prev.filter(l => l !== languageCode));
    } else {
      setTempLanguages(prev => [...prev, languageCode]);
    }
  };

  const handleSave = () => {
    if (!selectedEvent) return;
    
    onEventUpdate(selectedEvent.id, { languages: tempLanguages });
    setIsEditOpen(false);
    
    toast({
      title: "✅ שפות האירוע עודכנו",
      description: `נבחרו ${tempLanguages.length} שפות`
    });
  };

  const handleCancel = () => {
    setIsEditOpen(false);
    setTempLanguages([]);
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

  const currentLanguages = selectedEvent.languages || ['he'];
  const selectedLanguageConfigs = currentLanguages.map(code => 
    availableLanguages.find(l => l.code === code) || { code, name: 'Unknown', nativeName: code, flag: '🌐', rtl: false }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🌍 הגדרות שפה לאירוע
            <Badge variant="outline">{selectedEvent.name}</Badge>
          </CardTitle>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleEditOpen}>ערוך שפות</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>עריכת שפות האירוע</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>בחר שפות לאירוע</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {availableLanguages.map((language) => {
                      const isSelected = tempLanguages.includes(language.code);
                      return (
                        <div key={language.code} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50">
                          <input
                            type="checkbox"
                            id={`edit-lang-${language.code}`}
                            checked={isSelected}
                            onChange={() => handleLanguageToggle(language.code)}
                            className="rounded"
                          />
                          <span className="text-xl">{language.flag}</span>
                          <div className="flex-1">
                            <span className="font-medium">{language.nativeName}</span>
                            <span className="text-sm text-muted-foreground ml-2">({language.name})</span>
                          </div>
                          {language.rtl && (
                            <Badge variant="outline" className="text-xs">RTL</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {tempLanguages.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">יש לבחור לפחות שפה אחת</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1" disabled={tempLanguages.length === 0}>
                    שמור שינויים
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    ביטול
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>שפות נוכחיות</Label>
            <div className="mt-2 space-y-2">
              {selectedLanguageConfigs.map((lang) => (
                <div key={lang.code} className="p-3 bg-muted rounded-lg flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-sm text-muted-foreground">{lang.name}</div>
                  </div>
                  {lang.rtl && (
                    <Badge variant="secondary">RTL</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">📋 מידע נוסף</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>מספר שפות:</span>
              <span>{currentLanguages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>שפות RTL:</span>
              <span>{selectedLanguageConfigs.filter(l => l.rtl).length}</span>
            </div>
            <div className="flex justify-between">
              <span>קודי שפות:</span>
              <span className="font-mono">{currentLanguages.join(', ')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventLanguageSettings;