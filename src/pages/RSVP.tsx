import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useShortCodes } from "@/hooks/useShortCodes";
import { useCustomTexts } from "@/hooks/useCustomTexts";
import { updateMetaTags, generateRSVPMetaTags } from "@/utils/metaTags";

console.log('🔥 RSVP.tsx file loaded');

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn?: string;
  required: boolean;
  options?: string[];
}

const RSVP = () => {
  console.log('🚀 RSVP Component function called!');
  const params = useParams<{ eventId: string; phone: string; guestName: string }>();
  console.log('📋 useParams result:', params);
  const { eventId, phone, guestName: urlGuestName } = params;
  const [guestName, setGuestName] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [currentEventId, setCurrentEventId] = useState<string>("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { t, i18n } = useTranslation();
  const { resolveShortCodes, getGuestNameByEventCodeAndPhone } = useShortCodes();
  const { getCustomText, isTextHidden } = useCustomTexts(currentEventId);

  useEffect(() => {
    const fetchData = async () => {
      console.log('RSVP Page Debug:');
      console.log('- eventId:', eventId);
      console.log('- phone:', phone);
      console.log('- urlGuestName:', urlGuestName);

      // Check if we have either phone or guestName from URL
      if (!phone && !urlGuestName) {
        console.log('Missing both phone and guestName');
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      // אם אין eventId, צריך eventId לטעינת האירוע
      if (!eventId) {
        console.log('Missing eventId');
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        let actualEventId = eventId;
        let actualPhone = phone;

        // Check if eventId looks like a short code (numeric and short)
        const isShortCode = eventId && /^\d+$/.test(eventId) && eventId.length < 10;
        
        console.log('🔍 Short code detection:', {
          eventId,
          phone,
          urlGuestName,
          isShortCode,
          phoneExists: !!phone,
          guestNameExists: !!urlGuestName
        });
        
        if (isShortCode) {
          console.log('🔄 Short code detected, resolving to actual event ID');
          
          if (phone && !urlGuestName) {
            // Case: /rsvp/1/phone - use short code resolution with phone
            console.log('🔄 Attempting to resolve event code and phone:', eventId, phone);
            const resolved = await resolveShortCodes(eventId, phone);
            console.log('✅ Resolution result:', resolved);
            if (resolved) {
              actualEventId = resolved.eventId;
              actualPhone = phone; // Keep original for guest lookup
              console.log('🎯 Resolved to eventId:', actualEventId, 'phone:', actualPhone);
            } else {
              console.log('❌ Event code/phone resolution failed - no matching event/guest found');
              console.log('🔍 Debugging: eventId=', eventId, 'phone=', phone);
              setError(t('rsvp.errors.eventNotFound'));
              setLoading(false);
              return;
            }
          } else {
            // Case: /rsvp/1/name/Shlomi - lookup event by short_code directly
            console.log('🔄 Looking up event by short_code:', eventId);
            const { data: eventByCode, error: eventByCodeError } = await supabase
              .from('events')
              .select('id')
              .eq('short_code', eventId)
              .maybeSingle();
            
            console.log('Event lookup by short_code result:', { eventByCode, eventByCodeError });
            
            if (eventByCodeError || !eventByCode) {
              console.log('❌ Event not found by short_code:', eventId);
              setError(t('rsvp.errors.eventNotFound'));
              setLoading(false);
              return;
            }
            
            actualEventId = eventByCode.id;
            console.log('🎯 Resolved short_code to eventId:', actualEventId);
          }
        }

        console.log('🔍 About to query database with actualEventId:', actualEventId);
        console.log('🔍 Is actualEventId a UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actualEventId));
        
        // Guard: ensure we have a UUID before querying by id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(actualEventId)) {
          console.error('❗ Invalid eventId format (not UUID):', actualEventId);
          console.error('❗ Original eventId was:', eventId);
          console.error('❗ isShortCode was:', isShortCode);
          console.error('❗ Resolution failed or did not happen');
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }
        
        // טעינת האירוע מ-Supabase לפי ID
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', actualEventId)
          .maybeSingle();

        console.log('Database query result:', { eventData, eventError });

        if (eventError || !eventData) {
          console.error('Event not found:', eventError);
          console.error('Searched for eventId:', actualEventId);
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }

        setEventName(eventData.title);
        setCurrentEventId(eventData.id);
        
        // Update page title
        document.title = `הזמנה ל${eventData.title}`;

        // Update meta tags for social sharing - will be updated again when guest name is available
        const initialMetaTags = generateRSVPMetaTags(eventData.title, "");
        updateMetaTags(initialMetaTags);

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
          const decodedGuestName = decodeURIComponent(urlGuestName);
          setGuestName(decodedGuestName);
          
          // Update meta tags when we have guest name from URL
          const metaTags = generateRSVPMetaTags(eventData.title, decodedGuestName);
          updateMetaTags(metaTags);
        } else if (actualPhone) {
          // Try to get guest name using short codes first
          let guestNameResult = null;
          
          if (eventId !== actualEventId) {
            // We resolved short codes, try to get name by event code and phone
            guestNameResult = await getGuestNameByEventCodeAndPhone(eventId, phone!);
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
            
            // Update meta tags with guest name
            const metaTags = generateRSVPMetaTags(eventData.title, guestNameResult);
            updateMetaTags(metaTags);
          } else {
            // אם לא נמצא אורח - שם ברירת מחדל
            const defaultName = i18n.language === 'he' ? "אורח יקר" : "Dear Guest";
            setGuestName(defaultName);
            
            // Update meta tags with default guest name
            const metaTags = generateRSVPMetaTags(eventData.title, defaultName);
            updateMetaTags(metaTags);
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
  }, [phone, eventId, urlGuestName, i18n.language, t, resolveShortCodes, getGuestNameByEventCodeAndPhone]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LanguageSelector eventId={currentEventId} />
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
            <LanguageSelector eventId={currentEventId} />
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
      getCustomText={getCustomText}
      isTextHidden={isTextHidden}
      onInvitationLoad={(invitationUrl) => {
        // Update meta tags with the uploaded invitation image
        const metaTags = generateRSVPMetaTags(eventName, guestName, invitationUrl);
        updateMetaTags(metaTags);
      }}
    />
  );
};

export default RSVP;