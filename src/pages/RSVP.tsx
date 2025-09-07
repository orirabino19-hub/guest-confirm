import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useShortCodes } from "@/hooks/useShortCodes";

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
  const { resolveShortCodes, getGuestNameByCodes } = useShortCodes();

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
        let actualEventId = eventId;
        let actualPhone = phone;

        // Check if eventId looks like a short code (numeric and short)
        const isShortCode = eventId && /^\d+$/.test(eventId) && eventId.length < 10;
        
        if (isShortCode && phone && !urlGuestName) {
          console.log('Attempting to resolve short codes:', eventId, phone);
          const resolved = await resolveShortCodes(eventId, phone);
          console.log('Resolution result:', resolved);
          if (resolved) {
            actualEventId = resolved.eventId;
            actualPhone = phone; // Keep original for guest lookup
            console.log('Resolved to eventId:', actualEventId, 'phone:', actualPhone);
          } else {
            console.log('Short code resolution failed');
            setError(t('rsvp.errors.eventNotFound'));
            setLoading(false);
            return;
          }
        }

        // טעינת האירוע מ-Supabase לפי ID
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', actualEventId)
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
        } else if (actualPhone) {
          // Try to get guest name using short codes first
          let guestNameResult = null;
          
          if (eventId !== actualEventId) {
            // We resolved short codes, try to get name by codes
            guestNameResult = await getGuestNameByCodes(eventId, phone!);
          }
          
          if (!guestNameResult) {
            // Fallback to old phone-based lookup
            try {
              const { data: guestNameFromRPC, error: guestError } = await supabase
                .rpc('get_guest_name_by_phone', {
                  _event_id: actualEventId,
                  _phone: actualPhone
                });

              console.log('Guest name result:', { guestNameFromRPC, guestError });

              if (guestNameFromRPC) {
                guestNameResult = guestNameFromRPC;
              }
            } catch (err) {
              console.error('Error calling get_guest_name_by_phone:', err);
            }
          }

          if (guestNameResult) {
            setGuestName(guestNameResult);
          } else {
            // אם לא נמצא אורח - שם ברירת מחדל
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
  }, [phone, eventId, urlGuestName, i18n.language, t, resolveShortCodes, getGuestNameByCodes]);

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