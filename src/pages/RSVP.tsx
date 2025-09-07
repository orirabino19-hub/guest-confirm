import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";

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
  const [currentEventId, setCurrentEventId] = useState<string>("");
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

      // אם אין eventId, צריך eventId לטעינת האירוע
      if (!eventId) {
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        // טעינת האירוע מ-Supabase לפי ID
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();

        if (eventError || !eventData) {
          console.error('Event not found:', eventError);
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }

        setEventName(eventData.title);
        setCurrentEventId(eventData.id);

        // טעינת השדות המותאמים אישית - רק עבור לינקים אישיים
        const { data: customFieldsData, error: fieldsError } = await supabase
          .from('custom_fields_config')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('link_type', 'personal')
          .eq('is_active', true)
          .order('order_index');

        if (fieldsError) {
          console.error('Error fetching custom fields:', fieldsError);
        }

        // המרת הנתונים לפורמט הנדרש
        const fields: CustomField[] = customFieldsData?.map(field => ({
          id: field.key,
          type: field.field_type as any,
          label: field.label,
          labelEn: field.label, // נוכל להוסיף תמיכה בשפות מאוחר יותר
          required: field.required,
          options: field.options as string[] || undefined
        })) || [];

        setCustomFields(fields);

        console.log('Custom fields loaded:', fields);
        console.log('Event ID:', eventData.id);
        console.log('Link type: personal');

        // If we have a guestName from URL, use it directly
        if (urlGuestName) {
          setGuestName(decodeURIComponent(urlGuestName));
        } else if (phone) {
          // טעינת שם האורח בצורה מאובטחת באמצעות RPC
          console.log('Looking for guest with phone:', phone, 'and eventId:', eventId);
          
          try {
            const { data: guestName, error: guestError } = await supabase
              .rpc('get_guest_name_by_phone', {
                _event_id: eventId,
                _phone: phone
              });

            console.log('Guest name result:', { guestName, guestError });

            if (guestName) {
              setGuestName(guestName);
            } else {
              // אם לא נמצא אורח - שם ברירת מחדל
              setGuestName(i18n.language === 'he' ? "אורח יקר" : "Dear Guest");
            }
          } catch (err) {
            console.error('Error calling get_guest_name_by_phone:', err);
            setGuestName(i18n.language === 'he' ? "אורח יקר" : "Dear Guest");
          }
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
      eventId={currentEventId}
    />
  );
};

export default RSVP;