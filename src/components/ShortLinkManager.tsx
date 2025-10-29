import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShortLinkManagerProps {
  selectedEventId: string | null;
}

interface ShortLink {
  id: string;
  slug: string;
  type: 'personal' | 'open';
  eventName: string;
  fullUrl: string;
  createdAt: string;
}

const ShortLinkManager = ({ selectedEventId }: ShortLinkManagerProps) => {
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load all short links (for all events or for specific event)
  const loadShortLinks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('links')
        .select(`
          id,
          slug,
          type,
          created_at,
          event_id,
          events (
            title,
            short_code
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by event if selected
      if (selectedEventId) {
        query = query.eq('event_id', selectedEventId);
      }

      // Only show links with custom slugs (no '/' in slug)
      const { data, error } = await query;

      if (error) throw error;

      const currentDomain = window.location.origin;
      const mapped: ShortLink[] = (data || [])
        .filter((link: any) => !link.slug.includes('/')) // Only custom short links
        .map((link: any) => ({
          id: link.id,
          slug: link.slug,
          type: link.type,
          eventName: link.events?.title || 'אירוע לא ידוע',
          fullUrl: `${currentDomain}/${link.slug}`,
          createdAt: link.created_at
        }));

      setShortLinks(mapped);
    } catch (err) {
      console.error('Failed loading short links', err);
      toast({
        title: '⚠️ שגיאה',
        description: 'טעינת קיצורי לינקים נכשלה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShortLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const copyLink = (url: string, slug: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "🔗 הקישור הועתק",
      description: `הועתק: ${slug}`
    });
  };

  const deleteShortLink = async (linkId: string) => {
    try {
      await supabase.from('links').delete().eq('id', linkId);
      setShortLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: "🗑️ קיצור נמחק",
        description: "הקיצור הוסר מהמערכת"
      });
    } catch (error) {
      toast({
        title: "⚠️ שגיאה",
        description: "לא ניתן היה למחוק את הקיצור",
        variant: "destructive"
      });
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          ניהול קיצורי לינקים
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          ניהול קיצורי לינקים מותאמים אישית לאירועים שלך. ליצירת קיצור חדש, עבור לטאב "קישורים".
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">טוען קיצורי לינקים...</p>
          </div>
        ) : shortLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">לא נוצרו קיצורי לינקים עדיין</p>
            <p className="text-sm mt-2">
              עבור לטאב "קישורים" כדי ליצור קיצורים מותאמים אישית
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">קיצורי לינקים ({shortLinks.length})</h4>
            </div>
            
            {shortLinks.map((link) => (
              <div key={link.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={link.type === 'personal' ? 'default' : 'secondary'}>
                      {link.type === 'personal' ? 'אישי' : 'פתוח'}
                    </Badge>
                    <span className="text-sm font-medium">{link.eventName}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLink(link.fullUrl)}
                      title="פתח בחלון חדש"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(link.fullUrl, link.slug)}
                      title="העתק קישור"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteShortLink(link.id)}
                      className="text-destructive hover:text-destructive"
                      title="מחק קיצור"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">לינק מקוצר</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1.5 rounded font-mono flex-1 truncate">
                        {link.fullUrl}
                      </code>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">קיצור</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-primary/10 text-primary px-2 py-1.5 rounded font-mono font-semibold">
                        /{link.slug}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShortLinkManager;
