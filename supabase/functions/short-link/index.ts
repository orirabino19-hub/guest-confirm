import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract language from slug
// Expected format: {eventCode}-{lang}-{randomString} or just {slug}
function extractLanguageFromSlug(slug: string): string {
  const parts = slug.split('-');
  // If slug has at least 2 parts and second part is 2 characters (language code)
  if (parts.length >= 2 && parts[1].length === 2) {
    return parts[1];
  }
  // Default to Hebrew if no language found
  return 'he';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('s');
    
    if (!slug) {
      console.error('Slug not provided in URL');
      return new Response('Slug parameter (s) required', { status: 400 });
    }
    
    console.log('Short link request:', { slug });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch short URL data
    const { data: shortUrl, error: shortUrlError } = await supabase
      .from('short_urls')
      .select('id, slug, target_url, is_active, clicks_count')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    
    if (shortUrlError || !shortUrl) {
      console.error('Short URL not found or inactive:', shortUrlError);
      return new Response('Short URL not found or inactive', { status: 404 });
    }
    
    console.log('Short URL found:', { slug: shortUrl.slug, target_url: shortUrl.target_url });
    
    // Extract language from slug
    const langParam = extractLanguageFromSlug(slug);
    console.log('Extracted language from slug:', langParam);
    
    // Increment clicks count
    await supabase
      .from('short_urls')
      .update({ clicks_count: shortUrl.clicks_count + 1 })
      .eq('id', shortUrl.id);
    
    // Extract eventCode from target_url
    // Try to extract from query params first (old format: ?code=8&lang=de)
    const urlObj = new URL(shortUrl.target_url, 'https://dummy.com');
    let eventCode = urlObj.searchParams.get('code');
    
    // If not in query params, try to extract from path (new format: /rsvp/8/open)
    if (!eventCode) {
      const urlMatch = shortUrl.target_url.match(/\/rsvp\/([^\/\?]+)/);
      eventCode = urlMatch ? urlMatch[1] : null;
    }
    
    if (!eventCode) {
      console.error('Event code not found in target URL');
      return new Response('Invalid target URL - missing event code', { status: 400 });
    }
    
    console.log('Extracted event code:', eventCode);
    
    // Detect if request is from a bot
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|bot|crawler|spider|LinkedInBot/i.test(userAgent);
    
    console.log('Bot detected:', isBot, '| User-Agent:', userAgent);
    
    // Fetch event data - try by short_code first
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, description, short_code')
      .eq('short_code', eventCode)
      .maybeSingle();
    
    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response('Event not found', { status: 404 });
    }
    
    console.log('Event loaded:', event.title);
    
    // Fetch event languages and translations
    const { data: languages } = await supabase
      .from('event_languages')
      .select('locale, translations')
      .eq('event_id', event.id);
    
    console.log('Languages loaded:', languages?.length || 0);
    
    // Helper to get translated text
    const getTranslation = (keys: string[], defaultValue: string) => {
      if (!languages || languages.length === 0) return defaultValue;
      
      const lang = languages.find(l => l.locale === langParam);
      if (lang?.translations && typeof lang.translations === 'object') {
        for (const key of keys) {
          const translation = (lang.translations as any)[key];
          if (translation) {
            console.log(`Translation found for key "${key}":`, translation);
            // Extract text from the translation object structure
            if (translation.text && typeof translation.text === 'object') {
              const translatedText = translation.text[langParam];
              if (translatedText) {
                console.log(`Extracted text for "${key}" in ${langParam}:`, translatedText);
                return translatedText;
              }
            }
            // Fallback if translation is a simple string
            if (typeof translation === 'string') {
              return translation;
            }
          }
        }
      }
      return defaultValue;
    };
    
    // Build translated content
    const eventTitle = getTranslation(['rsvp.eventTitle', 'event.title'], event.title || 'אירוע');
    const eventDescription = getTranslation(
      ['rsvp.eventDescription', 'event.description'],
      event.description || (
        langParam === 'he' ? `הוזמנת לאירוע "${eventTitle}"` :
        langParam === 'de' ? `Sie sind zum Event "${eventTitle}" eingeladen` :
        langParam === 'en' ? `You are invited to the event "${eventTitle}"` :
        `הוזמנת לאירוע "${eventTitle}"`
      )
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
    
    // Build redirect URL
    const displayCode = event.short_code || event.id;
    const redirectUrl = `https://fp-pro.info/rsvp/${displayCode}/open?lang=${langParam}`;
    
    // If not a bot, redirect to the React app
    if (!isBot) {
      console.log('Regular user detected, redirecting to:', redirectUrl);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      });
    }
    
    console.log('Bot detected, serving HTML with meta tags');
    
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
    <meta property="og:url" content="${redirectUrl}" />
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
    <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
    <script>
      window.location.href = '${redirectUrl}';
    </script>
  </head>
  <body>
    <p>מפנה אותך לדף האירוע... / Redirecting to event page...</p>
    <p><a href="${redirectUrl}">לחץ כאן אם לא הועברת אוטומטית / Click here if not redirected automatically</a></p>
  </body>
</html>`;
    
    console.log('Returning HTML with meta tags');
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
    
  } catch (error) {
    console.error('Error in short-link function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
