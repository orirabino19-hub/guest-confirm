import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    // Check both query param and path for language
    let langParam = url.searchParams.get('lang');
    if (!langParam) {
      // Try to extract from path like /rsvp/8/open/de
      const pathMatch = pathname.match(/\/open\/([a-z]{2})$/);
      if (pathMatch) {
        langParam = pathMatch[1];
      }
    }
    langParam = langParam || 'he';
    
    // Detect if request is from a bot (WhatsApp, Facebook, Twitter, etc.)
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|bot|crawler|spider|LinkedInBot/i.test(userAgent);
    
    console.log('Request received:', { pathname, lang: langParam, userAgent });
    console.log('Bot detected:', isBot);
    
    // Get event code or ID from query params
    const eventCode = url.searchParams.get('code');
    const eventId = url.searchParams.get('eventId');
    
    if (!eventCode && !eventId) {
      console.error('Event code or ID not found in URL');
      return new Response('Event code or ID required', { status: 400 });
    }
    
    console.log('Processing event:', { eventCode, eventId });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch event data - try by short_code first, then by UUID
    let event;
    let eventError;
    
    if (eventCode) {
      // Try to find by short_code
      const result = await supabase
        .from('events')
        .select('id, title, description, short_code')
        .eq('short_code', eventCode)
        .maybeSingle();
      event = result.data;
      eventError = result.error;
      
      // If not found, try as UUID
      if (!event && eventCode.length > 10) {
        const uuidResult = await supabase
          .from('events')
          .select('id, title, description, short_code')
          .eq('id', eventCode)
          .maybeSingle();
        event = uuidResult.data;
        eventError = uuidResult.error;
      }
    } else if (eventId) {
      // Direct UUID lookup
      const result = await supabase
        .from('events')
        .select('id, title, description, short_code')
        .eq('id', eventId)
        .maybeSingle();
      event = result.data;
      eventError = result.error;
    }
    
    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response('Event not found', { status: 404 });
    }
    
    console.log('Event loaded:', event.title);
    
    // Fetch event languages and translations - use event.id instead of eventId
    const { data: languages } = await supabase
      .from('event_languages')
      .select('locale, translations')
      .eq('event_id', event.id);
    
    console.log('Languages loaded:', languages?.length || 0);
    
    // Helper to get translated text - check multiple keys in order
    const getTranslation = (keys: string[], fallbackText: Record<string, string>) => {
      if (!languages || languages.length === 0) {
        return fallbackText[langParam] || fallbackText['en'] || fallbackText['he'] || '';
      }
      
      // Try to find translation for requested language
      const lang = languages.find(l => l.locale === langParam);
      if (lang?.translations && typeof lang.translations === 'object') {
        for (const key of keys) {
          const translation = (lang.translations as any)[key];
          if (translation) {
            console.log(`Translation found for key "${key}" in ${langParam}:`, translation);
            if (translation.text && typeof translation.text === 'object') {
              const translatedText = translation.text[langParam];
              if (translatedText) {
                console.log(`Using translation for "${key}":`, translatedText);
                return translatedText;
              }
            }
            if (typeof translation === 'string') {
              return translation;
            }
          }
        }
      }
      
      // Fallback to English if requested language not found
      if (langParam !== 'en') {
        console.log(`No ${langParam} translation found, trying English`);
        const enLang = languages.find(l => l.locale === 'en');
        if (enLang?.translations && typeof enLang.translations === 'object') {
          for (const key of keys) {
            const translation = (enLang.translations as any)[key];
            if (translation) {
              if (translation.text && typeof translation.text === 'object') {
                const translatedText = translation.text['en'];
                if (translatedText) {
                  console.log(`Using English fallback for "${key}":`, translatedText);
                  return translatedText;
                }
              }
              if (typeof translation === 'string') {
                return translation;
              }
            }
          }
        }
      }
      
      // Final fallback to provided text
      console.log(`No translation found, using fallback for ${langParam}`);
      return fallbackText[langParam] || fallbackText['en'] || fallbackText['he'] || '';
    };
    
    // Build translated content - try rsvp keys first (matches RSVP page), then event keys
    // Default texts in multiple languages (used only when no translation exists)
    const defaultEventTitle = {
      he: 'אירוע',
      en: 'Event',
      de: 'Veranstaltung',
      ar: 'حدث',
      ru: 'Событие',
      fr: 'Événement',
      es: 'Evento'
    };
    
    const eventTitle = getTranslation(['meta.ogTitle', 'rsvp.eventTitle', 'event.title'], defaultEventTitle);
    
    const defaultEventDescription = {
      he: `הוזמנת לאירוע "${eventTitle}"`,
      en: `You are invited to "${eventTitle}"`,
      de: `Sie sind zu "${eventTitle}" eingeladen`,
      ar: `أنت مدعو إلى "${eventTitle}"`,
      ru: `Вы приглашены на "${eventTitle}"`,
      fr: `Vous êtes invité à "${eventTitle}"`,
      es: `Estás invitado a "${eventTitle}"`
    };
    
    const eventDescription = getTranslation(['meta.ogDescription', 'rsvp.eventDescription', 'event.description', 'rsvp.eventInvitation'], defaultEventDescription);
    
    const titlePrefix = 
      langParam === 'he' ? 'הזמנה ל' :
      langParam === 'de' ? 'Einladung zu ' :
      langParam === 'en' ? 'Invitation to ' :
      langParam === 'ar' ? 'دعوة إلى ' :
      langParam === 'ru' ? 'Приглашение на ' :
      langParam === 'fr' ? 'Invitation à ' :
      langParam === 'es' ? 'Invitación a ' :
      'הזמנה ל';
    
    const fullTitle = `${titlePrefix}${eventTitle}`;
    
    // Get invitation image from storage - use event.id instead of eventId
    const { data: storageData } = await supabase
      .storage
      .from('invitations')
      .list(`${event.id}/${langParam}`, { limit: 1 });
    
    let imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/default-invitation.jpg`;
    if (storageData && storageData.length > 0) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/${event.id}/${langParam}/${storageData[0].name}`;
    } else {
      // Fallback to default language
      const { data: defaultStorage } = await supabase
        .storage
        .from('invitations')
        .list(`${event.id}/he`, { limit: 1 });
      
      if (defaultStorage && defaultStorage.length > 0) {
        imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/${event.id}/he/${defaultStorage[0].name}`;
      }
    }
    
    console.log('Image URL:', imageUrl);
    
    // Map language to locale
    const localeMap: Record<string, string> = {
      'he': 'he_IL',
      'en': 'en_US',
      'de': 'de_DE',
      'ar': 'ar_AR',
      'ru': 'ru_RU',
      'fr': 'fr_FR',
      'es': 'es_ES'
    };
    const locale = localeMap[langParam] || 'he_IL';
    
    // Use short_code if available, otherwise use UUID
    const displayCode = event.short_code || event.id;
    const currentUrl = `https://fp-pro.info/rsvp/${displayCode}/open?lang=${langParam}`;
    
    console.log(isBot ? 'Bot detected, serving meta tags HTML' : 'Regular user, serving HTML with quick redirect');
    
    // Generate HTML with dynamic meta tags
    // For bots: no redirect (so they see the meta tags)
    // For users: redirect to actual app
    const redirectMeta = !isBot ? `<meta http-equiv="refresh" content="0;url=${currentUrl}" />` : '';
    const redirectScript = !isBot ? `<script>window.location.href = '${currentUrl}';</script>` : '';
    
    const html = `<!DOCTYPE html>
<html lang="${langParam}" dir="${langParam === 'he' || langParam === 'ar' ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${fullTitle}</title>
    <meta name="description" content="${eventDescription}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${eventDescription}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:locale" content="${locale}" />
    <meta property="og:site_name" content="FP Pro Events" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${eventDescription}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- WhatsApp specific -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    
    ${redirectMeta}
    ${redirectScript}
  </head>
  <body>
    ${!isBot ? '<p>מפנה אותך לדף האירוע... / Redirecting to event page...</p>' : '<p>FP Pro Events</p>'}
    ${!isBot ? `<p><a href="${currentUrl}">לחץ כאן אם לא הועברת אוטומטית / Click here if not redirected automatically</a></p>` : ''}
  </body>
</html>`;
    
    console.log('Returning HTML with meta tags');
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Error generating dynamic meta tags:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
