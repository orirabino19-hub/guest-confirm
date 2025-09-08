import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, User, Users, Plus, Settings } from 'lucide-react';
import OpenRSVPCustomFields from './OpenRSVPCustomFields';
import { CustomField } from './EventManager';
import { useShortCodes } from '@/hooks/useShortCodes';
import { supabase } from '@/integrations/supabase/client';

interface LinkManagerProps {
  selectedEventId: string | null;
  selectedEventSlug: string | null;
}

interface CustomLink {
  id: string;
  type: 'name' | 'open';
  value: string;
  url: string;
  createdAt: string;
}

const LinkManager = ({ selectedEventId, selectedEventSlug }: LinkManagerProps) => {
  const [customName, setCustomName] = useState('');
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const { toast } = useToast();
  const { generateShortLink } = useShortCodes();

  // Load existing links for the selected event from DB
  const loadLinks = async () => {
    if (!selectedEventId) {
      setCustomLinks([]);
      return;
    }
    try {
      // Ensure the event has a short code
      const { data: eventData } = await supabase
        .from('events')
        .select('id, short_code')
        .eq('id', selectedEventId)
        .maybeSingle();

      let eventCode = eventData?.short_code as string | null | undefined;
      if (!eventCode) {
        const { data: newCode } = await supabase.rpc('generate_event_code');
        if (newCode) {
          await supabase.from('events').update({ short_code: newCode }).eq('id', selectedEventId);
          eventCode = newCode;
        }
      }

      const { data: linkRows, error } = await supabase
        .from('links')
        .select('id, type, slug, created_at')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const currentDomain = window.location.origin;
      const mapped: CustomLink[] = (linkRows || []).map((row: any) => {
        const isName = row.type === 'personal';
        const value = isName
          ? decodeURIComponent((row.slug as string).split('/')[1] || '')
          : 'קישור פתוח';
        const mappedType: 'name' | 'open' = isName ? 'name' : 'open';
        return {
          id: row.id,
          type: mappedType,
          value,
          url: `${currentDomain}/rsvp/${eventCode || selectedEventId}/${row.slug}`,
          createdAt: row.created_at,
        } as CustomLink;
      });

      setCustomLinks(mapped);
    } catch (e) {
      console.error('Failed loading links', e);
      toast({
        title: '⚠️ שגיאה',
        description: 'טעינת קישורים נכשלה',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const generateNameLink = async () => {
    if (!selectedEventId || !customName.trim()) {
      toast({
        title: "⚠️ שגיאה", 
        description: "יש להזין שם ולבחור אירוע",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get or generate event short code
      const { data: eventData } = await supabase
        .from('events')
        .select('short_code')
        .eq('id', selectedEventId)
        .maybeSingle();

      let eventCode = eventData?.short_code as string | null | undefined;
      if (!eventCode) {
        const { data: newCode } = await supabase.rpc('generate_event_code');
        if (newCode) {
          await supabase.from('events').update({ short_code: newCode }).eq('id', selectedEventId);
          eventCode = newCode;
        }
      }

      const encodedName = encodeURIComponent(customName.trim());
      const slug = `name/${encodedName}`;

      // Save to DB
      const { data: inserted, error } = await supabase
        .from('links')
        .insert({
          event_id: selectedEventId,
          type: 'personal',
          slug,
        })
        .select('id, created_at, slug, type')
        .maybeSingle();

      if (error) throw error;

      const currentDomain = window.location.origin;
      const url = `${currentDomain}/rsvp/${eventCode || selectedEventId}/${slug}`;
      const newLink: CustomLink = {
        id: inserted?.id || Date.now().toString(),
        type: 'name',
        value: customName.trim(),
        url,
        createdAt: inserted?.created_at || new Date().toISOString(),
      };

      setCustomLinks(prev => [...prev, newLink]);
      setCustomName('');
      
      toast({
        title: "🔗 קישור נוצר בהצלחה",
        description: `נוצר קישור עבור: ${newLink.value}`
      });
    } catch (error) {
      console.error('Failed to create name link', error);
      toast({
        title: "⚠️ שגיאה",
        description: "לא ניתן היה ליצור קישור",
        variant: "destructive"
      });
    }
  };

  const generateOpenLink = async () => {
    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוע",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get or generate event short code
      const { data: eventData } = await supabase
        .from('events')
        .select('short_code')
        .eq('id', selectedEventId)
        .maybeSingle();

      let eventCode = eventData?.short_code as string | null | undefined;
      if (!eventCode) {
        const { data: newCode } = await supabase.rpc('generate_event_code');
        if (newCode) {
          await supabase.from('events').update({ short_code: newCode }).eq('id', selectedEventId);
          eventCode = newCode;
        }
      }

      // Check if an open link already exists
      const { data: existing } = await supabase
        .from('links')
        .select('id, created_at, slug, type')
        .eq('event_id', selectedEventId)
        .eq('type', 'open')
        .eq('slug', 'open')
        .maybeSingle();

      const currentDomain = window.location.origin;
      if (existing) {
        const url = `${currentDomain}/rsvp/${eventCode || selectedEventId}/open`;
        const newLink: CustomLink = {
          id: existing.id,
          type: 'open',
          value: 'קישור פתוח',
          url,
          createdAt: existing.created_at || new Date().toISOString(),
        } as CustomLink;

        setCustomLinks(prev => (prev.some(l => l.id === newLink.id) ? prev : [...prev, newLink]));
        toast({ title: "🔗 קישור פתוח קיים", description: "נשתמש בקישור שכבר קיים" });
        return;
      }

      // Create and save new open link
      const { data: inserted, error } = await supabase
        .from('links')
        .insert({
          event_id: selectedEventId,
          type: 'open',
          slug: 'open',
        })
        .select('id, created_at, slug, type')
        .maybeSingle();

      if (error) throw error;

      const url = `${currentDomain}/rsvp/${eventCode || selectedEventId}/open`;
      const newLink: CustomLink = {
        id: inserted?.id || Date.now().toString(),
        type: 'open',
        value: 'קישור פתוח',
        url,
        createdAt: inserted?.created_at || new Date().toISOString(),
      };

      setCustomLinks(prev => [...prev, newLink]);
      
      toast({
        title: "🔗 קישור פתוח נוצר",
        description: "נוצר קישור שבו האורח יכניס את פרטיו בעצמו"
      });
    } catch (error) {
      console.error('Failed to create open link', error);
      toast({
        title: "⚠️ שגיאה",
        description: "לא ניתן היה ליצור קישור",
        variant: "destructive"
      });
    }
  };

  const copyLink = (url: string, description: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "🔗 הקישור הועתק",
      description: `הועתק: ${description}`
    });
  };

  const deleteLink = async (linkId: string) => {
    try {
      await supabase.from('links').delete().eq('id', linkId);
      setCustomLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: "🗑️ קישור נמחק",
        description: "הקישור הוסר מהרשימה"
      });
    } catch (error) {
      toast({
        title: "⚠️ שגיאה",
        description: "לא ניתן היה למחוק את הקישור",
        variant: "destructive"
      });
    }
  };

  const copyAllLinks = () => {
    if (customLinks.length === 0) return;

    const linksList = customLinks.map(link => 
      `${link.value}: ${link.url}`
    ).join('\n');

    navigator.clipboard.writeText(linksList);
    toast({
      title: "🔗 כל הקישורים הועתקו",
      description: `הועתקו ${customLinks.length} קישורים ללוח`
    });
  };

  const eventCustomLinks = customLinks;

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            ניהול קישורים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לנהל קישורים
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          ניהול קישורים מותאמים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="name" className="text-xs">
              <User className="h-4 w-4 ml-1" />
              לפי שם
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs">
              <Users className="h-4 w-4 ml-1" />
              קישור פתוח
            </TabsTrigger>
          </TabsList>

          <TabsContent value="name" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">שם מותאם אישית</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="הכנס שם לקישור..."
                  className="flex-1"
                />
                <Button onClick={generateNameLink} disabled={!customName.trim()}>
                  <Plus className="h-4 w-4 ml-1" />
                  צור קישור
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ייוצר קישור: .../rsvp/[קוד-האירוע]/name/[השם]
              </p>
            </div>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>קישור פתוח לכל אורח</Label>
                <Button onClick={generateOpenLink} className="w-full">
                  <Users className="h-4 w-4 ml-2" />
                  צור קישור פתוח
                </Button>
                <p className="text-sm text-muted-foreground">
                  האורח יוכל להזין את פרטיו בעצמו בקישור זה
                </p>
              </div>
              
              {/* Custom Fields will be managed separately */}
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Links List */}
        {eventCustomLinks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">קישורים שנוצרו ({eventCustomLinks.length})</h4>
              <Button variant="outline" size="sm" onClick={copyAllLinks}>
                <Copy className="h-4 w-4 ml-1" />
                העתק הכל
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {eventCustomLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={link.type === 'name' ? 'default' : 'secondary'}>
                        {link.type === 'name' ? 'שם' : 'פתוח'}
                      </Badge>
                      <span className="text-sm font-medium">{link.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(link.url, link.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventCustomLinks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            לא נוצרו קישורים מותאמים עדיין
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkManager;