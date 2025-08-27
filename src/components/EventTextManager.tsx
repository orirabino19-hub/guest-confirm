import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit3, Save, X, RotateCcw } from "lucide-react";
import type { Event } from "@/components/EventManager";

interface EventTextManagerProps {
  event: Event | null;
  onEventUpdate: (eventId: string, updatedEvent: Partial<Event>) => void;
}

interface TextOverrides {
  [key: string]: {
    [language: string]: string;
  };
}

// Default translatable keys that can be overridden per event
const EDITABLE_KEYS = [
  { key: 'rsvp.welcome', label: 'Welcome Message', defaultEn: 'Hello {{name}}! 👋', defaultHe: 'שלום {{name}}! 👋' },
  { key: 'rsvp.eventInvitation', label: 'Event Invitation', defaultEn: 'We are honored to invite you to {{eventName}}', defaultHe: 'אנחנו מתכבדים להזמינכם ל{{eventName}}' },
  { key: 'rsvp.confirmTitle', label: 'Confirm Title', defaultEn: '🎉 RSVP Confirmation', defaultHe: '🎉 אישור הגעה' },
  { key: 'rsvp.confirmDescription', label: 'Confirm Description', defaultEn: 'Please confirm the number of guests', defaultHe: 'אנא אמתו את מספר המוזמנים' },
  { key: 'rsvp.submitButton', label: 'Submit Button', defaultEn: '✅ Confirm Attendance', defaultHe: '✅ אשר הגעה' },
  { key: 'rsvp.eventTime', label: 'Event Time', defaultEn: '🕐 The event will take place on the scheduled date and time', defaultHe: '🕐 האירוע יתקיים בתאריך ובשעה שנקבעו' }
];

const EventTextManager = ({ event, onEventUpdate }: EventTextManagerProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [textOverrides, setTextOverrides] = useState<TextOverrides>(event?.textOverrides || {});

  if (!event) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {i18n.language === 'he' ? 'בחר אירוע כדי לערוך טקסטים' : 'Select an event to edit texts'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTextChange = (textKey: string, language: string, value: string) => {
    setTextOverrides(prev => ({
      ...prev,
      [textKey]: {
        ...prev[textKey],
        [language]: value
      }
    }));
  };

  const handleSave = () => {
    if (!event) return;
    
    onEventUpdate(event.id, { textOverrides });
    setEditingKey(null);
    
    toast({
      title: i18n.language === 'he' ? "נשמר בהצלחה" : "Saved Successfully",
      description: i18n.language === 'he' ? "טקסטים מותאמים אישית נשמרו" : "Custom texts have been saved",
    });
  };

  const handleReset = (textKey: string) => {
    const newOverrides = { ...textOverrides };
    delete newOverrides[textKey];
    setTextOverrides(newOverrides);
    
    toast({
      title: i18n.language === 'he' ? "אופס" : "Reset",
      description: i18n.language === 'he' ? "הטקסט חזר לברירת המחדל" : "Text reset to default",
    });
  };

  const getDisplayText = (textKey: string, language: string, defaultText: string) => {
    return textOverrides[textKey]?.[language] || defaultText;
  };

  const isOverridden = (textKey: string) => {
    return textOverrides[textKey] && Object.keys(textOverrides[textKey]).length > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          {i18n.language === 'he' ? 'עריכת טקסטים מותאמים אישית' : 'Custom Text Editor'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {i18n.language === 'he' 
            ? `עריכת טקסטים עבור אירוע: ${event.name}`
            : `Edit texts for event: ${event.name}`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {EDITABLE_KEYS.map((item) => (
          <div key={item.key} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="font-medium">{item.label}</Label>
                {isOverridden(item.key) && (
                  <Badge variant="secondary" className="text-xs">
                    {i18n.language === 'he' ? 'מותאם אישית' : 'Customized'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {editingKey === item.key ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="h-7 px-2"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(null)}
                      className="h-7 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(item.key)}
                      className="h-7 px-2"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    {isOverridden(item.key) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReset(item.key)}
                        className="h-7 px-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hebrew */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">עברית</Label>
                {editingKey === item.key ? (
                  <Textarea
                    dir="rtl"
                    value={getDisplayText(item.key, 'he', item.defaultHe)}
                    onChange={(e) => handleTextChange(item.key, 'he', e.target.value)}
                    className="min-h-[60px] text-right"
                    placeholder={item.defaultHe}
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded border text-right" dir="rtl">
                    {getDisplayText(item.key, 'he', item.defaultHe)}
                  </div>
                )}
              </div>

              {/* English */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">English</Label>
                {editingKey === item.key ? (
                  <Textarea
                    value={getDisplayText(item.key, 'en', item.defaultEn)}
                    onChange={(e) => handleTextChange(item.key, 'en', e.target.value)}
                    className="min-h-[60px]"
                    placeholder={item.defaultEn}
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded border">
                    {getDisplayText(item.key, 'en', item.defaultEn)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {editingKey && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-2" />
              {i18n.language === 'he' ? 'שמור שינויים' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingKey(null)}
            >
              <X className="h-4 w-4 mr-2" />
              {i18n.language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventTextManager;