import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import LanguageSelector from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Loader2 } from "lucide-react";
import eventInvitation from "@/assets/event-invitation.jpg";

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea';
  label: string;
  labelEn: string;
  options?: string[];
  required: boolean;
}

interface Event {
  id: string;
  name: string;
  nameEn: string;
  customFields?: CustomField[];
}

const getInvitationForGuest = (phone: string, language: string) => {
  // Special invitation for Sarah Levy demo
  if (phone === "0527654321" && language === 'he') {
    return "/lovable-uploads/2ed7e50b-48f4-4be4-b874-a19830a05aaf.png";
  }
  // Default invitation for others
  return eventInvitation;
};

const OpenRSVP = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ guestName: '' });
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        // Simulate API call to fetch event data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock event data with custom fields - should be replaced with real API call
        // For now, use the same structure as in Admin component  
        const mockEvents: Record<string, Event> = {
          "1": {
            id: "1",
            name: "החתונה של שייקי ומיכל",
            nameEn: "Shaiky & Michal's Wedding",
            customFields: [
              {
                id: "guestName",
                type: "text",
                label: "שם האורח",
                labelEn: "Guest Name",
                required: true
              },
              {
                id: "transport",
                type: "select",
                label: "האם אתה צריך הסעה לאירוע?",
                labelEn: "Do you need transportation to the event?",
                options: ["כן", "לא"],
                required: false
              },
              {
                id: "dietary",
                type: "text",
                label: "הגבלות תזונתיות",
                labelEn: "Dietary restrictions",
                required: false
              }
            ]
          },
          "2": {
            id: "2",
            name: "יום הולדת 30 לדני",
            nameEn: "Danny's 30th Birthday",
            customFields: [
              {
                id: "guestName",
                type: "text",
                label: "שם האורח",
                labelEn: "Guest Name",
                required: true
              }
            ]
          }
        };
        
        const foundEvent = mockEvents[eventId];
        if (!foundEvent) {
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }

        setEvent(foundEvent);
        
        // Initialize form data with default values
        const initialFormData: Record<string, any> = { guestName: '' };
        foundEvent.customFields?.forEach(field => {
          if (field.type === 'checkbox') {
            initialFormData[field.id] = false;
          } else {
            initialFormData[field.id] = '';
          }
        });
        setFormData(initialFormData);
        
      } catch (err) {
        setError(t('rsvp.errors.eventNotFound'));
        console.error("Error fetching event data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, t]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName.trim()) {
      toast({
        title: t('rsvp.error.title'),
        description: i18n.language === 'he' ? "יש להזין שם האורח" : "Please enter guest name",
        variant: "destructive"
      });
      return;
    }

    const totalGuests = menCount + womenCount;
    if (totalGuests === 0) {
      toast({
        title: t('rsvp.error.title'),
        description: t('rsvp.pleaseEnterGuests'),
        variant: "destructive"
      });
      return;
    }

    // Validate required custom fields
    const requiredFields = event?.customFields?.filter(field => field.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.id] || (typeof formData[field.id] === 'string' && !formData[field.id].trim())) {
        const fieldLabel = i18n.language === 'he' ? field.label : field.labelEn;
        toast({
          title: t('rsvp.error.title'),
          description: i18n.language === 'he' ? `יש למלא את השדה: ${fieldLabel}` : `Please fill the field: ${fieldLabel}`,
          variant: "destructive"
        });
        return;
      }
    }

    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('rsvp.success.title'),
        description: t('rsvp.success.description', { name: formData.guestName }),
      });
      
      console.log("Open RSVP Submitted:", {
        guestName: formData.guestName,
        menCount,
        womenCount,
        totalGuests,
        customFields: formData,
        timestamp: new Date().toISOString()
      });
      
      // Reset form
      setFormData({ guestName: '' });
      setMenCount(0);
      setWomenCount(0);
      event?.customFields?.forEach(field => {
        if (field.type === 'checkbox') {
          setFormData(prev => ({ ...prev, [field.id]: false }));
        } else {
          setFormData(prev => ({ ...prev, [field.id]: '' }));
        }
      });
      
    } catch (err) {
      toast({
        title: t('rsvp.error.title'),
        description: t('rsvp.error.description'),
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const incrementMen = () => {
    if (menCount < 10) {
      setMenCount(menCount + 1);
    }
  };

  const decrementMen = () => {
    if (menCount > 0) {
      setMenCount(menCount - 1);
    }
  };

  const incrementWomen = () => {
    if (womenCount < 10) {
      setWomenCount(womenCount + 1);
    }
  };

  const decrementWomen = () => {
    if (womenCount > 0) {
      setWomenCount(womenCount - 1);
    }
  };

  const totalGuests = menCount + womenCount;

  // Check if all required fields are filled
  const hasRequiredFields = () => {
    const requiredFields = event?.customFields?.filter(field => field.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.id] || (typeof formData[field.id] === 'string' && !formData[field.id].trim())) {
        return false;
      }
    }
    return true;
  };

  const renderCustomField = (field: CustomField) => {
    const label = i18n.language === 'he' ? field.label : field.labelEn;
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-destructive mr-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={label}
            />
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-destructive mr-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={label}
              rows={3}
            />
          </div>
        );
        
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-destructive mr-1">*</span>}
            </Label>
            <Select value={formData[field.id] || ''} onValueChange={(value) => handleInputChange(field.id, value)}>
              <SelectTrigger>
                <SelectValue placeholder={i18n.language === 'he' ? "בחר אפשרות" : "Select option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {label}
              {field.required && <span className="text-destructive mr-1">*</span>}
            </Label>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LanguageSelector />
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4 mt-4" />
            <p className="text-lg text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4 border-destructive/50">
          <CardContent className="text-center py-12">
            <LanguageSelector />
            <div className="text-4xl mb-4 mt-4">❌</div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">{t('common.error')}</h2>
            <p className="text-muted-foreground">{error}</p>
            <a 
              href="/" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              {t('rsvp.errors.returnHome')}
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Event Invitation Image with Language Selector */}
        <div className="relative overflow-hidden rounded-lg shadow-elegant">
          <img 
            src={getInvitationForGuest("", i18n.language)} 
            alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
            className="w-full h-auto max-h-[90vh] object-contain bg-white"
          />
          
          {/* Language Selector - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              {i18n.language === 'he' ? `ברוכים הבאים ל${event.name}` : `Welcome to ${event.nameEn}`}
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              {i18n.language === 'he' ? "אנא מלא את פרטיך להשתתפות באירוע" : "Please fill in your details to participate in the event"}
            </p>
          </CardHeader>
        </Card>

        {/* RSVP Form */}
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-primary">
              🎉 {t('rsvp.confirmTitle')}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {t('rsvp.confirmDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Custom Fields Section */}
              {event.customFields && event.customFields.length > 0 && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                  <h3 className="font-medium text-center text-foreground mb-4">
                    {i18n.language === 'he' ? "פרטי האורח" : "Guest Information"}
                  </h3>
                  {event.customFields.map(renderCustomField)}
                </div>
              )}

              {/* Show message if no fields configured */}
              {(!event.customFields || event.customFields.length === 0) && (
                <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg border border-border/30">
                  <p>{i18n.language === 'he' ? "לא הוגדרו שדות עבור אירוע זה" : "No fields configured for this event"}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Men Count */}
                <div className="space-y-2">
                  <Label htmlFor="menCount" className="text-sm font-medium">
                    {t('rsvp.menCount')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementMen}
                      disabled={menCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="menCount"
                      type="number"
                      min="0"
                      max="10"
                      value={menCount}
                      onChange={(e) => setMenCount(Number(e.target.value))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementMen}
                      disabled={menCount >= 10}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Women Count */}
                <div className="space-y-2">
                  <Label htmlFor="womenCount" className="text-sm font-medium">
                    {t('rsvp.womenCount')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementWomen}
                      disabled={womenCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="womenCount"
                      type="number"
                      min="0"
                      max="10"
                      value={womenCount}
                      onChange={(e) => setWomenCount(Number(e.target.value))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementWomen}
                      disabled={womenCount >= 10}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Total Display */}
              {totalGuests > 0 && (
                <div className="text-center p-4 bg-accent/50 rounded-lg border border-accent">
                  <p className="text-lg font-medium text-accent-foreground">
                    {t('rsvp.totalGuests', { count: totalGuests })}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={submitting || totalGuests === 0 || !hasRequiredFields()}
                className="w-full text-lg py-6 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-elegant"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('rsvp.submitting')}
                  </div>
                ) : (
                  t('rsvp.submitButton')
                )}
              </Button>

              {(totalGuests === 0 || !hasRequiredFields()) && (
                <p className="text-center text-sm text-muted-foreground">
                  {totalGuests === 0 
                    ? t('rsvp.pleaseEnterGuests')
                    : (i18n.language === 'he' ? "יש למלא את כל השדות הנדרשים" : "Please fill all required fields")
                  }
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-border/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('rsvp.eventTime')}
              </p>
              <p className="text-sm text-muted-foreground">
                {i18n.language === 'he' ? "לשאלות נוספות ניתן ליצור קשר" : "For additional questions, please contact us"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenRSVP;