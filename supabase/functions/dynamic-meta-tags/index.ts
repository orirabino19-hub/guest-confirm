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
    const langParam = url.searchParams.get('lang') || 'he';
    
    // Detect if request is from a bot (WhatsApp, Facebook, Twitter, etc.)
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|bot|crawler|spider|LinkedInBot/i.test(userAgent);
    
    console.log('Request received:', { pathname, lang: langParam });
    
    // Extract eventId from path like /rsvp/8/open or from query params
    let eventId = url.searchParams.get('eventId');
    if (!eventId) {
      const match = pathname.match(/\/rsvp\/([^\/]+)\/open/);
      eventId = match ? match[1] : null;
    }
    
    if (!eventId) {
      console.error('Event ID not found in URL');
      return new Response('Event ID required', { status: 400 });
    }
    
    console.log('Processing event:', eventId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, description')
      .eq('id', eventId)
      .single();
    
    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response('Event not found', { status: 404 });
    }
    
    console.log('Event loaded:', event.title);
    
    // Fetch event languages and translations
    const { data: languages } = await supabase
      .from('event_languages')
      .select('locale, translations')
      .eq('event_id', eventId);
    
    console.log('Languages loaded:', languages?.length || 0);
    
    // Helper to get translated text
    const getTranslation = (key: string, defaultValue: string) => {
      if (!languages || languages.length === 0) return defaultValue;
      
      const lang = languages.find(l => l.locale === langParam);
      if (lang?.translations && typeof lang.translations === 'object') {
        const translation = (lang.translations as any)[key];
        if (translation) return translation;
      }
      return defaultValue;
    };
    
    // Build translated content
    const eventTitle = event.title || getTranslation('event.title', 'אירוע');
    const eventDescription = event.description || getTranslation('event.description', 
      langParam === 'he' ? `הוזמנת לאירוע "${eventTitle}"` :
      langParam === 'de' ? `Sie sind zum Event "${eventTitle}" eingeladen` :
      langParam === 'en' ? `You are invited to the event "${eventTitle}"` :
      `הוזמנת לאירוע "${eventTitle}"`
    );
    
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
    
    // Get invitation image from storage
    const { data: storageData } = await supabase
      .storage
      .from('invitations')
      .list(`${eventId}/${langParam}`, { limit: 1 });
    
    let imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/default-invitation.jpg`;
    if (storageData && storageData.length > 0) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/invitations/${eventId}/${langParam}/${storageData[0].name}`;
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
    
    const currentUrl = `https://fp-pro.info/rsvp/${eventId}/open?lang=${langParam}`;
    
    // If not a bot, redirect to the React app
    if (!isBot) {
      console.log('Regular user detected, redirecting to React app');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': currentUrl,
        },
      });
    }
    
    console.log('Bot detected, serving meta tags HTML');
    
    // Generate HTML with dynamic meta tags for bots
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
    
    <!-- Redirect to actual app -->
    <meta http-equiv="refresh" content="0;url=${currentUrl}" />
    <script>
      window.location.href = '${currentUrl}';
    </script>
  </head>
  <body>
    <p>מפנה אותך לדף האירוע... / Redirecting to event page...</p>
    <p><a href="${currentUrl}">לחץ כאן אם לא הועברת אוטומטית / Click here if not redirected automatically</a></p>
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
