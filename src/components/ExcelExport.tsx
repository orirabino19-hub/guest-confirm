import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Guest } from '@/hooks/useGuests';
import { RSVPSubmission } from '@/hooks/useRSVP';

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

  const generateInviteLink = (eventId: string, phone: string): string => {
    return `${window.location.origin}/rsvp/${eventId}/${phone}`;
  };

  const exportGuestList = () => {
    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוع לפני הייצוא",
        variant: "destructive"
      });
      return;
    }

    const filteredGuests = guests.filter(guest => guest.event_id === selectedEventId);

    if (filteredGuests.length === 0) {
      toast({
        title: "⚠️ אין נתונים לייצוא",
        description: "לא נמצאו אורחים לאירוע זה",
        variant: "destructive"
      });
      return;
    }

    // Prepare data for export (Guests sheet)
    const exportData = filteredGuests.map((guest, index) => {
      const hasSubmission = submissions.some(s => (s.full_name || '').trim() === (guest.full_name || '').trim());
      return {
        'מס רשומה': index + 1,
        'שם מלא': guest.full_name,
        'טלפון': guest.phone,
        'סטטוס': hasSubmission ? 'אישר' : 'ממתין',
        'גברים (מוזמנים)': guest.men_count || 0,
        'נשים (מוזמנים)': guest.women_count || 0,
        'סה"כ מוזמנים': (guest.men_count || 0) + (guest.women_count || 0),
        'קישור אישי': selectedEventId ? generateInviteLink(selectedEventId, guest.phone || '') : ''
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },  // מס רשומה
      { wch: 25 }, // שם מלא
      { wch: 15 }, // טלפון
      { wch: 12 }, // סטטוס
      { wch: 14 }, // גברים (מוזמנים)
      { wch: 14 }, // נשים (מוזמנים)
      { wch: 16 }, // סה"כ מוזמנים
      { wch: 50 }  // קישור אישי
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'רשימת אורחים');

    // Compute summary from submissions
    const confirmedSubs = submissions;
    const totalConfirmedMen = confirmedSubs.reduce((sum, s) => sum + (s.men_count || 0), 0);
    const totalConfirmedWomen = confirmedSubs.reduce((sum, s) => sum + (s.women_count || 0), 0);
    const totalConfirmedGuests = totalConfirmedMen + totalConfirmedWomen;

    const summaryData = [
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'שם האירוע', 'ערך': eventName || 'לא צוין' },
      { 'פרטי האירוע': 'תאריך הייצוא', 'ערך': new Date().toLocaleDateString('he-IL') },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'סיכום אורחים', 'ערך': '' },
      { 'פרטי האירוע': 'סה"כ מוזמנים במערכת', 'ערך': filteredGuests.length },
      { 'פרטי האירוע': 'אישרו הגעה', 'ערך': confirmedSubs.length },
      { 'פרטי האירוע': 'ממתינים לתשובה', 'ערך': filteredGuests.length - confirmedSubs.length },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'מספר מוזמנים שיגיעו', 'ערך': '' },
      { 'פרטי האירוע': 'גברים', 'ערך': totalConfirmedMen },
      { 'פרטי האירוע': 'נשים', 'ערך': totalConfirmedWomen },
      { 'פרטי האירוע': 'סה"כ מוזמנים שיגיעו', 'ערך': totalConfirmedGuests },
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'סיכום');

    // Add RSVPs worksheet
    const rsvpData = confirmedSubs.map((s, index) => ({
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

  const copyAllLinks = () => {
    if (!selectedEventId || !selectedEventSlug) return;

    const filteredGuests = guests.filter(guest => guest.event_id === selectedEventId);
    const links = filteredGuests.map(guest => 
      `${guest.full_name}: ${generateInviteLink(selectedEventId, guest.phone || '')}`
    ).join('\n');

    navigator.clipboard.writeText(links);
    toast({
      title: "🔗 קישורים הועתקו",
      description: `הועתקו ${filteredGuests.length} קישורים ללוח`
    });
  };

  const filteredGuests = selectedEventId 
    ? guests.filter(guest => guest.event_id === selectedEventId)
    : [];

  const confirmedCount = submissions.length;
  const pendingGuests = filteredGuests.length - confirmedCount;

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
            <div>• פירוט מספר מוזמנים לפי מגדר</div>
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