import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isRSVPOpen } from "@/utils/rsvpStatus";

// Language configuration interface
interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn: string;
  labels?: Record<string, string>; // Additional language translations
  options?: string[];
  required: boolean;
  displayLocations?: {
    regularInvitation?: boolean; // דף הזמנה רגיל
    openLink?: boolean;          // קישור פתוח
    personalLink?: boolean;      // קישור עם שם
  };
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  theme?: any;
  created_at: string;
  updated_at: string;
  languages?: string[];
  customFields?: CustomField[];
  accordion_form_enabled?: boolean;
  modern_style_enabled?: boolean;
  rsvp_enabled?: boolean;
  rsvp_open_date?: string | null;
  rsvp_close_date?: string | null;
}

interface EventManagerProps {
  events: Event[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  onEventCreate: (event: {
    title: string;
    description?: string;
    event_date?: string;
    languages?: string[];
  }) => void;
  onEventUpdate: (eventId: string, event: {
    title: string;
    description?: string;
    event_date?: string;
    location?: string;
    accordion_form_enabled?: boolean;
    modern_style_enabled?: boolean;
    rsvp_enabled?: boolean;
    rsvp_open_date?: string | null;
    rsvp_close_date?: string | null;
  }) => void;
  onEventDelete: (eventId: string) => void;
}

const EventManager = ({ 
  events, 
  selectedEventId, 
  onEventSelect, 
  onEventCreate,
  onEventUpdate,
  onEventDelete 
}: EventManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    invitationImage: "",
    languages: ["he"], // Default to Hebrew
    accordion_form_enabled: false,
    modern_style_enabled: false,
    rsvp_enabled: true,
    rsvp_open_date: "" as string,
    rsvp_close_date: "" as string,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Available languages - loaded from database
  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);

  // Load languages from database
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('system_languages')
          .select('*')
          .order('code');

        if (error) throw error;

        const loadedLanguages: LanguageConfig[] = (data || []).map(lang => ({
          code: lang.code,
          name: lang.name,
          nativeName: lang.native_name,
          flag: lang.flag || '🌐',
          rtl: lang.rtl
        }));

        setAvailableLanguages(loadedLanguages);
      } catch (err: any) {
        console.error('Error loading languages:', err);
        toast({
          title: "❌ שגיאה בטעינת שפות",
          description: err.message,
          variant: "destructive"
        });
      }
    };

    loadLanguages();
  }, [toast]);

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date?.split('T')[0] || "",
      location: event.location || "",
      invitationImage: "",
      languages: event.languages || ["he"],
      accordion_form_enabled: event.accordion_form_enabled || false,
      modern_style_enabled: event.modern_style_enabled || false,
      rsvp_enabled: event.rsvp_enabled !== false,
      rsvp_open_date: event.rsvp_open_date ? new Date(event.rsvp_open_date).toISOString().slice(0, 16) : "",
      rsvp_close_date: event.rsvp_close_date ? new Date(event.rsvp_close_date).toISOString().slice(0, 16) : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !newEvent.title || !newEvent.event_date) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    onEventUpdate(editingEvent.id, {
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.event_date,
      location: newEvent.location,
      accordion_form_enabled: newEvent.accordion_form_enabled,
      modern_style_enabled: newEvent.modern_style_enabled,
      rsvp_enabled: newEvent.rsvp_enabled,
      rsvp_open_date: newEvent.rsvp_open_date || null,
      rsvp_close_date: newEvent.rsvp_close_date || null,
    });
    
    setNewEvent({ title: "", description: "", event_date: "", location: "", invitationImage: "", languages: ["he"], accordion_form_enabled: false, modern_style_enabled: false, rsvp_enabled: true, rsvp_open_date: "", rsvp_close_date: "" });
    setEditingEvent(null);
    setIsEditOpen(false);
    
    toast({
      title: "✅ אירוע עודכן בהצלחה",
      description: `האירוע "${newEvent.title}" עודכן`
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date || newEvent.languages.length === 0) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות הנדרשים ולבחור לפחות שפה אחת",
        variant: "destructive"
      });
      return;
    }

    onEventCreate({
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.event_date,
      languages: newEvent.languages
    });
    
    setNewEvent({ title: "", description: "", event_date: "", location: "", invitationImage: "", languages: ["he"], accordion_form_enabled: false, modern_style_enabled: false, rsvp_enabled: true, rsvp_open_date: "", rsvp_close_date: "" });
    setSelectedFile(null);
    setIsCreateOpen(false);
    
    toast({
      title: "✅ אירוע נוצר בהצלחה",
      description: `האירוע "${newEvent.title}" נוסף למערכת`
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
                     value={newEvent.title}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
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
                     value={newEvent.event_date}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
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
                      setNewEvent({ title: "", description: "", event_date: "", location: "", invitationImage: "", languages: ["he"], accordion_form_enabled: false, modern_style_enabled: false, rsvp_enabled: true, rsvp_open_date: "", rsvp_close_date: "" });
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Event Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>ערוך אירוע</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">שם האירוע *</Label>
                  <Input
                    id="edit-title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="לדוגמא: חתונת יוסי ושרה"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">תיאור האירוע</Label>
                  <Textarea
                    id="edit-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="פרטים נוספים על האירוע..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-event-date">תאריך האירוע *</Label>
                  <Input
                    id="edit-event-date"
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                    required
                  />
                </div>
                 <div>
                   <Label htmlFor="edit-location">מיקום האירוע</Label>
                   <Input
                     id="edit-location"
                     value={newEvent.location}
                     onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                     placeholder="כתובת מדויקת או שם המקום"
                   />
                 </div>
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       id="accordion-form"
                       checked={newEvent.accordion_form_enabled || false}
                       onChange={(e) => setNewEvent(prev => ({ 
                         ...prev, 
                         accordion_form_enabled: e.target.checked 
                       }))}
                       className="rounded"
                     />
                     <label htmlFor="accordion-form" className="text-sm font-medium cursor-pointer">
                       טופס בסגנון אקורדיון
                     </label>
                   </div>
                   <p className="text-xs text-muted-foreground mr-6">
                     הגולש יבחר מגדר (גבר/אישה) ואז ימלא פרטים אישיים. מתאים להדפסת כרטיסי הושבה אישיים.
                   </p>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       id="modern-style"
                       checked={newEvent.modern_style_enabled || false}
                       onChange={(e) => setNewEvent(prev => ({ 
                         ...prev, 
                         modern_style_enabled: e.target.checked 
                       }))}
                       className="rounded"
                     />
                     <label htmlFor="modern-style" className="text-sm font-medium cursor-pointer">
                       הפעלת עיצוב מודרני
                     </label>
                   </div>
                   <p className="text-xs text-muted-foreground mr-6">
                     עיצוב מודרני עם גרדיאנטים, אנימציות ו-glass-morphism effects
                   </p>
                  </div>

                 {/* RSVP Scheduling Section */}
                 <div className="space-y-3 border-t pt-4">
                   <h4 className="text-sm font-semibold">⏰ תזמון אישורי הגעה</h4>
                   
                   <div className="flex items-center justify-between">
                     <Label htmlFor="rsvp-enabled" className="text-sm cursor-pointer">
                       אישורי הגעה פתוחים
                     </Label>
                     <Switch
                       id="rsvp-enabled"
                       checked={newEvent.rsvp_enabled}
                       onCheckedChange={(checked) => setNewEvent(prev => ({ 
                         ...prev, 
                         rsvp_enabled: checked 
                       }))}
                     />
                   </div>

                   {newEvent.rsvp_enabled && (
                     <>
                       <div>
                         <Label htmlFor="rsvp-open-date" className="text-sm">תאריך פתיחה (אופציונלי)</Label>
                         <Input
                           id="rsvp-open-date"
                           type="datetime-local"
                           value={newEvent.rsvp_open_date}
                           onChange={(e) => setNewEvent(prev => ({ ...prev, rsvp_open_date: e.target.value }))}
                         />
                         <p className="text-xs text-muted-foreground mt-1">אם ריק - פתוח מיד</p>
                       </div>
                       <div>
                         <Label htmlFor="rsvp-close-date" className="text-sm">תאריך סגירה (אופציונלי)</Label>
                         <Input
                           id="rsvp-close-date"
                           type="datetime-local"
                           value={newEvent.rsvp_close_date}
                           onChange={(e) => setNewEvent(prev => ({ ...prev, rsvp_close_date: e.target.value }))}
                         />
                         <p className="text-xs text-muted-foreground mt-1">אם ריק - פתוח ללא הגבלה</p>
                       </div>
                     </>
                   )}

                   {/* Status badge */}
                   {(() => {
                     const status = isRSVPOpen({
                       rsvp_enabled: newEvent.rsvp_enabled,
                       rsvp_open_date: newEvent.rsvp_open_date || null,
                       rsvp_close_date: newEvent.rsvp_close_date || null,
                     });
                     return (
                       <div className="flex items-center gap-2">
                         <span className="text-xs">סטטוס:</span>
                         <Badge variant={status.open ? "default" : "destructive"}>
                           {status.open ? "🟢 פתוח" : status.reason === 'not_yet_open' ? "🟡 ממתין לפתיחה" : status.reason === 'closed' ? "🔴 נסגר" : "🔴 כבוי"}
                         </Badge>
                       </div>
                     );
                   })()}
                 </div>

                 <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    עדכן אירוע
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                     onClick={() => {
                       setIsEditOpen(false);
                       setEditingEvent(null);
                       setNewEvent({ title: "", description: "", event_date: "", location: "", invitationImage: "", languages: ["he"], accordion_form_enabled: false, modern_style_enabled: false, rsvp_enabled: true, rsvp_open_date: "", rsvp_close_date: "" });
                     }}
                    className="flex-1"
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
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex flex-wrap gap-1">
                          {event.languages?.map(langCode => {
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
                       📅 {event.event_date ? new Date(event.event_date).toLocaleDateString('he-IL') : 'לא נקבע תאריך'}
                     </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ערוך
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.title}"?`)) {
                          onEventDelete(event.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      מחק
                    </Button>
                  </div>
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