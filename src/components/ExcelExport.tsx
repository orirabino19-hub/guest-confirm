import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Guest } from '@/hooks/useGuests';
import { RSVPSubmission } from '@/hooks/useRSVP';
import { useShortCodes } from '@/hooks/useShortCodes';

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  createdAt: string;
}

interface ExcelExportProps {
  selectedEventId: string | null;
  selectedEventSlug: string | null;
  eventName?: string;
  guests: Guest[];
  submissions: RSVPSubmission[];
}

const ExcelExport = ({ selectedEventId, selectedEventSlug, eventName, guests, submissions }: ExcelExportProps) => {
  const { toast } = useToast();
  const { generateShortLink, generateMissingCodes } = useShortCodes();

  // Generate missing codes when component mounts
  useEffect(() => {
    if (selectedEventId) {
      generateMissingCodes();
    }
  }, [selectedEventId]); // הסרת generateMissingCodes מהdependency array

  const generateInviteLink = (eventId: string, phone: string): string => {
    const currentDomain = window.location.origin;
    return `${currentDomain}/rsvp/${eventId}/${phone}`;
  };

  const exportGuestList = async () => {
    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוع לפני הייצוא",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 ExcelExport Debug:');
    console.log('selectedEventId:', selectedEventId);
    console.log('submissions length:', submissions.length);
    console.log('submissions sample:', submissions.slice(0, 2));

    const filteredGuests = guests.filter(guest => guest.event_id === selectedEventId);

    if (filteredGuests.length === 0) {
      toast({
        title: "⚠️ אין נתונים לייצוא",
        description: "לא נמצאו אורחים לאירוע זה",
        variant: "destructive"
      });
      return;
    }

    // סנן submissions רק לאירוע הנוכחי
    const eventSubmissions = submissions.filter(s => s.event_id === selectedEventId);
    console.log('🔍 Event submissions:', eventSubmissions.length);

    // Aggregate confirmed counts per guest (by guest_id if available, otherwise by full_name)
    const keyForSubmission = (s: RSVPSubmission) => (s.guest_id ? String(s.guest_id) : (s.full_name || '').trim());
    const confirmedMap = new Map<string, { men: number; women: number; total: number }>();
    for (const s of eventSubmissions) {
      const k = keyForSubmission(s);
      if (!k) continue;
      const men = Number(s.men_count) || 0;
      const women = Number(s.women_count) || 0;
      const prev = confirmedMap.get(k) || { men: 0, women: 0, total: 0 };
      const next = { men: prev.men + men, women: prev.women + women, total: prev.total + men + women };
      confirmedMap.set(k, next);
    }

    // Prepare data for export (Guests sheet)
    const exportData = await Promise.all(filteredGuests.map(async (guest, index) => {
      const guestKeyById = String(guest.id);
      const guestKeyByName = (guest.full_name || '').trim();
      const confirmed = confirmedMap.get(guestKeyById) || confirmedMap.get(guestKeyByName) || { men: 0, women: 0, total: 0 };
      const shortLink = await generateShortLink(selectedEventId, guest.phone || '');
      
      return {
        'מס רשומה': index + 1,
        'שם מלא': guest.full_name,
        'טלפון': guest.phone,
        'סטטוס': confirmed.total > 0 ? 'אישר' : 'ממתין',
        'גברים (מאושרים)': confirmed.men,
        'נשים (מאושרות)': confirmed.women,
        'סה"כ מאושרים': confirmed.total,
        'קישור אישי': shortLink
      };
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },   // מס רשומה
      { wch: 25 },  // שם מלא
      { wch: 15 },  // טלפון
      { wch: 12 },  // סטטוס
      { wch: 18 },  // גברים (מאושרים)
      { wch: 18 },  // נשים (מאושרות)
      { wch: 20 },  // סה"כ מאושרים
      { wch: 50 }   // קישור אישי
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'רשימת אורחים');

    // Compute summary from submissions (include all submissions for this event)
    const allEventSubmissions = eventSubmissions;

    console.log('🔍 Submissions for this event:', allEventSubmissions.length);
    console.log('🔍 Sample event submission:', allEventSubmissions[0]);

    // Count unique guests who confirmed (prefer guest_id, fallback to trimmed full_name)
    const keyFor = (s: RSVPSubmission) => (s.guest_id ? String(s.guest_id) : (s.full_name || '').trim());
    const confirmedGuestKeys = new Set<string>(allEventSubmissions.map(keyFor).filter(Boolean));
    const confirmedGuestsCount = confirmedGuestKeys.size;

    const totalConfirmedMen = allEventSubmissions.reduce((sum, s) => sum + Number(s.men_count || 0), 0);
    const totalConfirmedWomen = allEventSubmissions.reduce((sum, s) => sum + Number(s.women_count || 0), 0);
    const totalConfirmedGuests = totalConfirmedMen + totalConfirmedWomen;

    const summaryData = [
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'שם האירוע', 'ערך': eventName || 'לא צוין' },
      { 'פרטי האירוע': 'תאריך הייצוא', 'ערך': new Date().toLocaleDateString('he-IL') },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'סיכום אורחים', 'ערך': '' },
      { 'פרטי האירוע': 'סה"כ מוזמנים במערכת', 'ערך': filteredGuests.length },
      { 'פרטי האירוע': 'אישרו הגעה', 'ערך': confirmedGuestsCount },
      { 'פרטי האירוע': 'ממתינים לתשובה', 'ערך': Math.max(filteredGuests.length - confirmedGuestsCount, 0) },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'מספר מוזמנים שיגיעו', 'ערך': '' },
      { 'פרטי האירוע': 'גברים', 'ערך': totalConfirmedMen },
      { 'פרטי האירוע': 'נשים', 'ערך': totalConfirmedWomen },
      { 'פרטי האירוע': 'סה"כ מוזמנים שיגיעו', 'ערך': totalConfirmedGuests },
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'סיכום');

    // Add RSVPs worksheet (include all submissions)
    const rsvpData = allEventSubmissions.map((s, index) => ({
      'מס רשומה': index + 1,
      'שם מלא': s.full_name || '',
      'גברים (מאושרים)': s.men_count,
      'נשים (מאושרות)': s.women_count,
      'סה"כ מאושרים': (s.men_count + s.women_count),
      'תאריך אישור': new Date(s.submitted_at).toLocaleString('he-IL')
    }));

    const rsvpSheet = XLSX.utils.json_to_sheet(rsvpData);
    rsvpSheet['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, rsvpSheet, 'אישורי הגעה');

    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `אורחים_${eventName || 'אירוע'}_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast({
      title: "📥 הקובץ יוצא בהצלחה",
      description: `הקובץ "${filename}" הורד למחשב`
    });
  };

  const copyAllLinks = async () => {
    if (!selectedEventId || !selectedEventSlug) return;

    const filteredGuests = guests.filter(guest => guest.event_id === selectedEventId);
    
    const linksPromises = filteredGuests.map(async (guest) => {
      const shortLink = await generateShortLink(selectedEventId, guest.phone || '');
      return `${guest.full_name}: ${shortLink}`;
    });
    
    const links = await Promise.all(linksPromises);

    navigator.clipboard.writeText(links.join('\n'));
    toast({
      title: "🔗 קישורים הועתקו",
      description: `הועתקו ${filteredGuests.length} קישורים קצרים ללוח`
    });
  };

  const filteredGuests = selectedEventId 
    ? guests.filter(guest => guest.event_id === selectedEventId)
    : [];

  const uiAllEventSubs = selectedEventId ? 
    submissions.filter(s => s.event_id === selectedEventId) : [];
  const confirmedCount = new Set<string>(
    uiAllEventSubs.map(s => (s.guest_id ? String(s.guest_id) : (s.full_name || '').trim())).filter(Boolean)
  ).size;
  const pendingGuests = Math.max(filteredGuests.length - confirmedCount, 0);

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייצוא נתונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לייצא את הנתונים
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          ייצוא נתונים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <div className="text-sm text-green-600">אישרו הגעה</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingGuests}</div>
            <div className="text-sm text-yellow-600">ממתינים לתשובה</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredGuests.length}</div>
            <div className="text-sm text-blue-600">סה"כ מוזמנים</div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-2">
          <Button 
            onClick={exportGuestList}
            disabled={filteredGuests.length === 0}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 ml-2" />
            ייצא לקובץ Excel
          </Button>

          <Button 
            variant="outline"
            onClick={copyAllLinks}
            disabled={filteredGuests.length === 0}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 ml-2" />
            העתק את כל הקישורים
          </Button>
        </div>

        {/* File Contents Preview */}
        {filteredGuests.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="font-medium">הקובץ יכלול:</div>
            <div className="space-y-1 pr-4">
            <div>• רשימת אורחים מלאה עם קישורים אישיים + סטטוס אישור</div>
            <div>• סיכום סטטיסטיקות כולל מאושרים בפועל</div>
            <div>• גיליון "אישורי הגעה" עם כל האישים המאושרים</div>
            </div>
          </div>
        )}

        {filteredGuests.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            אין אורחים לייצוא עבור אירוע זה
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelExport;