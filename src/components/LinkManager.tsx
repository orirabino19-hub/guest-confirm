import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, User, Users, Hash, Plus, Settings } from 'lucide-react';
import OpenRSVPCustomFields from './OpenRSVPCustomFields';
import { CustomField } from './EventManager';

interface LinkManagerProps {
  selectedEventId: string | null;
  eventName?: string;
  customFields?: CustomField[];
  onCustomFieldsUpdate?: (fields: CustomField[]) => void;
}

interface CustomLink {
  id: string;
  type: 'name' | 'open' | 'numbered';
  value: string;
  url: string;
  createdAt: string;
}

const LinkManager = ({ selectedEventId, eventName, customFields = [], onCustomFieldsUpdate }: LinkManagerProps) => {
  const [customName, setCustomName] = useState('');
  const [numberedCount, setNumberedCount] = useState(5);
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
    const url = `${window.location.origin}/rsvp/${selectedEventId}/name/${encodedName}`;
    
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

    const url = `${window.location.origin}/rsvp/${selectedEventId}/open`;
    
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

  const generateNumberedLinks = () => {
    if (!selectedEventId || numberedCount < 1 || numberedCount > 100) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוע ולהזין מספר בין 1-100",
        variant: "destructive"
      });
      return;
    }

    const newLinks: CustomLink[] = [];
    
    for (let i = 1; i <= numberedCount; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      const url = `${window.location.origin}/rsvp/${selectedEventId}/${paddedNumber}`;
      
      newLinks.push({
        id: `${Date.now()}_${i}`,
        type: 'numbered',
        value: paddedNumber,
        url: url,
        createdAt: new Date().toISOString()
      });
    }

    setCustomLinks(prev => [...prev, ...newLinks]);
    
    toast({
      title: "🔗 קישורים ממוספרים נוצרו",
      description: `נוצרו ${numberedCount} קישורים ממוספרים`
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
    link.url.includes(selectedEventId || '')
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="name" className="text-xs">
              <User className="h-4 w-4 ml-1" />
              לפי שם
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs">
              <Users className="h-4 w-4 ml-1" />
              קישור פתוח
            </TabsTrigger>
            <TabsTrigger value="numbered" className="text-xs">
              <Hash className="h-4 w-4 ml-1" />
              ממוספר
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
                ייוצר קישור: .../rsvp/{selectedEventId}/name/[השם]
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
              
              {/* Custom Fields Manager */}
              {onCustomFieldsUpdate && (
                <div className="border-t pt-4">
                  <OpenRSVPCustomFields
                    selectedEventId={selectedEventId}
                    customFields={customFields}
                    onCustomFieldsUpdate={onCustomFieldsUpdate}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="numbered" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numbered-count">מספר קישורים ממוספרים</Label>
              <div className="flex gap-2">
                <Input
                  id="numbered-count"
                  type="number"
                  min="1"
                  max="100"
                  value={numberedCount}
                  onChange={(e) => setNumberedCount(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button onClick={generateNumberedLinks}>
                  <Hash className="h-4 w-4 ml-1" />
                  צור קישורים
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ייוצרו קישורים: .../rsvp/{selectedEventId}/01, 02, 03...
              </p>
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
                      <Badge variant={
                        link.type === 'name' ? 'default' : 
                        link.type === 'open' ? 'secondary' : 'outline'
                      }>
                        {link.type === 'name' ? 'שם' : 
                         link.type === 'open' ? 'פתוח' : 'ממוספר'}
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