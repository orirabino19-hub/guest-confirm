import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

// Helper function to extract language from slug
// Expected format: {eventCode}-{lang}-{randomString} or just {slug}
const extractLanguageFromSlug = (slug: string): string => {
  const parts = slug.split('-');
  // If slug has at least 2 parts and second part is 2 characters (language code)
  if (parts.length >= 2 && parts[1].length === 2) {
    return parts[1];
  }
  // Default to Hebrew if no language found
  return 'he';
};

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

        // For all /s/* routes, redirect directly to short-link Edge Function
        // This handles both bots (will get HTML with meta tags) and regular users (will get 302 redirect)
        console.log('🔄 Redirecting to short-link Edge Function');
        window.location.href = `https://jaddfwycowygakforhro.supabase.co/functions/v1/short-link?s=${slug}`;
        return;
      } catch (err) {
        console.error('Error resolving short link:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    resolveShortLink();
  }, [slug]);

  // Only show loading state - never show error during redirect
  if (loading || (!error && !redirectPath)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">מעביר אותך...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show error if explicitly set AND loading is complete
  if (error && !loading) {
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

  // If we have a redirectPath, use React Router navigation
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Fallback - should never reach here
  return null;
};

export default ShortLink;
