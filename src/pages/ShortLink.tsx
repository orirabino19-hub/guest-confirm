import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const ShortLink = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveShortLink = async () => {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Resolving short link:', slug);

        // First, try to find in the new short_urls table (independent URL shortener)
        const { data: shortUrlData, error: shortUrlError } = await supabase
          .from('short_urls')
          .select('slug, target_url, is_active, clicks_count')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (shortUrlData && !shortUrlError) {
          console.log('✅ Found in short_urls table:', shortUrlData);
          
          // Update clicks count
          await supabase
            .from('short_urls')
            .update({ clicks_count: shortUrlData.clicks_count + 1 })
            .eq('slug', slug);

          // Redirect to target URL
          setRedirectPath(shortUrlData.target_url);
          setLoading(false);
          return;
        }

        // If not found in short_urls, try the old links table
        const { data: linkData, error: linkError } = await supabase
          .from('links')
          .select('id, event_id, type, slug')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Link lookup result:', { linkData, linkError });

        if (linkError || !linkData) {
          console.error('Short link not found:', slug);
          setError(true);
          setLoading(false);
          return;
        }

        // קבלת קוד האירוע
        const { data: eventData } = await supabase
          .from('events')
          .select('short_code, id')
          .eq('id', linkData.event_id)
          .maybeSingle();

        const eventCode = eventData?.short_code || eventData?.id;

        // בניית הנתיב המתאים לפי סוג הלינק
        let path = '';
        if (linkData.type === 'open') {
          path = `/rsvp/${eventCode}/open`;
        } else if (linkData.type === 'personal' && linkData.slug.includes('/')) {
          // לינק אישי עם שם
          path = `/rsvp/${eventCode}/${linkData.slug}`;
        } else {
          // אם זה לינק אישי אבל בלי שם בודד - נעביר ל-open
          path = `/rsvp/${eventCode}/open`;
        }

        console.log('✅ Redirecting to:', path);
        setRedirectPath(path);
      } catch (err) {
        console.error('Error resolving short link:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    resolveShortLink();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">טוען...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !redirectPath) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-destructive/50">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">קישור לא תקין</h2>
            <p className="text-muted-foreground">הקישור שהזנת אינו קיים או אינו פעיל</p>
            <a 
              href="/" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              חזרה לדף הבית
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
};

export default ShortLink;
