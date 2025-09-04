import React, { useState } from 'react';
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

  const generateNameLink = () => {
    if (!selectedEventId || !customName.trim()) {
      toast({
        title: "⚠️ שגיאה", 
        description: "יש להזין שם ולבחור אירוע",
        variant: "destructive"
      });
      return;
    }

    const encodedName = encodeURIComponent(customName.trim());
    const url = `${window.location.origin}/rsvp/${selectedEventSlug || 'event'}/${encodedName}`;
    
    const newLink: CustomLink = {
      id: Date.now().toString(),
      type: 'name',
      value: customName.trim(),
      url: url,
      createdAt: new Date().toISOString()
    };

    setCustomLinks(prev => [...prev, newLink]);
    setCustomName('');
    
    toast({
      title: "🔗 קישור נוצר בהצלחה",
      description: `נוצר קישור עבור: ${customName}`
    });
  };

  const generateOpenLink = () => {
    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוע",
        variant: "destructive"
      });
      return;
    }

    const url = `${window.location.origin}/rsvp/${selectedEventSlug || 'event'}/open`;
    
    const newLink: CustomLink = {
      id: Date.now().toString(),
      type: 'open',
      value: 'קישור פתוח',
      url: url,
      createdAt: new Date().toISOString()
    };

    setCustomLinks(prev => [...prev, newLink]);
    
    toast({
      title: "🔗 קישור פתוח נוצר",
      description: "נוצר קישור שבו האורח יכניס את פרטיו בעצמו"
    });
  };

  const copyLink = (url: string, description: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "🔗 הקישור הועתק",
      description: `הועתק: ${description}`
    });
  };

  const deleteLink = (linkId: string) => {
    setCustomLinks(prev => prev.filter(link => link.id !== linkId));
    toast({
      title: "🗑️ קישור נמחק",
      description: "הקישור הוסר מהרשימה"
    });
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

  const eventCustomLinks = customLinks.filter(link => 
    selectedEventSlug && link.url.includes(`/rsvp/${selectedEventSlug}/`)
  );

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
                ייוצר קישור: .../rsvp/{selectedEventSlug || 'event'}/name/[השם]
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