import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn?: string;
  required: boolean;
  options?: string[];
}

const RSVP = () => {
  const { eventId, phone, guestName: urlGuestName } = useParams<{ eventId: string; phone: string; guestName: string }>();
  const [guestName, setGuestName] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      // Check if we have either phone or guestName from URL
      if (!phone && !urlGuestName) {
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      // אם אין eventId, נשתמש בברירת מחדל
      const currentEventId = eventId || "1";

      try {
        // Simulate API call to fetch guest and event data
        // This will be connected to Supabase later
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock event data with custom fields
        const mockEvents = {
          "1": {
            name: i18n.language === 'he' ? "החתונה של שייקי ומיכל" : "Shaiky & Michal's Wedding",
            customFields: []
          },
          "2": {
            name: i18n.language === 'he' ? "יום הולדת 30 לדני" : "Danny's 30th Birthday",
            customFields: []
          }
        };

        const foundEvent = mockEvents[currentEventId as keyof typeof mockEvents];
        if (!foundEvent) {
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }

        setEventName(foundEvent.name);
        setCustomFields(foundEvent.customFields);

        // If we have a guestName from URL, use it directly
        if (urlGuestName) {
          setGuestName(decodeURIComponent(urlGuestName));
        } else if (phone) {
          // Otherwise, look up by phone (existing logic)
          const mockGuests = {
            "0501234567": i18n.language === 'he' ? "משה כהן" : "Moshe Cohen",
            "0527654321": i18n.language === 'he' ? "שרה לוי" : "Sarah Levy",
            "0543216789": i18n.language === 'he' ? "דוד ישראלי" : "David Israeli",
            "0556789123": i18n.language === 'he' ? "רחל אברהם" : "Rachel Abraham"
          };

          const cleanPhone = phone.replace(/\D/g, '');
          const foundGuest = mockGuests[cleanPhone as keyof typeof mockGuests];
          setGuestName(foundGuest || (i18n.language === 'he' ? "אורח יקר" : "Dear Guest"));
        }
      } catch (err) {
        setError(t('rsvp.errors.guestDataError'));
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phone, eventId, urlGuestName, i18n.language, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LanguageSelector />
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4 mt-4" />
            <p className="text-lg text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4 border-destructive/50">
          <CardContent className="text-center py-12">
            <LanguageSelector />
            <div className="text-4xl mb-4 mt-4">❌</div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">{t('common.error')}</h2>
            <p className="text-muted-foreground">{error}</p>
            <a 
              href="/" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              {t('rsvp.errors.returnHome')}
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RSVPForm 
      guestName={guestName} 
      phone={phone || ""} 
      eventName={eventName}
      customFields={customFields}
    />
  );
};

export default RSVP;