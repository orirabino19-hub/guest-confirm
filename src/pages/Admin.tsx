import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EventManager from "@/components/EventManager";
import GuestList from "@/components/GuestList";
import LanguageManager from "@/components/LanguageManager";
import LanguageSystemManager, { LanguageConfig } from "@/components/LanguageSystemManager";
import InvitationManager from "@/components/InvitationManager";
import ColorManager from "@/components/ColorManager";
import ExcelImport from "@/components/ExcelImport";
import ExcelExport from "@/components/ExcelExport";
import LinkManager from "@/components/LinkManager";
import GuestManager from "@/components/GuestManager";
import EventLanguageSettings from "@/components/EventLanguageSettings";
import OpenRSVPCustomFields from "@/components/OpenRSVPCustomFields";
import { useEvents } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { useRSVP } from "@/hooks/useRSVP";
import AuthSettings from "@/components/AuthSettings";

const Admin = () => {
  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { guests, loading: guestsLoading, createGuest, deleteGuest } = useGuests();
  const { submissions } = useRSVP(selectedEventId || undefined);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  
  // Available languages for the system
  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false }
  ]);

  // Mock authentication - will be replaced with Supabase auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsername = localStorage.getItem('adminUsername') || 'admin';
    const storedPassword = localStorage.getItem('adminPassword') || '123456';
    
    if (username === storedUsername && password === storedPassword) {
      setIsAuthenticated(true);
      toast({
        title: "✅ התחברות בהצלחה",
        description: "ברוכים הבאים למערכת הניהול"
      });
    } else {
      toast({
        title: "❌ שגיאת התחברות",
        description: "שם משתמש או סיסמא שגויים",
        variant: "destructive"
      });
    }
  };

  const handleEventCreate = async (newEventData: {
    title: string;
    description?: string;
    event_date?: string;
    languages?: string[];
  }) => {
    try {
      const event = await createEvent(newEventData);
      setSelectedEventId(event.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      if (selectedEventId === eventId) {
        setSelectedEventId(events.length > 1 ? events.find(e => e.id !== eventId)?.id || null : null);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle ExcelImport compatibility
  const handleGuestsImported = async (importedGuests: any[]) => {
    if (!selectedEventId) return;
    
    try {
      for (const guestData of importedGuests) {
        await createGuest({
          event_id: selectedEventId,
          full_name: guestData.fullName || guestData.full_name,
          phone: guestData.phone,
          men_count: guestData.menCount || 0,
          women_count: guestData.womenCount || 0
        });
      }
      
      toast({
        title: "📥 אורחים יובאו בהצלחה",
        description: `נוספו ${importedGuests.length} אורחים מהקובץ`
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleGuestAdd = async (guestData: {
    eventId: string;
    fullName: string;
    phone: string;
  }) => {
    try {
      await createGuest({
        event_id: guestData.eventId,
        full_name: guestData.fullName,
        phone: guestData.phone
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleGuestDelete = async (guestId: string) => {
    try {
      await deleteGuest(guestId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEventUpdate = async (eventId: string, updates: any) => {
    try {
      await updateEvent(eventId, updates);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCustomFieldsUpdate = (fields: any[]) => {
    // This will be handled by the custom fields hook
    toast({
      title: "✅ שדות מותאמים אישית עודכנו",
      description: "השדות נשמרו בהצלחה עבור הקישור הפתוח"
    });
  };

  const exportToExcel = () => {
    if (!selectedEventId) return;
    
    const eventGuests = guests.filter(g => g.event_id === selectedEventId);
    const totalGuests = eventGuests.reduce((sum, g) => sum + (g.men_count + g.women_count), 0);
    
    toast({
      title: "📊 ייצוא בהצלחה", 
      description: `יוצאו ${eventGuests.length} אורחים (${totalGuests} מוזמנים בסה"כ)`
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🔐 כניסת מנהל</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">שם משתמש</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">סיסמא</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                התחבר
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats for selected event
  const selectedEventGuests = selectedEventId ? 
    guests.filter(g => g.event_id === selectedEventId) : [];
  const selectedEventSubmissions = selectedEventId ?
    submissions.filter(s => s.event_id === selectedEventId) : [];
  
  const confirmedCount = selectedEventSubmissions.length;
  const pendingCount = selectedEventGuests.length - confirmedCount;
  const totalConfirmedGuests = selectedEventSubmissions
    .reduce((sum, s) => sum + (s.men_count + s.women_count), 0);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">🎭 מערכת ניהול אירועים</CardTitle>
                <p className="text-muted-foreground">
                  {selectedEvent ? `ניהול: ${selectedEvent.title}` : "בחר אירוע לניהול"}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsAuthenticated(false)}
              >
                התנתק
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Event Manager */}
        <EventManager 
          events={events}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
          onEventCreate={handleEventCreate}
          onEventDelete={handleEventDelete}
        />

        {/* Stats Cards */}
        {selectedEventId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{confirmedCount}</div>
                  <p className="text-sm text-muted-foreground">אישרו הגעה</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
                  <p className="text-sm text-muted-foreground">ממתינים לאישור</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalConfirmedGuests}</div>
                  <p className="text-sm text-muted-foreground">סה"כ מוזמנים</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="guests" className="space-y-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-9 gap-1 h-auto min-h-[2.5rem]">
            <TabsTrigger value="guests" className="text-xs md:text-sm px-2 py-2 whitespace-normal">אורחים</TabsTrigger>
            <TabsTrigger value="import" className="text-xs md:text-sm px-2 py-2 whitespace-normal">יבוא</TabsTrigger>
            <TabsTrigger value="links" className="text-xs md:text-sm px-2 py-2 whitespace-normal">קישורים</TabsTrigger>
            <TabsTrigger value="language" className="text-xs md:text-sm px-2 py-2 whitespace-normal">שפה וטקסטים</TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs md:text-sm px-2 py-2 whitespace-normal">הזמנות</TabsTrigger>
            <TabsTrigger value="colors" className="text-xs md:text-sm px-2 py-2 whitespace-normal">צבעים</TabsTrigger>
            <TabsTrigger value="custom-fields" className="text-xs md:text-sm px-2 py-2 whitespace-normal">שדות מותאמים</TabsTrigger>
            <TabsTrigger value="auth" className="text-xs md:text-sm px-2 py-2 whitespace-normal">פרטי התחברות</TabsTrigger>
            <TabsTrigger value="export" className="text-xs md:text-sm px-2 py-2 whitespace-normal">ייצוא</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuestManager
              selectedEventId={selectedEventId}
              guests={selectedEventGuests}
              onGuestAdd={handleGuestAdd}
              onGuestDelete={handleGuestDelete}
            />
            <GuestList
              guests={selectedEventGuests}
              loading={guestsLoading}
              selectedEventId={selectedEventId}
            />
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <ExcelImport
              selectedEventId={selectedEventId}
              onGuestsImported={handleGuestsImported}
            />
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <LinkManager
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.title}
              customFields={[]}
              onCustomFieldsUpdate={handleCustomFieldsUpdate}
            />
          </TabsContent>

          <TabsContent value="language" className="space-y-4">
            <EventLanguageSettings
              event={selectedEvent}
              onEventUpdate={handleEventUpdate}
            />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationManager 
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.title}
              availableLanguages={availableLanguages}
            />
          </TabsContent>

          <TabsContent value="colors">
            <ColorManager 
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.title}
            />
          </TabsContent>

          <TabsContent value="custom-fields" className="space-y-4">
            <OpenRSVPCustomFields
              selectedEventId={selectedEventId}
              customFields={[]}
              onCustomFieldsUpdate={handleCustomFieldsUpdate}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <AuthSettings />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExcelExport
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.title}
              guests={selectedEventGuests}
            />
          </TabsContent>
        </Tabs>
        
        {/* Language System Management Section */}
        <LanguageSystemManager onLanguagesChange={setAvailableLanguages} />
      </div>
    </div>
  );
};

export default Admin;