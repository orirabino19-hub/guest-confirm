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
import { Loader2 } from "lucide-react";

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

const OpenRSVP = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ guestName: '' });
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
        
        // Mock event data with custom fields
        const mockEvents: Record<string, Event> = {
          "1": {
            id: "1",
            name: "החתונה של שייקי ומיכל",
            nameEn: "Shaiky & Michal's Wedding",
            customFields: []
          },
          "2": {
            id: "2",
            name: "יום הולדת 30 לדני",
            nameEn: "Danny's 30th Birthday",
            customFields: []
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
        title: t('rsvp.form.error'),
        description: i18n.language === 'he' ? "יש להזין שם האורח" : "Please enter guest name",
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
          title: t('rsvp.form.error'),
          description: i18n.language === 'he' ? `יש למלא את השדה: ${fieldLabel}` : `Please fill the field: ${fieldLabel}`,
          variant: "destructive"
        });
        return;
      }
    }

    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: t('rsvp.form.success'),
        description: t('rsvp.form.successMessage'),
      });
      
      // Reset form
      setFormData({ guestName: '' });
      event?.customFields?.forEach(field => {
        if (field.type === 'checkbox') {
          setFormData(prev => ({ ...prev, [field.id]: false }));
        } else {
          setFormData(prev => ({ ...prev, [field.id]: '' }));
        }
      });
      
    } catch (err) {
      toast({
        title: t('rsvp.form.error'),
        description: t('rsvp.form.errorMessage'),
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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
    <div className="min-h-screen bg-background py-8" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <LanguageSelector />
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              {i18n.language === 'he' ? event.name : event.nameEn}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {i18n.language === 'he' ? "אנא מלא את פרטיך להשתתפות באירוע" : "Please fill in your details to participate in the event"}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Name Field */}
              <div className="space-y-2">
                <Label htmlFor="guestName">
                  {i18n.language === 'he' ? "שם האורח" : "Guest Name"}
                  <span className="text-destructive mr-1">*</span>
                </Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) => handleInputChange('guestName', e.target.value)}
                  placeholder={i18n.language === 'he' ? "הזן את שמך המלא" : "Enter your full name"}
                  required
                />
              </div>

              {/* Custom Fields */}
              {event.customFields && event.customFields.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">
                      {i18n.language === 'he' ? "פרטים נוספים" : "Additional Details"}
                    </h3>
                    {event.customFields.map(renderCustomField)}
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting 
                  ? (i18n.language === 'he' ? "שולח..." : "Submitting...") 
                  : (i18n.language === 'he' ? "אישור השתתפות" : "Confirm Attendance")
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenRSVP;