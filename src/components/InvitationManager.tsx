import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, FileText, Eye, Trash2 } from "lucide-react";
import { LanguageConfig } from "@/components/LanguageSystemManager";
import { supabase } from "@/integrations/supabase/client";

interface EventInvitation {
  eventId: string;
  language: string;
  type: 'image' | 'pdf';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface InvitationManagerProps {
  selectedEventId: string | null;
  eventName?: string;
  availableLanguages?: LanguageConfig[];
}

const InvitationManager = ({ selectedEventId, eventName, availableLanguages }: InvitationManagerProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  // Default languages if none provided
  const defaultLanguages: LanguageConfig[] = [
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false }
  ];
  
  const languages = availableLanguages || defaultLanguages;
  
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch invitations for selected event
  useEffect(() => {
    if (selectedEventId) {
      fetchInvitations();
    }
  }, [selectedEventId]);

  const fetchInvitations = async () => {
    if (!selectedEventId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('invitations')
        .list(selectedEventId, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      const invitationList: EventInvitation[] = (data || []).map(file => {
        const parts = file.name.split('.');
        const extension = (parts.pop() || '').toLowerCase();
        const [language, type] = parts.join('.').split('-');

        const { data: publicData } = supabase.storage
          .from('invitations')
          .getPublicUrl(`${selectedEventId}/${file.name}`);
        
        return {
          eventId: selectedEventId,
          language: language || 'he',
          type: (type === 'pdf' || extension === 'pdf' ? 'pdf' : 'image'),
          fileName: file.name,
          fileUrl: publicData.publicUrl,
          uploadedAt: file.created_at || new Date().toISOString()
        };
      });

      setInvitations(invitationList);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "❌ שגיאה",
        description: "שגיאה בטעינת ההזמנות",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (language: string, type: 'image' | 'pdf') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validPdfTypes = ['application/pdf'];
    
    if (type === 'image' && !validImageTypes.includes(file.type)) {
      toast({
        title: "❌ קובץ לא תקין",
        description: "אנא העלה קובץ תמונה (JPG, PNG, WebP)",
        variant: "destructive"
      });
      return;
    }
    
    if (type === 'pdf' && !validPdfTypes.includes(file.type)) {
      toast({
        title: "❌ קובץ לא תקין", 
        description: "אנא העלה קובץ PDF",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create file path: {eventId}/{language}-{type}.{extension}
      const extension = file.name.split('.').pop();
      const fileName = `${language}-${type}.${extension}`;
      const filePath = `${selectedEventId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('invitations')
        .upload(filePath, file, {
          upsert: true // Replace if exists
        });

      if (error) throw error;

      const languageConfig = languages.find(lang => lang.code === language);
      const languageName = languageConfig ? languageConfig.nativeName : language;
      
      toast({
        title: "✅ הזמנה הועלתה",
        description: `הזמנה ב${languageName} הועלתה בהצלחה`
      });

      // Refresh the invitations list
      await fetchInvitations();

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "❌ שגיאה בהעלאה",
        description: "לא ניתן להעלות את הקובץ, נסה שוב",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const handleDelete = async (invitation: EventInvitation) => {
    setIsLoading(true);
    
    try {
      const filePath = `${invitation.eventId}/${invitation.fileName}`;
      
      const { error } = await supabase.storage
        .from('invitations')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "🗑️ הזמנה נמחקה",
        description: "ההזמנה נמחקה בהצלחה"
      });

      // Refresh the invitations list
      await fetchInvitations();

    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "❌ שגיאה במחיקה",
        description: "לא ניתן למחוק את הקובץ, נסה שוב",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentInvitations = invitations.filter(inv => inv.eventId === selectedEventId);

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            ניהול הזמנות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לנהל הזמנות
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          ניהול הזמנות - {eventName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={languages[0]?.code || "he"} className="space-y-4">
          <TabsList className={`grid w-full ${languages.length <= 2 ? 'grid-cols-2' : languages.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {languages.map(lang => (
              <TabsTrigger key={lang.code} value={lang.code}>
                {lang.nativeName} {lang.flag}
              </TabsTrigger>
            ))}
          </TabsList>

          {languages.map(lang => (
            <TabsContent key={lang.code} value={lang.code}>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm">
                    העלה הזמנות לאירוע ב{lang.nativeName}. 
                    ניתן להעלות תמונה (WEBP, JPG, PNG) או קובץ PDF.
                  </p>
                </div>

                {/* Upload sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image upload */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center space-y-3">
                        <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                          <Label>הזמנה כתמונה</Label>
                          <p className="text-xs text-muted-foreground">WEBP, JPG, PNG</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload(lang.code, 'image')}
                          className="cursor-pointer"
                          disabled={isLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF upload */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center space-y-3">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                          <Label>הזמנה כ-PDF</Label>
                          <p className="text-xs text-muted-foreground">קובץ PDF</p>
                        </div>
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUpload(lang.code, 'pdf')}
                          className="cursor-pointer"
                          disabled={isLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current invitations for this language */}
                <div className="space-y-3">
                  <h4 className="font-medium">הזמנות קיימות ב{lang.nativeName}</h4>
                  {currentInvitations.filter(inv => inv.language === lang.code).length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
                      אין הזמנות ב{lang.nativeName} עדיין
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentInvitations
                        .filter(inv => inv.language === lang.code)
                        .map((invitation, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {invitation.type === 'image' ? (
                                    <Image className="h-5 w-5" />
                                  ) : (
                                    <FileText className="h-5 w-5" />
                                  )}
                                  <div>
                                    <p className="font-medium">{invitation.fileName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {invitation.type === 'image' ? 'תמונה' : 'PDF'} • 
                                      הועלה {new Date(invitation.uploadedAt).toLocaleDateString('he-IL')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invitation.fileUrl, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(invitation)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InvitationManager;