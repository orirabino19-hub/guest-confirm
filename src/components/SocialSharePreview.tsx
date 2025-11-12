import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SocialSharePreviewProps {
  eventId: string;
  language: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewData {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

const SocialSharePreview = ({ eventId, language, open, onOpenChange }: SocialSharePreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (open && eventId) {
      loadPreviewData();
    }
  }, [open, eventId, language]);

  const loadPreviewData = async () => {
    setLoading(true);
    try {
      // Fetch event data
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, description, short_code')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        console.error('Event not found:', eventError);
        return;
      }

      // Fetch event languages and translations
      const { data: languages } = await supabase
        .from('event_languages')
        .select('locale, translations')
        .eq('event_id', eventId);

      // Helper to get translated text
      const getTranslation = (key: string, defaultValue: string) => {
        if (!languages || languages.length === 0) return defaultValue;
        
        const lang = languages.find(l => l.locale === language);
        if (lang?.translations && typeof lang.translations === 'object') {
          const translation = (lang.translations as any)[key];
          if (translation) return translation;
        }
        return defaultValue;
      };

      // Build translated content
      const eventTitle = event.title || getTranslation('event.title', 'אירוע');
      
      const titlePrefix = 
        language === 'he' ? 'הזמנה ל' :
        language === 'de' ? 'Einladung zu ' :
        language === 'en' ? 'Invitation to ' :
        language === 'ar' ? 'دعوة إلى ' :
        language === 'ru' ? 'Приглашение на ' :
        language === 'fr' ? 'Invitation à ' :
        language === 'es' ? 'Invitación a ' :
        'הזמנה ל';

      const fullTitle = `${titlePrefix}${eventTitle}`;

      const eventDescription = event.description || getTranslation('event.description', 
        language === 'he' ? `הוזמנת לאירוע "${eventTitle}"` :
        language === 'de' ? `Sie sind zum Event "${eventTitle}" eingeladen` :
        language === 'en' ? `You are invited to the event "${eventTitle}"` :
        `הוזמנת לאירוע "${eventTitle}"`
      );

      // Get invitation image from storage
      const supabaseUrl = 'https://jaddfwycowygakforhro.supabase.co';
      const { data: storageData } = await supabase
        .storage
        .from('invitations')
        .list(`${eventId}/${language}`, { limit: 1 });

      let imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/default-invitation.jpg`;
      if (storageData && storageData.length > 0) {
        imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/${eventId}/${language}/${storageData[0].name}`;
      } else {
        // Fallback to default language
        const { data: defaultStorage } = await supabase
          .storage
          .from('invitations')
          .list(`${eventId}/he`, { limit: 1 });
        
        if (defaultStorage && defaultStorage.length > 0) {
          imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/${eventId}/he/${defaultStorage[0].name}`;
        }
      }

      const displayCode = event.short_code || event.id;
      const url = `https://fp-pro.info/rsvp/${displayCode}/open?lang=${language}`;

      setPreviewData({
        title: fullTitle,
        description: eventDescription,
        imageUrl,
        url
      });
    } catch (error) {
      console.error('Failed to load preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה - שיתוף ברשתות חברתיות</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : previewData ? (
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="bg-[#075E54] p-4 rounded-lg">
                <div className="bg-[#DCF8C6] rounded-lg overflow-hidden max-w-sm">
                  <img 
                    src={previewData.imageUrl} 
                    alt="Preview"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-gray-500 uppercase">{new URL(previewData.url).hostname}</p>
                    <h3 className="font-semibold text-sm line-clamp-2">{previewData.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{previewData.description}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                כך הקישור ייראה ב-WhatsApp
              </p>
            </TabsContent>

            <TabsContent value="facebook" className="space-y-4">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-0">
                  <img 
                    src={previewData.imageUrl} 
                    alt="Preview"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4 space-y-2 bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">
                      {new URL(previewData.url).hostname}
                    </p>
                    <h3 className="font-bold text-base line-clamp-2">{previewData.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {previewData.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground text-center">
                כך הקישור ייראה ב-Facebook/Twitter
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            לא ניתן לטעון תצוגה מקדימה
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocialSharePreview;
