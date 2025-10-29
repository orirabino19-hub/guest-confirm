import { useState, useEffect } from "react";
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
import ShortLinkManager from "@/components/ShortLinkManager";
import { URLShortener } from "@/components/URLShortener";
import GuestManager from "@/components/GuestManager";
import EventLanguageSettings from "@/components/EventLanguageSettings";
import OpenRSVPCustomFields from "@/components/OpenRSVPCustomFields";
import { ClientAuthManager } from "@/components/ClientAuthManager";
import { useEvents } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { useRSVP } from "@/hooks/useRSVP";
import { useCustomFields } from "@/hooks/useCustomFields";
import RSVPSubmissionsList from "@/components/RSVPSubmissionsList";
import AuthSettings from "@/components/AuthSettings";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { guests, loading: guestsLoading, createGuest, deleteGuest } = useGuests();
  const { submissions, deleteSubmission, updateSubmission } = useRSVP(); // טוען את כל הsubmissions
  
  // Load custom fields from both link types and merge them for display
  const [allCustomFields, setAllCustomFields] = useState<any[]>([]);
  
  useEffect(() => {
    const loadAllCustomFields = async () => {
      if (!selectedEventId) {
        setAllCustomFields([]);
        return;
      }

      try {
        console.log('🔍 Loading custom fields for event:', selectedEventId);
        
        const { data: openFields } = await supabase
          .from('custom_fields_config')
          .select('*')
          .eq('event_id', selectedEventId)
          .eq('link_type', 'open')
          .eq('is_active', true)
          .order('order_index');

        const { data: personalFields } = await supabase
          .from('custom_fields_config')
          .select('*')
          .eq('event_id', selectedEventId)
          .eq('link_type', 'personal')
          .eq('is_active', true)
          .order('order_index');

        console.log('🔍 Loaded open fields:', openFields);
        console.log('🔍 Loaded personal fields:', personalFields);

        // Merge fields and reconstruct display locations
        const fieldsMap = new Map();
        
        // Add open fields
        openFields?.forEach(field => {
          const existing = fieldsMap.get(field.key) || {
            id: field.key,
            type: field.field_type === 'number' ? 
              (field.key.includes('men') ? 'menCounter' : field.key.includes('women') ? 'womenCounter' : 'text') 
              : field.field_type,
            label: field.label,
            labelEn: field.label,
            labels: field.labels || {},
            required: field.required,
            options: field.options,
            displayLocations: {
              regularInvitation: false,
              openLink: false,
              personalLink: false
            }
          };
          existing.displayLocations.openLink = true;
          fieldsMap.set(field.key, existing);
        });

        // Add personal fields
        personalFields?.forEach(field => {
          const existing = fieldsMap.get(field.key) || {
            id: field.key,
            type: field.field_type === 'number' ? 
              (field.key.includes('men') ? 'menCounter' : field.key.includes('women') ? 'womenCounter' : 'text') 
              : field.field_type,
            label: field.label,
            labelEn: field.label,
            labels: field.labels || {},
            required: field.required,
            options: field.options,
            displayLocations: {
              regularInvitation: false,
              openLink: false,
              personalLink: false
            }
          };
          existing.displayLocations.personalLink = true;
          fieldsMap.set(field.key, existing);
        });

        setAllCustomFields(Array.from(fieldsMap.values()));
        console.log('🔍 Final merged custom fields:', Array.from(fieldsMap.values()));
      } catch (error) {
        console.error('Error loading custom fields:', error);
      }
    };

    loadAllCustomFields();
  }, [selectedEventId]);
  
  // Enhanced authentication with session expiry
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user has valid session (24 hours)
    const sessionData = localStorage.getItem('adminSession');
    if (sessionData) {
      try {
        const { timestamp } = JSON.parse(sessionData);
        const now = new Date().getTime();
        const sessionAge = now - timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        return sessionAge < twentyFourHours;
      } catch {
        localStorage.removeItem('adminSession');
        return false;
      }
    }
    return false;
  });
  const { toast } = useToast();
  
  // Available languages for the system
  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);

  // Load languages from database on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('system_languages')
          .select('*')
          .order('name');

        if (error) throw error;

        if (data && data.length > 0) {
          const languages: LanguageConfig[] = data.map(lang => ({
            code: lang.code,
            name: lang.name,
            nativeName: lang.native_name,
            flag: lang.flag || '',
            rtl: lang.rtl
          }));
          setAvailableLanguages(languages);
        } else {
          // Fallback to default languages if none in database
          setAvailableLanguages([
            { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
            { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false }
          ]);
        }
      } catch (error) {
        console.error('Error loading languages:', error);
        // Fallback to default languages on error
        setAvailableLanguages([
          { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
          { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false }
        ]);
      }
    };

    if (isAuthenticated) {
      loadLanguages();
    }
  }, [isAuthenticated]);

  // Check session expiry periodically
  useEffect(() => {
    const checkSessionExpiry = () => {
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData && isAuthenticated) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = new Date().getTime();
          const sessionAge = now - timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (sessionAge >= twentyFourHours) {
            setIsAuthenticated(false);
            localStorage.removeItem('adminSession');
            toast({
              title: "⏰ פג תוקף הסשן",
              description: "אנא התחבר שוב",
              variant: "destructive"
            });
          }
        } catch {
          setIsAuthenticated(false);
          localStorage.removeItem('adminSession');
        }
      }
    };

    // Check immediately and then every 5 minutes
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, toast]);

  // Enhanced authentication - will be replaced with Supabase auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsername = localStorage.getItem('adminUsername') || 'admin';
    const storedPassword = localStorage.getItem('adminPassword') || '123456';
    
    if (username === storedUsername && password === storedPassword) {
      setIsAuthenticated(true);
      
      // Create 24-hour session
      const sessionData = {
        timestamp: new Date().getTime(),
        username: username
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      
      toast({
        title: "✅ התחברות בהצלחה",
        description: "ברוכים הבאים למערכת הניהול (בתוקף ל-24 שעות)"
      });
    } else {
      toast({
        title: "❌ שגיאת התחברות",
        description: "שם משתמש או סיסמא שגויים",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminSession');
    toast({
      title: "👋 התנתקת בהצלחה",
      description: "להתראות!"
    });
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
          first_name: (guestData.fullName || guestData.full_name || '').split(' ')[0] || '',
          last_name: (guestData.fullName || guestData.full_name || '').split(' ').slice(1).join(' ') || '',
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
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    try {
      await createGuest({
        event_id: guestData.eventId,
        first_name: guestData.firstName,
        last_name: guestData.lastName,
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

  const handleCustomFieldsUpdate = async (fields: any[]) => {
    try {
      if (!selectedEventId) return;
      
      console.log('🔍 Custom Fields Update - Input fields:', fields);
      
      // Create separate arrays for different link types based on displayLocations
      const openLinkFields = fields
        .filter(field => field.displayLocations?.openLink)
        .map((field, index) => ({
          key: field.id,
          label: field.label,
          labels: field.labels || {},
          field_type: field.type === 'menCounter' || field.type === 'womenCounter' ? 'number' : field.type,
          required: field.required,
          options: field.options,
          order_index: index
        }));

      const personalLinkFields = fields
        .filter(field => field.displayLocations?.personalLink)
        .map((field, index) => ({
          key: field.id,
          label: field.label,
          labels: field.labels || {},
          field_type: field.type === 'menCounter' || field.type === 'womenCounter' ? 'number' : field.type,
          required: field.required,
          options: field.options,
          order_index: index
        }));

      console.log('🔍 Open link fields to save:', openLinkFields);
      console.log('🔍 Personal link fields to save:', personalLinkFields);

      // Save fields for open links
      if (openLinkFields.length > 0) {
        // First deactivate existing open link fields
        await supabase
          .from('custom_fields_config')
          .update({ is_active: false })
          .eq('event_id', selectedEventId)
          .eq('link_type', 'open');

        // Insert new open link fields
        const { error: openError } = await supabase
          .from('custom_fields_config')
          .upsert(
            openLinkFields.map(field => ({
              ...field,
              event_id: selectedEventId,
              link_type: 'open' as const,
              is_active: true
            })),
            { onConflict: 'event_id, link_type, key' }
          );

        if (openError) throw openError;
      } else {
        // Deactivate all open link fields if none selected
        await supabase
          .from('custom_fields_config')
          .update({ is_active: false })
          .eq('event_id', selectedEventId)
          .eq('link_type', 'open');
      }

      // Save fields for personal links
      if (personalLinkFields.length > 0) {
        // First deactivate existing personal link fields
        await supabase
          .from('custom_fields_config')
          .update({ is_active: false })
          .eq('event_id', selectedEventId)
          .eq('link_type', 'personal');

        // Insert new personal link fields
        const { error: personalError } = await supabase
          .from('custom_fields_config')
          .upsert(
            personalLinkFields.map(field => ({
              ...field,
              event_id: selectedEventId,
              link_type: 'personal' as const,
              is_active: true
            })),
            { onConflict: 'event_id, link_type, key' }
          );

        if (personalError) throw personalError;
      } else {
        // Deactivate all personal link fields if none selected
        await supabase
          .from('custom_fields_config')
          .update({ is_active: false })
          .eq('event_id', selectedEventId)
          .eq('link_type', 'personal');
      }

      // Refresh the custom fields
      // We'll need to merge fields from both link types for display
      const loadAllCustomFields = async () => {
        if (!selectedEventId) return;

        try {
          console.log('🔍 Loading custom fields for event:', selectedEventId);
          
          const { data: openFields } = await supabase
            .from('custom_fields_config')
            .select('*')
            .eq('event_id', selectedEventId)
            .eq('link_type', 'open')
            .eq('is_active', true)
            .order('order_index');

          const { data: personalFields } = await supabase
            .from('custom_fields_config')
            .select('*')
            .eq('event_id', selectedEventId)
            .eq('link_type', 'personal')
            .eq('is_active', true)
            .order('order_index');

          console.log('🔍 Loaded open fields:', openFields);
          console.log('🔍 Loaded personal fields:', personalFields);

          // Merge fields and reconstruct display locations
          const fieldsMap = new Map();
          
          // Add open fields
          openFields?.forEach(field => {
            const existing = fieldsMap.get(field.key) || {
              id: field.key,
              type: field.field_type === 'number' ? 
                (field.key.includes('men') ? 'menCounter' : field.key.includes('women') ? 'womenCounter' : 'text') 
                : field.field_type,
              label: field.label,
              labelEn: field.label,
              labels: (field.labels as Record<string, string>) || {},
              required: field.required,
              options: field.options,
              displayLocations: {
                regularInvitation: false,
                openLink: false,
                personalLink: false
              }
            };
            existing.displayLocations.openLink = true;
            fieldsMap.set(field.key, existing);
          });

          // Add personal fields
          personalFields?.forEach(field => {
            const existing = fieldsMap.get(field.key) || {
              id: field.key,
              type: field.field_type === 'number' ? 
                (field.key.includes('men') ? 'menCounter' : field.key.includes('women') ? 'womenCounter' : 'text') 
                : field.field_type,
              label: field.label,
              labelEn: field.label,
              labels: (field.labels as Record<string, string>) || {},
              required: field.required,
              options: field.options,
              displayLocations: {
                regularInvitation: false,
                openLink: false,
                personalLink: false
              }
            };
            existing.displayLocations.personalLink = true;
            fieldsMap.set(field.key, existing);
          });

          setAllCustomFields(Array.from(fieldsMap.values()));
          console.log('🔍 Final merged custom fields:', Array.from(fieldsMap.values()));
        } catch (error) {
          console.error('Error loading custom fields:', error);
        }
      };

      await loadAllCustomFields();

      toast({
        title: "✅ שדות מותאמים אישית עודכנו",
        description: "השדות נשמרו בהצלחה"
      });
    } catch (error: any) {
      toast({
        title: "❌ שגיאה בשמירת שדות",
        description: error.message,
        variant: "destructive"
      });
    }
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
  
  console.log('Selected Event ID:', selectedEventId);
  console.log('All submissions:', submissions);
  console.log('Selected Event ID type:', typeof selectedEventId);
  console.log('Sample submission event_id type:', submissions.length > 0 ? typeof submissions[0].event_id : 'none');
  console.log('Filtered submissions for event:', selectedEventSubmissions);
  
  const confirmedCount = selectedEventSubmissions.length;
  const registeredGuests = selectedEventGuests.length;
  const openLinkSubmissions = selectedEventSubmissions.filter(s => !s.guest_id).length;
  const guestLinkSubmissions = selectedEventSubmissions.filter(s => s.guest_id).length;
  const pendingCount = Math.max(0, registeredGuests - guestLinkSubmissions);
  const totalConfirmedGuests = selectedEventSubmissions
    .reduce((sum, s) => sum + (s.men_count + s.women_count), 0);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedEventSlug = selectedEvent ? 'event' : null; // Default slug until we add proper slug field

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
                onClick={handleLogout}
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
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />

        {/* Stats Cards */}
        {selectedEventId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{guestLinkSubmissions}</div>
                  <p className="text-sm text-muted-foreground">אישרו מרשימה</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{openLinkSubmissions}</div>
                  <p className="text-sm text-muted-foreground">אישרו בקישור פתוח</p>
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
          <TabsList className="grid w-full grid-cols-5 md:grid-cols-9 gap-1 h-auto min-h-[2.5rem]">
            <TabsTrigger value="guests" className="text-xs md:text-sm px-2 py-2 whitespace-normal">אורחים</TabsTrigger>
            <TabsTrigger value="import" className="text-xs md:text-sm px-2 py-2 whitespace-normal">יבוא</TabsTrigger>
            <TabsTrigger value="links" className="text-xs md:text-sm px-2 py-2 whitespace-normal">קישורים</TabsTrigger>
            <TabsTrigger value="client-auth" className="text-xs md:text-sm px-2 py-2 whitespace-normal">גישת לקוח</TabsTrigger>
            <TabsTrigger value="language" className="text-xs md:text-sm px-2 py-2 whitespace-normal">שפה וטקסטים</TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs md:text-sm px-2 py-2 whitespace-normal">הזמנות</TabsTrigger>
            <TabsTrigger value="colors" className="text-xs md:text-sm px-2 py-2 whitespace-normal">צבעים</TabsTrigger>
            <TabsTrigger value="custom-fields" className="text-xs md:text-sm px-2 py-2 whitespace-normal">שדות מותאמים</TabsTrigger>
            <TabsTrigger value="export" className="text-xs md:text-sm px-2 py-2 whitespace-normal">ייצוא</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuestManager
              selectedEventId={selectedEventId}
              selectedEventSlug={selectedEventSlug}
              guests={selectedEventGuests}
              onGuestAdd={handleGuestAdd}
              onGuestDelete={handleGuestDelete}
            />
            <GuestList
              guests={selectedEventGuests}
              loading={guestsLoading}
              selectedEventId={selectedEventId}
              selectedEventSlug={selectedEventSlug}
            />
            </div>
            
            {/* RSVP Submissions */}
            {selectedEventId && (
              <RSVPSubmissionsList 
                submissions={selectedEventSubmissions}
                loading={false}
                onDeleteSubmission={deleteSubmission}
                onUpdateSubmission={updateSubmission}
              />
            )}
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
              selectedEventSlug={selectedEventSlug}
            />
          </TabsContent>

          <TabsContent value="client-auth" className="space-y-4">
            <ClientAuthManager
              selectedEvent={selectedEvent}
              onEventUpdate={() => {
                // Refresh events data
                window.location.reload();
              }}
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
              customFields={allCustomFields}
              onCustomFieldsUpdate={handleCustomFieldsUpdate}
            />
          </TabsContent>


          <TabsContent value="export" className="space-y-4">
            <ExcelExport
              selectedEventId={selectedEventId}
              selectedEventSlug={selectedEventSlug}
              eventName={selectedEvent?.title}
              guests={selectedEventGuests}
              submissions={selectedEventId ? submissions.filter(s => s.event_id === selectedEventId) : []}
            />
          </TabsContent>
        </Tabs>
        
        {/* URL Shortener - Independent System */}
        <URLShortener />
        
        {/* Short Links Management Section */}
        <ShortLinkManager selectedEventId={selectedEventId} />
        
        {/* Language System Management Section */}
        <LanguageSystemManager onLanguagesChange={setAvailableLanguages} />
        
        {/* Authentication Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 פרטי התחברות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuthSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;