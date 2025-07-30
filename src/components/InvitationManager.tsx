import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, FileText, Eye, Trash2 } from "lucide-react";

interface EventInvitation {
  eventId: string;
  language: 'he' | 'en';
  type: 'image' | 'pdf';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface InvitationManagerProps {
  selectedEventId: string | null;
  eventName?: string;
}

const InvitationManager = ({ selectedEventId, eventName }: InvitationManagerProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  // Mock data - in real app this would come from backend
  const [invitations, setInvitations] = useState<EventInvitation[]>([
    {
      eventId: "1",
      language: "he", 
      type: "image",
      fileName: "invitation-he.jpg",
      fileUrl: "/lovable-uploads/2ed7e50b-48f4-4be4-b874-a19830a05aaf.png",
      uploadedAt: new Date().toISOString()
    }
  ]);

  const handleFileUpload = (language: 'he' | 'en', type: 'image' | 'pdf') => (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // In real app, this would upload to storage (Supabase Storage)
    const newInvitation: EventInvitation = {
      eventId: selectedEventId,
      language,
      type,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file), // Mock URL
      uploadedAt: new Date().toISOString()
    };

    // Remove existing invitation for same event+language+type
    setInvitations(prev => 
      prev.filter(inv => 
        !(inv.eventId === selectedEventId && inv.language === language && inv.type === type)
      ).concat(newInvitation)
    );

    toast({
      title: "✅ הזמנה הועלתה",
      description: `הזמנה ב${language === 'he' ? 'עברית' : 'אנגלית'} הועלתה בהצלחה`
    });
  };

  const handleDelete = (invitation: EventInvitation) => {
    setInvitations(prev => 
      prev.filter(inv => 
        !(inv.eventId === invitation.eventId && 
          inv.language === invitation.language && 
          inv.type === invitation.type)
      )
    );
    
    toast({
      title: "🗑️ הזמנה נמחקה",
      description: "ההזמנה נמחקה בהצלחה"
    });
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
        <Tabs defaultValue="he" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="he">עברית 🇮🇱</TabsTrigger>
            <TabsTrigger value="en">English 🇺🇸</TabsTrigger>
          </TabsList>

          {(['he', 'en'] as const).map(lang => (
            <TabsContent key={lang} value={lang}>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm">
                    העלה הזמנות לאירוע ב{lang === 'he' ? 'עברית' : 'אנגלית'}. 
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
                          onChange={handleFileUpload(lang, 'image')}
                          className="cursor-pointer"
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
                          onChange={handleFileUpload(lang, 'pdf')}
                          className="cursor-pointer"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current invitations for this language */}
                <div className="space-y-3">
                  <h4 className="font-medium">הזמנות קיימות ב{lang === 'he' ? 'עברית' : 'אנגלית'}</h4>
                  {currentInvitations.filter(inv => inv.language === lang).length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
                      אין הזמנות ב{lang === 'he' ? 'עברית' : 'אנגלית'} עדיין
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentInvitations
                        .filter(inv => inv.language === lang)
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