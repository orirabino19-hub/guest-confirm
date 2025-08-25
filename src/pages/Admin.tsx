import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EventManager, { Event } from "@/components/EventManager";
import GuestList, { Guest } from "@/components/GuestList";
import LanguageManager from "@/components/LanguageManager";
import InvitationManager from "@/components/InvitationManager";
import ColorManager from "@/components/ColorManager";
import ExcelImport from "@/components/ExcelImport";
import ExcelExport from "@/components/ExcelExport";
import LinkManager from "@/components/LinkManager";
import GuestManager from "@/components/GuestManager";

const Admin = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      name: "החתונה של שייקי ומיכל",
      description: "חתונה מיוחדת בגן אירועים",
      date: "2024-06-15",
      createdAt: new Date().toISOString(),
      language: 'he'
    },
    {
      id: "2", 
      name: "יום הולדת 30 לדני",
      description: "מסיבת יום הולדת במועדון",
      date: "2024-07-20",
      createdAt: new Date().toISOString(),
      language: 'he'
    }
  ]);
  
  const [guests, setGuests] = useState<Guest[]>([
    {
      id: "1",
      eventId: "1",
      fullName: "משה כהן",
      phone: "0501234567",
      menCount: 2,
      womenCount: 3,
      totalGuests: 5,
      confirmedAt: new Date().toISOString(),
      status: 'confirmed'
    },
    {
      id: "2", 
      eventId: "1",
      fullName: "שרה לוי",
      phone: "0527654321",
      status: 'pending'
    },
    {
      id: "3",
      eventId: "2",
      fullName: "דוד ישראלי", 
      phone: "0543216789",
      menCount: 1,
      womenCount: 2,
      totalGuests: 3,
      confirmedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'confirmed'
    },
    {
      id: "4",
      eventId: "2",
      fullName: "רחל אברהם",
      phone: "0556789123", 
      status: 'pending'
    }
  ]);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>("1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock authentication - will be replaced with Supabase auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "123456") {
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

  const handleEventCreate = (newEvent: Omit<Event, 'id' | 'createdAt'>) => {
    const event: Event = {
      ...newEvent,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [...prev, event]);
    setSelectedEventId(event.id);
    toast({
      title: "✅ אירוע נוצר בהצלחה",
      description: `האירוע "${newEvent.name}" נוצר בהצלחה`
    });
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setGuests(prev => prev.filter(g => g.eventId !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(events.length > 1 ? events.find(e => e.id !== eventId)?.id || null : null);
    }
    toast({
      title: "✅ אירוע נמחק",
      description: "האירוע וכל המוזמנים שלו נמחקו"
    });
  };

  const handleGuestsImported = (importedGuests: Omit<Guest, 'id'>[]) => {
    setLoading(true);
    
    // Add unique IDs to imported guests
    const guestsWithIds = importedGuests.map(guest => ({
      ...guest,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setGuests(prev => [...prev, ...guestsWithIds]);
    setLoading(false);
    
    toast({
      title: "📥 אורחים יובאו בהצלחה",
      description: `נוספו ${importedGuests.length} אורחים מהקובץ`
    });
  };

  const handleGuestAdd = (guestData: Omit<Guest, 'id'>) => {
    const newGuest: Guest = {
      ...guestData,
      id: Date.now().toString()
    };
    
    setGuests(prev => [...prev, newGuest]);
  };

  const handleGuestDelete = (guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
  };

  const exportToExcel = () => {
    if (!selectedEventId) return;
    
    const eventGuests = guests.filter(g => g.eventId === selectedEventId);
    const confirmedGuests = eventGuests.filter(g => g.status === 'confirmed');
    const totalConfirmed = confirmedGuests.reduce((sum, g) => sum + (g.totalGuests || 0), 0);
    
    toast({
      title: "📊 ייצוא בהצלחה", 
      description: `יוצאו ${confirmedGuests.length} אישורים (${totalConfirmed} מוזמנים בסה"כ)`
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
              <p className="text-xs text-center text-muted-foreground">
                דמו: admin / 123456
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats for selected event
  const selectedEventGuests = selectedEventId ? guests.filter(g => g.eventId === selectedEventId) : [];
  const confirmedCount = selectedEventGuests.filter(g => g.status === 'confirmed').length;
  const pendingCount = selectedEventGuests.filter(g => g.status === 'pending').length;
  const totalConfirmedGuests = selectedEventGuests
    .filter(g => g.status === 'confirmed')
    .reduce((sum, g) => sum + (g.totalGuests || 0), 0);

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
                  {selectedEvent ? `ניהול: ${selectedEvent.name}` : "בחר אירוע לניהול"}
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
        <Tabs defaultValue="guests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto min-h-[2.5rem]">
            <TabsTrigger value="guests" className="text-xs md:text-sm px-2 py-2 whitespace-normal">אורחים</TabsTrigger>
            <TabsTrigger value="import" className="text-xs md:text-sm px-2 py-2 whitespace-normal">יבוא</TabsTrigger>
            <TabsTrigger value="links" className="text-xs md:text-sm px-2 py-2 whitespace-normal">קישורים</TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs md:text-sm px-2 py-2 whitespace-normal">הזמנות</TabsTrigger>
            <TabsTrigger value="colors" className="text-xs md:text-sm px-2 py-2 whitespace-normal">צבעים</TabsTrigger>
            <TabsTrigger value="export" className="text-xs md:text-sm px-2 py-2 whitespace-normal">ייצוא</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GuestManager
                selectedEventId={selectedEventId}
                guests={guests}
                onGuestAdd={handleGuestAdd}
                onGuestDelete={handleGuestDelete}
              />
              <GuestList
                guests={guests}
                loading={loading}
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
              eventName={selectedEvent?.name}
            />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationManager 
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.name}
            />
          </TabsContent>

          <TabsContent value="colors">
            <ColorManager 
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.name}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExcelExport
              selectedEventId={selectedEventId}
              eventName={selectedEvent?.name}
              guests={guests}
            />
          </TabsContent>
        </Tabs>
        
        {/* Language Management Section */}
        <LanguageManager />
      </div>
    </div>
  );
};

export default Admin;