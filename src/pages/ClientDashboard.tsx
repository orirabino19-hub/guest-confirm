import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientAuth } from "@/hooks/useClientAuth";
import { useEvents } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, Users, Calendar, MapPin, Phone, Mail, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import fleishmanPelesLogo from "@/assets/fleishman-peles-logo.png";
import RSVPSubmissionsList from "@/components/RSVPSubmissionsList";

interface RSVPSubmission {
  id: string;
  event_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  men_count: number;
  women_count: number;
  status: string;
  submitted_at: string;
  updated_at: string;
  answers: any;
  guest_id: string | null;
}

export default function ClientDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, loading } = useClientAuth();
  const { events, refetch: refetchEvents } = useEvents();
  const { guests, refetch: refetchGuests } = useGuests();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<RSVPSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch custom fields for both link types
  const { fields: customFieldsOpen } = useCustomFields(eventId, 'open');
  const { fields: customFieldsPersonal } = useCustomFields(eventId, 'personal');

  // Merge custom fields from both types
  const allCustomFields = useMemo(() => {
    const fieldsMap = new Map();
    [...customFieldsOpen, ...customFieldsPersonal].forEach(field => {
      if (!fieldsMap.has(field.key)) {
        fieldsMap.set(field.key, field);
      }
    });
    return Array.from(fieldsMap.values()).sort((a, b) => a.order_index - b.order_index);
  }, [customFieldsOpen, customFieldsPersonal]);

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

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('rsvp_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;
      
      // Refresh submissions list
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      setError('שגיאה במחיקת אישור ההגעה');
    }
  };

  const handleUpdateSubmission = async (submissionId: string, updates: {
    first_name?: string;
    last_name?: string;
    men_count?: number;
    women_count?: number;
  }) => {
    try {
      const { error } = await supabase
        .from('rsvp_submissions')
        .update({
          ...updates,
          full_name: `${updates.first_name || ''} ${updates.last_name || ''}`.trim()
        })
        .eq('id', submissionId);

      if (error) throw error;
      
      // Refresh submissions list
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error updating submission:', error);
      setError('שגיאה בעדכון אישור ההגעה');
    }
  };

  const exportToExcel = () => {
    if (!selectedEvent || submissions.length === 0) {
      toast({
        title: "⚠️ אין נתונים לייצוא",
        description: "לא נמצאו אישורי הגעה לייצוא",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format answer for display
      const formatAnswer = (answer: any): string => {
        if (answer === null || answer === undefined) return '';
        if (typeof answer === 'boolean') return answer ? 'כן' : 'לא';
        if (Array.isArray(answer)) return answer.join(', ');
        return String(answer);
      };

      // Prepare submissions data with custom fields
      const exportData = submissions.map((s, index) => {
        const baseData: any = {
          'מס רשומה': index + 1,
          'שם פרטי': s.first_name || '',
          'שם משפחה': s.last_name || '',
          'סוג קישור': s.guest_id ? 'קישור אישי' : 'קישור פתוח',
          'גברים': s.men_count,
          'נשים': s.women_count,
          'סה"כ': s.men_count + s.women_count,
          'תאריך אישור': new Date(s.submitted_at).toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        // Add custom field answers
        allCustomFields.forEach(field => {
          const answer = s.answers?.[field.key];
          const fieldLabel = field.labels?.['he'] || field.labels?.['en'] || field.labels?.['de'] || field.label || `שדה: ${field.key}`;
          baseData[fieldLabel] = formatAnswer(answer);
        });
        
        return baseData;
      });

      // Create submissions worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 8 },  // מס רשומה
        { wch: 15 }, // שם פרטי
        { wch: 15 }, // שם משפחה
        { wch: 12 }, // סוג קישור
        { wch: 8 },  // גברים
        { wch: 8 },  // נשים
        { wch: 8 },  // סה"כ
        { wch: 18 }, // תאריך אישור
        ...allCustomFields.map(() => ({ wch: 20 })) // custom fields
      ];
      ws['!cols'] = colWidths;

      // Create summary worksheet
      const summaryData = [
        ['שם האירוע', selectedEvent.title],
        ['תאריך הייצוא', new Date().toLocaleString('he-IL')],
        [''],
        ['סה"כ אישורים', submissions.length],
        ['גברים מאושרים', totalMen],
        ['נשים מאושרות', totalWomen],
        ['סה"כ מוזמנים', totalConfirmedGuests],
        [''],
        ['מקישורים אישיים', guestLinkSubmissions],
        ['מקישורים פתוחים', openLinkSubmissions]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');
      XLSX.utils.book_append_sheet(wb, ws, 'אישורי הגעה');

      // Generate filename with event name and date
      const fileName = `${selectedEvent.title}_אישורי_הגעה_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, fileName);

      toast({
        title: "✅ הקובץ יוצא בהצלחה",
        description: `הורדת ${submissions.length} אישורי הגעה`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "❌ שגיאה בייצוא",
        description: "אירעה שגיאה בעת ייצוא הקובץ",
        variant: "destructive"
      });
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
  const totalMen = submissions.reduce((sum, s) => sum + s.men_count, 0);
  const totalWomen = submissions.reduce((sum, s) => sum + s.women_count, 0);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-500">{totalMen}</div>
                <p className="text-sm text-muted-foreground">גברים</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{totalWomen}</div>
                <p className="text-sm text-muted-foreground">נשים</p>
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
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={exportToExcel} 
                disabled={submissions.length === 0}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 ml-2" />
                ייצוא לאקסל
              </Button>
            </div>
            <RSVPSubmissionsList 
              submissions={submissions} 
              loading={submissionsLoading}
              onDeleteSubmission={handleDeleteSubmission}
              onUpdateSubmission={handleUpdateSubmission}
            />
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

        {/* Logo at bottom */}
        <div className="mt-12 flex justify-center pb-8">
          <img 
            src={fleishmanPelesLogo} 
            alt="Fleishman Peles Logo" 
            className="h-16 opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
}