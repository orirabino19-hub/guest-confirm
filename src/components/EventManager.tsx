import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Language configuration interface
interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  createdAt: string;
  invitationImage?: string;
  languages: string[]; // Array of language codes for multi-language support
  textOverrides?: {
    [key: string]: {
      [language: string]: string;
    };
  };
}

interface EventManagerProps {
  events: Event[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  onEventCreate: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  onEventDelete: (eventId: string) => void;
}

const EventManager = ({ 
  events, 
  selectedEventId, 
  onEventSelect, 
  onEventCreate, 
  onEventDelete 
}: EventManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: "",
    invitationImage: "",
    languages: ["he"] // Default to Hebrew
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Available languages - this could be fetched from a global state or API
  const [availableLanguages] = useState<LanguageConfig[]>([
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false }
  ]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || newEvent.languages.length === 0) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות הנדרשים ולבחור לפחות שפה אחת",
        variant: "destructive"
      });
      return;
    }

    // Handle image upload (mock for now)
    let invitationImageUrl = "";
    if (selectedFile) {
      // In real implementation, upload to server/cloud storage
      invitationImageUrl = URL.createObjectURL(selectedFile);
    }

    onEventCreate({
      ...newEvent,
      invitationImage: invitationImageUrl
    });
    
    setNewEvent({ name: "", description: "", date: "", invitationImage: "", languages: ["he"] });
    setSelectedFile(null);
    setIsCreateOpen(false);
    
    toast({
      title: "✅ אירוע נוצר בהצלחה",
      description: `האירוע "${newEvent.name}" נוסף למערכת`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "❌ קובץ גדול מדי",
          description: "גודל הקובץ חייב להיות עד 5MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "❌ סוג קובץ לא נתמך",
          description: "יש להעלות קובץ תמונה בלבד",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🎉 ניהול אירועים</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>הוסף אירוע חדש</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>יצירת אירוע חדש</DialogTitle>
              </DialogHeader>
               <form onSubmit={handleCreateEvent} className="space-y-4">
                 <div>
                   <Label htmlFor="event-name">שם האירוע *</Label>
                   <Input
                     id="event-name"
                     value={newEvent.name}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="לדוגמא: החתונה של שייקי ומיכל"
                     required
                   />
                 </div>
                 <div>
                   <Label htmlFor="event-description">תיאור האירוע</Label>
                   <Textarea
                     id="event-description"
                     value={newEvent.description}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="תיאור קצר של האירוע..."
                   />
                 </div>
                 <div>
                   <Label htmlFor="event-date">תאריך האירוע *</Label>
                   <Input
                     id="event-date"
                     type="date"
                     value={newEvent.date}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                     required
                   />
                 </div>
                 <div>
                   <Label>שפות האירוע *</Label>
                   <div className="space-y-2 mt-2">
                     {availableLanguages.map((language) => (
                       <div key={language.code} className="flex items-center gap-2">
                         <input
                           type="checkbox"
                           id={`lang-${language.code}`}
                           checked={newEvent.languages.includes(language.code)}
                           onChange={(e) => {
                             const checked = e.target.checked;
                             setNewEvent(prev => ({
                               ...prev,
                               languages: checked 
                                 ? [...prev.languages, language.code]
                                 : prev.languages.filter(l => l !== language.code)
                             }));
                           }}
                           className="rounded"
                         />
                         <label htmlFor={`lang-${language.code}`} className="text-sm cursor-pointer">
                           {language.flag} {language.nativeName}
                         </label>
                       </div>
                     ))}
                   </div>
                   {newEvent.languages.length === 0 && (
                     <p className="text-xs text-red-500 mt-1">יש לבחור לפחות שפה אחת</p>
                   )}
                 </div>
                 <div>
                   <Label htmlFor="invitation-image">תמונת הזמנה</Label>
                   <Input
                     id="invitation-image"
                     type="file"
                     accept="image/*"
                     onChange={handleFileChange}
                     className="cursor-pointer"
                   />
                   {selectedFile && (
                     <div className="mt-2 p-2 bg-muted rounded-lg">
                       <div className="flex items-center gap-2">
                         <span className="text-sm text-green-600">✓</span>
                         <span className="text-sm font-medium">{selectedFile.name}</span>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => setSelectedFile(null)}
                           className="text-red-500 hover:text-red-700"
                         >
                           ×
                         </Button>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1">
                         גודל: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                       </p>
                     </div>
                   )}
                   <p className="text-xs text-muted-foreground mt-1">
                     עד 5MB, פורמטים נתמכים: JPG, PNG, GIF
                   </p>
                 </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    צור אירוע
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      setSelectedFile(null);
                      setNewEvent({ name: "", description: "", date: "", invitationImage: "", languages: ["he"] });
                    }}
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
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין אירועים עדיין. צור אירוע ראשון!
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEventId === event.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onEventSelect(event.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-medium">{event.name}</h3>
                       <div className="flex flex-wrap gap-1">
                         {event.languages.map(langCode => {
                           const lang = availableLanguages.find(l => l.code === langCode);
                           return (
                             <Badge key={langCode} variant="outline" className="text-xs">
                               {lang ? `${lang.flag} ${lang.nativeName}` : langCode.toUpperCase()}
                             </Badge>
                           );
                         })}
                       </div>
                       {selectedEventId === event.id && (
                         <Badge variant="default">נבחר</Badge>
                       )}
                     </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {event.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      📅 {new Date(event.date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.name}"?`)) {
                        onEventDelete(event.id);
                      }
                    }}
                  >
                    מחק
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventManager;