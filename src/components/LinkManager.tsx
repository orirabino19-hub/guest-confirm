import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, User, Users, Plus, Settings, Globe } from 'lucide-react';
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

interface SystemLanguage {
  code: string;
  name: string;
  native_name: string;
  flag: string | null;
}

const LinkManager = ({ selectedEventId, selectedEventSlug }: LinkManagerProps) => {
  const [customName, setCustomName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [openSlug, setOpenSlug] = useState('');
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [systemLanguages, setSystemLanguages] = useState<SystemLanguage[]>([]);
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
          ? decodeURIComponent((row.slug as string).split('/')[1] || row.slug)
          : 'קישור פתוח';
        const mappedType: 'name' | 'open' = isName ? 'name' : 'open';
        
        // אם ה-slug לא מכיל '/', זה קיצור ישיר
        const url = row.slug.includes('/')
          ? `${currentDomain}/rsvp/${eventCode || selectedEventId}/${row.slug}`
          : `${currentDomain}/${row.slug}`;
        
        return {
          id: row.id,
          type: mappedType,
          value,
          url,
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

  // Load system languages
  const loadSystemLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('system_languages')
        .select('code, name, native_name, flag')
        .order('name');
      
      if (error) throw error;
      setSystemLanguages(data || []);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  useEffect(() => {
    loadLinks();
    loadSystemLanguages();
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

      // אם יש slug מותאם אישית, נשתמש בו. אחרת נשתמש בפורמט הרגיל
      let slug = '';
      let finalUrl = '';
      const currentDomain = window.location.origin;
      
      if (customSlug.trim()) {
        // וידוא שה-slug ייחודי
        const { data: existingLink } = await supabase
          .from('links')
          .select('id')
          .eq('slug', customSlug.trim())
          .maybeSingle();
        
        if (existingLink) {
          toast({
            title: "⚠️ שגיאה",
            description: "קיצור זה כבר קיים. אנא בחר קיצור אחר",
            variant: "destructive"
          });
          return;
        }
        
        slug = customSlug.trim();
        finalUrl = `${currentDomain}/${slug}`;
      } else {
        const encodedName = encodeURIComponent(customName.trim());
        slug = `name/${encodedName}`;
        finalUrl = `${currentDomain}/rsvp/${eventCode || selectedEventId}/${slug}`;
      }

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

      const newLink: CustomLink = {
        id: inserted?.id || Date.now().toString(),
        type: 'name',
        value: customName.trim(),
        url: finalUrl,
        createdAt: inserted?.created_at || new Date().toISOString(),
      };

      setCustomLinks(prev => [...prev, newLink]);
      setCustomName('');
      setCustomSlug('');
      
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

      // Check if an open link already exists for this event
      const { data: existing } = await supabase
        .from('links')
        .select('id, created_at, slug, type')
        .eq('event_id', selectedEventId)
        .eq('type', 'open')
        .maybeSingle();

      // אם יש slug מותאם אישית, נשתמש בו. אחרת נשתמש ב-'open'
      let slug = openSlug.trim() || 'open';
      let finalUrl = '';
      const currentDomain = window.location.origin;
      
      if (openSlug.trim()) {
        // וידוא שה-slug ייחודי
        const { data: existingLink } = await supabase
          .from('links')
          .select('id')
          .eq('slug', openSlug.trim())
          .maybeSingle();
        
        if (existingLink) {
          toast({
            title: "⚠️ שגיאה",
            description: "קיצור זה כבר קיים. אנא בחר קיצור אחר",
            variant: "destructive"
          });
          return;
        }
        
        finalUrl = `${currentDomain}/${slug}`;
      } else {
        finalUrl = `${currentDomain}/rsvp/${eventCode || selectedEventId}/${slug}`;
      }
      
      if (existing) {
        const url = existing.slug.includes('/') 
          ? `${currentDomain}/rsvp/${eventCode || selectedEventId}/${existing.slug}`
          : `${currentDomain}/${existing.slug}`;
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
          slug: slug,
        })
        .select('id, created_at, slug, type')
        .maybeSingle();

      if (error) throw error;

      const newLink: CustomLink = {
        id: inserted?.id || Date.now().toString(),
        type: 'open',
        value: 'קישור פתוח',
        url: finalUrl,
        createdAt: inserted?.created_at || new Date().toISOString(),
      };

      setCustomLinks(prev => [...prev, newLink]);
      setOpenSlug('');
      
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

  const copySocialLink = async (eventId: string, lang: string = 'he') => {
    try {
      // Get event short_code
      const { data: eventData } = await supabase
        .from('events')
        .select('short_code')
        .eq('id', eventId)
        .maybeSingle();
      
      const eventCode = eventData?.short_code || eventId;
      
      // Generate a unique slug for this short link
      const randomSlug = Math.random().toString(36).substring(2, 8);
      const slug = `${eventCode}-${lang}-${randomSlug}`;
      
      // Create the target URL (Edge Function with parameters)
      const targetUrl = `https://jaddfwycowygakforhro.supabase.co/functions/v1/dynamic-meta-tags?code=${eventCode}&lang=${lang}`;
      
      // Save to short_urls table
      const { data: shortUrl, error } = await supabase
        .from('short_urls')
        .insert({
          slug,
          target_url: targetUrl,
          is_active: true
        })
        .select('slug')
        .single();
      
      if (error) throw error;
      
      // Copy the short branded link
      const currentDomain = window.location.origin;
      const shortLink = `${currentDomain}/s/${shortUrl.slug}`;
      
      navigator.clipboard.writeText(shortLink);
      toast({
        title: "📱 קישור קצר לשיתוף הועתק",
        description: `${shortLink}`
      });
    } catch (error) {
      console.error('Failed to create social link:', error);
      toast({
        title: "⚠️ שגיאה",
        description: "לא ניתן ליצור קישור שיתוף",
        variant: "destructive"
      });
    }
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
              <Input
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="הכנס שם לקישור..."
              />
              
              <Label htmlFor="custom-slug" className="text-xs">
                קיצור לינק (אופציונלי) - לדוגמא: Mendel
              </Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">{window.location.origin}/</span>
                <Input
                  id="custom-slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="Mendel"
                  className="flex-1"
                />
              </div>
              
              <Button onClick={generateNameLink} disabled={!customName.trim()} className="w-full">
                <Plus className="h-4 w-4 ml-1" />
                צור קישור
              </Button>
              
              <p className="text-xs text-muted-foreground">
                {customSlug.trim() 
                  ? `ייוצר קישור קצר: ${window.location.origin}/${customSlug}`
                  : 'ללא קיצור: .../rsvp/[קוד-האירוע]/name/[השם]'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>קישור פתוח לכל אורח</Label>
                
                <Label htmlFor="open-slug" className="text-xs">
                  קיצור לינק (אופציונלי) - לדוגמא: OpenInvite
                </Label>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">{window.location.origin}/</span>
                  <Input
                    id="open-slug"
                    value={openSlug}
                    onChange={(e) => setOpenSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="OpenInvite"
                    className="flex-1"
                  />
                </div>
                
                <Button onClick={generateOpenLink} className="w-full">
                  <Users className="h-4 w-4 ml-2" />
                  צור קישור פתוח
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  {openSlug.trim() 
                    ? `ייוצר קישור קצר: ${window.location.origin}/${openSlug}`
                    : 'ללא קיצור: .../rsvp/[קוד-האירוע]/open'}
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
                    {link.type === 'open' && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 טיפ: השתמש בכפתור 📱 לשיתוף בווטסאפ/פייסבוק עם תמונה מותאמת
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(link.url, link.value)}
                      title="העתק קישור רגיל"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {link.type === 'open' && selectedEventId && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="צור קישור לשיתוף חברתי בשפה מסוימת"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Globe className="h-4 w-4 ml-1" />
                            📱
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="end">
                          <div className="space-y-1">
                            <p className="text-sm font-medium mb-2">בחר שפה לשיתוף:</p>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {systemLanguages.map((lang) => (
                                <Button
                                  key={lang.code}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-right"
                                  onClick={() => copySocialLink(selectedEventId, lang.code)}
                                >
                                  {lang.flag && <span className="ml-2">{lang.flag}</span>}
                                  <span className="flex-1">{lang.native_name}</span>
                                  <span className="text-xs text-muted-foreground mr-2">
                                    {lang.code}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                      title="מחק קישור"
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