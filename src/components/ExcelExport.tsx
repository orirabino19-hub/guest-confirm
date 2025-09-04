import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Guest } from '@/hooks/useGuests';

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
}

const ExcelExport = ({ selectedEventId, selectedEventSlug, eventName, guests }: ExcelExportProps) => {
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

    // Prepare data for export
    const exportData = filteredGuests.map((guest, index) => ({
      'מס רשומה': index + 1,
      'שם מלא': guest.full_name,
      'טלפון': guest.phone,
      'סטטוס': 'אורח',
      'גברים': guest.men_count || 0,
      'נשים': guest.women_count || 0,
      'סה"כ מוזמנים': (guest.men_count || 0) + (guest.women_count || 0),
      'תאריך רישום': new Date(guest.created_at).toLocaleDateString('he-IL'),
      'קישור אישי': selectedEventId ? generateInviteLink(selectedEventId, guest.phone || '') : ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },  // מס רשומה
      { wch: 25 }, // שם מלא
      { wch: 15 }, // טלפון
      { wch: 15 }, // סטטוס
      { wch: 8 },  // גברים
      { wch: 8 },  // נשים
      { wch: 12 }, // סה"כ מוזמנים
      { wch: 15 }, // תאריך אישור
      { wch: 50 }  // קישור אישי
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'רשימת אורחים');

  // Simplified compatibility stats since we don't have status field yet
  const confirmedGuests = []; // Will be updated when RSVP submissions are integrated
  const totalConfirmedMen = 0;
  const totalConfirmedWomen = 0;
  const totalConfirmedGuests = 0;

    const summaryData = [
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'שם האירוע', 'ערך': eventName || 'לא צוין' },
      { 'פרטי האירוע': 'תאריך הייצוא', 'ערך': new Date().toLocaleDateString('he-IL') },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'סיכום אורחים', 'ערך': '' },
      { 'פרטי האירוע': 'סה"כ מוזמנים במערכת', 'ערך': filteredGuests.length },
      { 'פרטי האירוע': 'אישרו הגעה', 'ערך': confirmedGuests.length },
      { 'פרטי האירוע': 'ממתינים לתשובה', 'ערך': filteredGuests.length - confirmedGuests.length },
      { 'פרטי האירוע': '', 'ערך': '' },
      { 'פרטי האירוע': 'מספר מוזמנים שיגיעו', 'ערך': '' },
      { 'פרטי האירוע': 'גברים', 'ערך': totalConfirmedMen },
      { 'פרטי האירוע': 'נשים', 'ערך': totalConfirmedWomen },
      { 'פרטי האירוע': 'סה"כ מוזמנים שיגיעו', 'ערך': totalConfirmedGuests },
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'סיכום');

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
      `${guest.full_name}: ${generateInviteLink(selectedEventSlug, guest.phone || '')}`
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

  const confirmedGuests = []; // Will be updated when RSVP integration is complete
  const pendingGuests = filteredGuests;

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
            <div className="text-2xl font-bold text-green-600">{confirmedGuests.length}</div>
            <div className="text-sm text-green-600">אישרו הגעה</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingGuests.length}</div>
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
              <div>• רשימת אורחים מלאה עם קישורים אישיים</div>
              <div>• סיכום סטטיסטיקות</div>
              <div>• פירוט מספר מוזמנים לפי מגדר</div>
              <div>• תאריכי אישור הגעה</div>
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