import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";
import LanguageSelector from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useShortCodes } from "@/hooks/useShortCodes";

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
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const { t, i18n } = useTranslation();
  const { resolveShortCodes, getGuestNameByEventCodeAndPhone } = useShortCodes();

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

        // Check if there's already an RSVP submission for this guest
        let submissionQuery = supabase
          .from('rsvp_submissions')
          .select('*')
          .eq('event_id', actualEventId);

        // Try to match by different criteria
        if (urlGuestName) {
          submissionQuery = submissionQuery.eq('full_name', decodeURIComponent(urlGuestName));
        } else if (actualPhone) {
          // For phone-based matching, we'll check after setting the guest name
        }

        if (urlGuestName) {
          const { data: submission, error: submissionError } = await submissionQuery.maybeSingle();
          
          if (!submissionError && submission) {
            setExistingSubmission(submission);
            console.log('Found existing submission:', submission);
          }
        }

        // If we have a guestName from URL, use it directly
        if (urlGuestName) {
          setGuestName(decodeURIComponent(urlGuestName));
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
            
            // Check for existing submission by name
            const { data: submission, error: submissionError } = await supabase
              .from('rsvp_submissions')
              .select('*')
              .eq('event_id', actualEventId)
              .eq('full_name', guestNameResult)
              .maybeSingle();
            
            if (!submissionError && submission) {
              setExistingSubmission(submission);
              console.log('Found existing submission by name:', submission);
            }
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
  }, [phone, eventId, urlGuestName, i18n.language, t, resolveShortCodes, getGuestNameByEventCodeAndPhone]);

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

  // If guest already submitted RSVP, show confirmation instead of form
  if (existingSubmission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4 border-green-500/50 bg-green-50/50">
          <CardContent className="text-center py-12">
            <LanguageSelector />
            <div className="text-6xl mb-6 mt-4">✅</div>
            <h2 className="text-2xl font-bold mb-4 text-green-700">
              {i18n.language === 'he' ? 'כבר אישרת הגעה!' : 'Already Confirmed!'}
            </h2>
            <div className="space-y-2 text-lg">
              <p className="text-green-600">
                <strong>{guestName}</strong>
              </p>
              <p className="text-green-600">
                {i18n.language === 'he' ? 'אירוע:' : 'Event:'} <strong>{eventName}</strong>
              </p>
              <div className="bg-green-100 p-4 rounded-lg mt-4">
                <p className="text-green-700 font-medium">
                  {i18n.language === 'he' ? 'מספר המוזמנים שאישרת:' : 'Number of guests confirmed:'}
                </p>
                <div className="flex justify-center gap-4 mt-2 text-green-800">
                  <span>👨 {existingSubmission.men_count}</span>
                  <span>👩 {existingSubmission.women_count}</span>
                  <span className="font-bold">
                    {i18n.language === 'he' ? 'סה"כ:' : 'Total:'} {existingSubmission.men_count + existingSubmission.women_count}
                  </span>
                </div>
              </div>
              <p className="text-sm text-green-600 mt-4">
                {i18n.language === 'he' 
                  ? 'תודה! המקום שמור עבורך'
                  : 'Thank you! Your spot is reserved'
                }
              </p>
            </div>
            <a 
              href="/" 
              className="inline-block mt-6 text-primary hover:underline"
            >
              {i18n.language === 'he' ? 'חזור לעמוד הראשי' : 'Return to home page'}
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