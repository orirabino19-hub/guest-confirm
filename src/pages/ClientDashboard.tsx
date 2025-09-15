import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientAuth } from "@/hooks/useClientAuth";
import { useEvents } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, Users, Calendar, MapPin, Phone, Mail } from "lucide-react";

interface RSVPSubmission {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  men_count: number;
  women_count: number;
  status: string;
  submitted_at: string;
  answers: any;
  guest_id: string | null;
}

export default function ClientDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, loading } = useClientAuth();
  const { events, refetch: refetchEvents } = useEvents();
  const { guests, refetch: refetchGuests } = useGuests();
  
  const [submissions, setSubmissions] = useState<RSVPSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedEvent = events.find(e => e.id === eventId);
  const selectedEventGuests = guests.filter(g => g.event_id === eventId);

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated || !eventId) {
      navigate('/client-login');
      return;
    }
    
    refetchEvents();
    refetchGuests();
    fetchSubmissions();
  }, [isAuthenticated, eventId, loading]);

  const fetchSubmissions = async () => {
    if (!eventId) return;
    
    try {
      setSubmissionsLoading(true);
      const { data, error } = await supabase
        .from('rsvp_submissions')
        .select('*')
        .eq('event_id', eventId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      setError('שגיאה בטעינת נתוני האישורים');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/client-login');
  };

  if (loading || !selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate statistics
  const registeredGuests = selectedEventGuests.length;
  const openLinkSubmissions = submissions.filter(s => !s.guest_id).length;
  const guestLinkSubmissions = submissions.filter(s => s.guest_id).length;
  const pendingCount = Math.max(0, registeredGuests - guestLinkSubmissions);
  const totalConfirmedGuests = submissions.reduce((sum, s) => sum + (s.men_count + s.women_count), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{selectedEvent.title}</h1>
                <p className="text-sm text-muted-foreground">שלום, {username}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Event Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">תאריך</p>
                  <p className="font-medium">
                    {selectedEvent.event_date 
                      ? new Date(selectedEvent.event_date).toLocaleDateString('he-IL')
                      : 'לא נקבע'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">מיקום</p>
                  <p className="font-medium">{selectedEvent.location || 'לא נקבע'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ מאושרים</p>
                  <p className="font-medium">{totalConfirmedGuests} אורחים</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <div className="text-2xl font-bold text-green-500">{totalConfirmedGuests}</div>
                <p className="text-sm text-muted-foreground">סה"כ מוזמנים</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="submissions">אישורי הגעה</TabsTrigger>
            <TabsTrigger value="guests">רשימת אורחים</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle style={{ direction: 'rtl' }}>אישורי הגעה ({submissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-8">טוען אישורי הגעה...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    עדיין לא התקבלו אישורי הגעה
                  </div>
                ) : (
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge variant={submission.guest_id ? 'default' : 'secondary'}>
                              {submission.guest_id ? 'מרשימה' : 'פתוח'}
                            </Badge>
                          </div>
                          <div className="flex-1 text-right mr-4">
                            <p className="font-medium">
                              {submission.full_name || `${submission.first_name || ''} ${submission.last_name || ''}`.trim() || 'ללא שם'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {submission.men_count + submission.women_count} אורחים
                              {submission.men_count > 0 && ` (${submission.men_count} גברים)`}
                              {submission.women_count > 0 && ` (${submission.women_count} נשים)`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.submitted_at).toLocaleDateString('he-IL')} {new Date(submission.submitted_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <CardTitle style={{ direction: 'rtl' }}>רשימת אורחים ({selectedEventGuests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEventGuests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    עדיין לא נוספו אורחים לרשימה
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEventGuests.map((guest) => {
                      const hasSubmitted = submissions.some(s => s.guest_id === guest.id);
                      return (
                        <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {guest.full_name || `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || 'ללא שם'}
                            </p>
                            {guest.phone && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Phone className="w-3 h-3 ml-1" />
                                {guest.phone}
                              </div>
                            )}
                            {guest.email && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Mail className="w-3 h-3 ml-1" />
                                {guest.email}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {guest.men_count + guest.women_count} אורחים
                            </p>
                          </div>
                          <div>
                            <Badge variant={hasSubmitted ? 'default' : 'secondary'}>
                              {hasSubmitted ? 'אישר הגעה' : 'ממתין'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}