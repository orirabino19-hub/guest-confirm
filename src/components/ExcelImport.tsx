import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Users, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Guest } from './GuestList';

interface ExcelImportProps {
  selectedEventId: string | null;
  onGuestsImported: (guests: Omit<Guest, 'id'>[]) => void;
}

interface ExcelRow {
  'שם פרטי'?: string;
  'שם משפחה'?: string;
  'טלפון'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Phone'?: string;
  [key: string]: any;
}

const ExcelImport = ({ selectedEventId, onGuestsImported }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces, dashes, and other non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Israeli phone numbers: 10 digits starting with 05 or 9-10 digits starting with 972
    if (cleanPhone.startsWith('972')) {
      return cleanPhone.length === 12; // 972XXXXXXXXX
    }
    
    return cleanPhone.length === 10 && cleanPhone.startsWith('05');
  };

  const normalizePhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('972')) {
      return '0' + cleanPhone.substring(3);
    }
    
    return cleanPhone;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוע לפני העלאת הקובץ",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

      if (jsonData.length === 0) {
        throw new Error('הקובץ ריק או לא מכיל נתונים');
      }

      // Validate required columns
      const firstRow = jsonData[0];
      const hasHebrewColumns = 'שם פרטי' in firstRow && 'שם משפחה' in firstRow && 'טלפון' in firstRow;
      const hasEnglishColumns = 'First Name' in firstRow && 'Last Name' in firstRow && 'Phone' in firstRow;

      if (!hasHebrewColumns && !hasEnglishColumns) {
        throw new Error('הקובץ חייב להכיל עמודות: "שם פרטי", "שם משפחה" ו"טלפון" או "First Name", "Last Name" ו"Phone"');
      }

      // Process and validate data
      const processedGuests: Omit<Guest, 'id'>[] = [];
      const errors: string[] = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // +2 because Excel rows start at 1 and we skip header
        
        const firstName = row['שם פרטי'] || row['First Name'] || '';
        const lastName = row['שם משפחה'] || row['Last Name'] || '';
        const phone = row['טלפון'] || row['Phone'] || '';

        if (!firstName.trim()) {
          errors.push(`שורה ${rowNum}: שדה "שם פרטי" ריק`);
          return;
        }

        if (!lastName.trim()) {
          errors.push(`שורה ${rowNum}: שדה "שם משפחה" ריק`);
          return;
        }

        if (!phone.toString().trim()) {
          errors.push(`שורה ${rowNum}: שדה "טלפון" ריק`);
          return;
        }

        const phoneStr = phone.toString().trim();
        if (!validatePhoneNumber(phoneStr)) {
          errors.push(`שורה ${rowNum}: מספר טלפון לא תקין - ${phoneStr}`);
          return;
        }

        const normalizedPhone = normalizePhoneNumber(phoneStr);
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        processedGuests.push({
          eventId: selectedEventId,
          fullName: fullName,
          phone: normalizedPhone,
          status: 'pending'
        });
      });

      if (errors.length > 0) {
        const errorMsg = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...ועוד ${errors.length - 5} שגיאות` : '');
        throw new Error(errorMsg);
      }

      setPreviewData(jsonData.slice(0, 5)); // Show first 5 rows for preview
      
      toast({
        title: "✅ קובץ נטען בהצלחה",
        description: `נמצאו ${processedGuests.length} אורחים תקינים`
      });

      onGuestsImported(processedGuests);

    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "❌ שגיאה בעיבוד הקובץ",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive"
      });
      setPreviewData([]);
      setFileName('');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            יבוא מקובץ Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי להעלות קובץ אורחים
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
          יבוא מקובץ Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>דרישות הקובץ:</strong>
            <br />• הקובץ חייב להכיל עמודות: "שם פרטי", "שם משפחה" ו"טלפון"
            <br />• מספרי הטלפון חייבים להיות ישראליים (10 ספרות, מתחיל ב-05)
            <br />• פורמטים נתמכים: .xlsx, .xls
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button 
            onClick={triggerFileSelect}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 ml-2" />
            {isProcessing ? 'מעבד קובץ...' : 'בחר קובץ Excel'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{fileName}</span>
            <Badge variant="secondary" className="mr-auto">
              הועלה בהצלחה
            </Badge>
          </div>
        )}

        {previewData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              תצוגה מקדימה (5 שורות ראשונות)
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-right">שם פרטי</th>
                      <th className="p-2 text-right">שם משפחה</th>
                      <th className="p-2 text-right">טלפון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{row['שם פרטי'] || row['First Name']}</td>
                        <td className="p-2">{row['שם משפחה'] || row['Last Name']}</td>
                        <td className="p-2 font-mono">{row['טלפון'] || row['Phone']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelImport;