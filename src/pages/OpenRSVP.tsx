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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import LanguageSelector from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Loader2, UserRound, Users, CheckCircle2 } from "lucide-react";
import eventInvitation from "@/assets/event-invitation.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useShortCodes } from "@/hooks/useShortCodes";
import { useRSVP } from "@/hooks/useRSVP";
import { useCustomTexts } from "@/hooks/useCustomTexts";
import { updateMetaTags, generateOpenRSVPMetaTags } from "@/utils/metaTags";

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn: string;
  labels?: Record<string, string>; // Additional language translations
  options?: string[];
  required: boolean;
}

interface Event {
  id: string;
  name: string;
  nameEn: string;
  customFields?: CustomField[];
  accordion_form_enabled?: boolean;
}

const useEventInvitation = (eventId: string, language: string) => {
  const [invitationUrl, setInvitationUrl] = useState<string>(eventInvitation);
  const [invitationType, setInvitationType] = useState<'image' | 'pdf'>('image');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!eventId) {
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch invitation image first, then PDF
        const imageFileName = `${language}-image`;
        const pdfFileName = `${language}-pdf`;
        
        // Check for image files with different extensions
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        let foundUrl = null;
        let fileType: 'image' | 'pdf' = 'image';
        
        for (const ext of extensions) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${eventId}/${imageFileName}.${ext}`);
            
            // Check if file actually exists
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'image';
              break;
            }
          } catch (error) {
            // Continue to next extension
          }
        }
        
        // If no image found, try PDF
        if (!foundUrl) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${eventId}/${pdfFileName}.pdf`);
            
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'pdf';
            }
          } catch (error) {
            // Use default if PDF also not found
          }
        }
        
        setInvitationUrl(foundUrl || eventInvitation);
        setInvitationType(fileType);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [eventId, language]);

  return { invitationUrl, invitationType, isLoading };
};

const OpenRSVP = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [resolvedEventId, setResolvedEventId] = useState<string>("");
  const [eventTheme, setEventTheme] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { generateMissingCodes } = useShortCodes();
  const { submitRSVP } = useRSVP();
  const { getCustomText, isTextHidden } = useCustomTexts(resolvedEventId);

  // Use the hook to get the correct invitation - only after we have resolved the eventId
  const { invitationUrl, invitationType, isLoading: invitationLoading } = useEventInvitation(resolvedEventId, i18n.language);

  // Update meta tags when invitation is loaded
  useEffect(() => {
    if (event && !invitationLoading && invitationUrl) {
      const metaTags = generateOpenRSVPMetaTags(event.name, undefined, invitationUrl);
      updateMetaTags(metaTags);
    }
  }, [event, invitationUrl, invitationLoading]);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError(t('rsvp.errors.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        let actualEventId = eventId;

        // Check if eventId looks like a short code (numeric and short)
        const isShortCode = eventId && /^\d+$/.test(eventId) && eventId.length < 10;
        
        if (isShortCode) {
          console.log('🔄 Looking up event by short code:', eventId);
          
          // Look up event by short code
          const { data: eventByCode, error: codeError } = await supabase
            .from('events')
            .select('id')
            .eq('short_code', eventId)
            .maybeSingle();

          if (codeError || !eventByCode) {
            console.log('❌ Event not found by short code, generating missing codes...');
            await generateMissingCodes();
            
            // Try again after generating codes
            const { data: retryEventByCode, error: retryError } = await supabase
              .from('events')
              .select('id')
              .eq('short_code', eventId)
              .maybeSingle();
              
            if (retryError || !retryEventByCode) {
              console.error('Event not found by short code:', eventId);
              setError(t('rsvp.errors.eventNotFound'));
              setLoading(false);
              return;
            }
            actualEventId = retryEventByCode.id;
          } else {
            actualEventId = eventByCode.id;
          }
        }

        console.log('🎯 Resolved actualEventId:', actualEventId);
        setResolvedEventId(actualEventId);

        // טעינת האירוע מ-Supabase לפי ID
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', actualEventId)
          .maybeSingle();

        if (eventError || !eventData) {
          console.error('Event not found:', eventError);
          setError(t('rsvp.errors.eventNotFound'));
          setLoading(false);
          return;
        }

        // Parse theme from database if exists
        if (eventData.theme) {
          const theme = typeof eventData.theme === 'string' ? JSON.parse(eventData.theme) : eventData.theme;
          setEventTheme(theme);
          
          // Apply theme colors to CSS variables
          if (theme.backgroundColor) document.documentElement.style.setProperty('--background', `${hexToHsl(theme.backgroundColor)}`);
          if (theme.textColor) document.documentElement.style.setProperty('--foreground', `${hexToHsl(theme.textColor)}`);
          if (theme.primaryColor) document.documentElement.style.setProperty('--primary', `${hexToHsl(theme.primaryColor)}`);
          if (theme.secondaryColor) document.documentElement.style.setProperty('--muted-foreground', `${hexToHsl(theme.secondaryColor)}`);
          if (theme.cardBackground) document.documentElement.style.setProperty('--card', `${hexToHsl(theme.cardBackground)}`);
          if (theme.inputBackground) document.documentElement.style.setProperty('--input', `${hexToHsl(theme.inputBackground)}`);
        }

        // טעינת השדות המותאמים אישית - רק עבור לינקים פתוחים
        const { data: customFieldsData, error: fieldsError } = await supabase
          .from('custom_fields_config')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('link_type', 'open')
          .eq('is_active', true)
          .order('order_index');

        if (fieldsError) {
          console.error('Error fetching custom fields:', fieldsError);
        }

        // המרת הנתונים לפורמט הנדרש
        const customFields: CustomField[] = customFieldsData?.map(field => ({
          id: field.key,
          type: field.field_type as any,
          label: field.label,
          labelEn: field.label, // For backward compatibility
          labels: (field.labels as Record<string, string>) || {},
          required: field.required,
          options: field.options as string[] || undefined
        })) || [];

        const eventObj: Event = {
          id: eventData.id,
          name: eventData.title,
          nameEn: eventData.title, // נוכל להוסיף תמיכה בשפות מאוחר יותר
          customFields,
          accordion_form_enabled: eventData.accordion_form_enabled
        };

        setEvent(eventObj);
        
        // Update page title
        document.title = `הזמנה ל${eventData.title}`;
        
        // Initial meta tags update (will be updated again when invitation loads)
        const initialMetaTags = generateOpenRSVPMetaTags(eventData.title, eventData.description);
        updateMetaTags(initialMetaTags);
        
        // Initialize form data with default values
        const initialFormData: Record<string, any> = {};
        customFields.forEach(field => {
          if (field.type === 'checkbox') {
            initialFormData[field.id] = false;
          } else if (field.type === 'menCounter' || field.type === 'womenCounter') {
            initialFormData[field.id] = 0;
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

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For accordion form: validate gender selection first
    if (event?.accordion_form_enabled && !selectedGender) {
      toast({
        title: t('rsvp.error.title'),
        description: getCustomText('rsvp.pleaseSelectGender', i18n.language, t('rsvp.pleaseSelectGender')),
        variant: "destructive"
      });
      return;
    }

    // Validate required name fields 
    if (!firstName.trim()) {
      toast({
        title: t('rsvp.error.title'),
        description: i18n.language === 'he' ? "יש להזין שם פרטי" : "Please enter first name",
        variant: "destructive"
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: t('rsvp.error.title'),
        description: i18n.language === 'he' ? "יש להזין שם משפחה" : "Please enter last name",
        variant: "destructive"
      });
      return;
    }

    if (totalGuests === 0) {
      toast({
        title: t('rsvp.error.title'),
        description: i18n.language === 'he' ? "יש להזין לפחות אורח אחד" : "Please enter at least one guest",
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
      // Calculate total counts - for accordion form, use selected gender
      let totalMenCount = event?.accordion_form_enabled 
        ? (selectedGender === 'male' ? 1 : 0)
        : menCount;
      let totalWomenCount = event?.accordion_form_enabled
        ? (selectedGender === 'female' ? 1 : 0)
        : womenCount;
      
      // Add counts from custom field counters (only for regular form)
      if (!event?.accordion_form_enabled) {
        event?.customFields?.forEach(field => {
          if (field.type === 'menCounter') {
            totalMenCount += Number(formData[field.id] || 0);
          } else if (field.type === 'womenCounter') {
            totalWomenCount += Number(formData[field.id] || 0);
          }
        });
      }

      // Prepare submission data
      const submissionData = {
        event_id: resolvedEventId,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        men_count: totalMenCount,
        women_count: totalWomenCount,
        answers: formData
      };

      // Submit to database using useRSVP hook
      await submitRSVP(submissionData);
      
      console.log("Open RSVP Submitted successfully:", submissionData);
      
      // Reset form
      setFirstName("");
      setLastName("");
      setMenCount(0);
      setWomenCount(0);
      setSelectedGender(null);
      setIsAccordionOpen(false);
      const initialFormData: Record<string, any> = {};
      event?.customFields?.forEach(field => {
        if (field.type === 'checkbox') {
          initialFormData[field.id] = false;
        } else if (field.type === 'menCounter' || field.type === 'womenCounter') {
          initialFormData[field.id] = 0;
        } else {
          initialFormData[field.id] = '';
        }
      });
      setFormData(initialFormData);
      
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

  // Calculate total guests - for accordion form it's always 1, for regular form sum all counters
  const customFieldsGuests = event?.accordion_form_enabled 
    ? 0 
    : ((event?.customFields || [])
        .filter(field => field.type === 'menCounter' || field.type === 'womenCounter')
        .reduce((total, field) => total + (formData[field.id] || 0), 0));
  
  const totalGuests = event?.accordion_form_enabled
    ? (selectedGender ? 1 : 0)
    : (menCount + womenCount + customFieldsGuests);

  // Check if all required fields are filled
  const hasRequiredFields = () => {
    // Check name fields
    if (!firstName.trim() || !lastName.trim()) {
      return false;
    }
    
    const requiredFields = event?.customFields?.filter(field => field.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.id] || (typeof formData[field.id] === 'string' && !formData[field.id].trim())) {
        return false;
      }
    }
    return true;
  };

  const renderCustomField = (field: CustomField) => {
    // Get label for current language
    const label = field.labels?.[i18n.language] || 
                  (i18n.language === 'he' ? field.label : field.labelEn);
    
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

      case 'menCounter':
      case 'womenCounter':
        const count = formData[field.id] || 0;
        const increment = () => {
          if (count < 10) {
            handleInputChange(field.id, count + 1);
          }
        };
        const decrement = () => {
          if (count > 0) {
            handleInputChange(field.id, count - 1);
          }
        };
        
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {label}
              {field.required && <span className="text-destructive mr-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrement}
                disabled={count <= 0}
                className="h-10 w-10 shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id={field.id}
                type="number"
                min="0"
                max="10"
                value={count}
                onChange={(e) => handleInputChange(field.id, Number(e.target.value))}
                className="text-center text-lg border-border/50 focus:border-primary"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={increment}
                disabled={count >= 10}
                className="h-10 w-10 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
            <LanguageSelector eventId={resolvedEventId} />
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
            <LanguageSelector eventId={resolvedEventId} />
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
      <div className="max-w-lg mx-auto space-y-8">
        {/* Event Invitation Image with Language Selector */}
        <div className="relative overflow-hidden rounded-lg shadow-elegant">
          {invitationLoading ? (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {invitationType === 'pdf' ? (
                <div className="w-full h-[70vh] border border-border/30 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {i18n.language === 'he' ? "לחץ כדי לצפות בהזמנה" : "Click to view invitation"}
                  </p>
                  <a 
                    href={invitationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {i18n.language === 'he' ? "פתח הזמנה" : "Open Invitation"}
                  </a>
                </div>
              ) : (
                <img 
                  src={invitationUrl} 
                  alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
                  className="w-full h-auto max-h-[90vh] object-contain"
                  onError={(e) => {
                    // Fallback to default invitation if image fails to load
                    e.currentTarget.src = eventInvitation;
                  }}
                />
              )}
            </>
          )}
          
          {/* Language Selector - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector eventId={resolvedEventId} />
          </div>
          
          {invitationType === 'image' && !invitationLoading && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          )}
        </div>

        {/* RSVP Form */}
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardHeader>
            {!isTextHidden('rsvp.eventInvitation') && (
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
                {getCustomText('rsvp.eventInvitation', i18n.language, t('rsvp.eventInvitation', { eventName: i18n.language === 'he' ? event.name : event.nameEn }))}
              </CardTitle>
            )}
            {!isTextHidden("rsvp.fillDetailsInstruction") && (
              <p className="text-muted-foreground text-lg text-center mb-4">
                {getCustomText("rsvp.fillDetailsInstruction", i18n.language, i18n.language === 'he' ? "אנא מלא את פרטיך להשתתפות באירוע" : "Please fill in your details to participate in the event")}
              </p>
            )}
            <div className="text-center">
              {!isTextHidden('rsvp.confirmTitle') && (
                <h2 className="text-xl font-semibold text-primary">
                  {getCustomText('rsvp.confirmTitle', i18n.language, t('rsvp.confirmTitle'))}
                </h2>
              )}
              {!isTextHidden('rsvp.confirmDescription') && (
                <p className="text-muted-foreground">
                  {getCustomText('rsvp.confirmDescription', i18n.language, t('rsvp.confirmDescription'))}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {event?.accordion_form_enabled ? (
                /* Accordion Form Style */
                <>
                  {/* Gender Selection */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-center text-xl text-foreground">
                      {getCustomText('rsvp.selectGender', i18n.language, t('rsvp.selectGender'))}
                      <span className="text-destructive mr-1">*</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Male Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGender('male');
                          setMenCount(1);
                          setWomenCount(0);
                          setIsAccordionOpen(true);
                        }}
                        className={`
                          relative p-6 rounded-xl border-2 transition-all duration-300
                          flex flex-col items-center justify-center gap-3
                          hover:scale-105 hover:shadow-lg
                          ${selectedGender === 'male' 
                            ? 'border-primary bg-primary/10 shadow-lg' 
                            : 'border-border/50 bg-card hover:border-primary/50'
                          }
                        `}
                      >
                        <UserRound 
                          className={`w-12 h-12 transition-colors ${
                            selectedGender === 'male' ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <span className={`text-lg font-semibold transition-colors ${
                          selectedGender === 'male' ? 'text-primary' : 'text-foreground'
                        }`}>
                          {getCustomText('rsvp.male', i18n.language, t('rsvp.male'))}
                        </span>
                        {selectedGender === 'male' && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>

                      {/* Female Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGender('female');
                          setMenCount(0);
                          setWomenCount(1);
                          setIsAccordionOpen(true);
                        }}
                        className={`
                          relative p-6 rounded-xl border-2 transition-all duration-300
                          flex flex-col items-center justify-center gap-3
                          hover:scale-105 hover:shadow-lg
                          ${selectedGender === 'female' 
                            ? 'border-primary bg-primary/10 shadow-lg' 
                            : 'border-border/50 bg-card hover:border-primary/50'
                          }
                        `}
                      >
                        <Users 
                          className={`w-12 h-12 transition-colors ${
                            selectedGender === 'female' ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <span className={`text-lg font-semibold transition-colors ${
                          selectedGender === 'female' ? 'text-primary' : 'text-foreground'
                        }`}>
                          {getCustomText('rsvp.female', i18n.language, t('rsvp.female'))}
                        </span>
                        {selectedGender === 'female' && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Accordion with all fields */}
                  {selectedGender && (
                    <Accordion type="single" collapsible value={isAccordionOpen ? "details" : ""}>
                      <AccordionItem value="details">
                        <AccordionTrigger className="text-lg font-medium">
                          {getCustomText('rsvp.personalDetails', i18n.language, t('rsvp.personalDetails'))}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {/* First Name */}
                            <div className="space-y-2">
                              <Label htmlFor="firstName">
                                {getCustomText('open_rsvp.first_name', i18n.language, 
                                  i18n.language === 'he' ? "שם פרטי" : "First Name")}
                                <span className="text-destructive mr-1">*</span>
                              </Label>
                              <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder={getCustomText('open_rsvp.first_name', i18n.language, 
                                  i18n.language === 'he' ? "הזן שם פרטי" : "Enter first name")}
                              />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                              <Label htmlFor="lastName">
                                {getCustomText('open_rsvp.last_name', i18n.language, 
                                  i18n.language === 'he' ? "שם משפחה" : "Last Name")}
                                <span className="text-destructive mr-1">*</span>
                              </Label>
                              <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder={getCustomText('open_rsvp.last_name', i18n.language, 
                                  i18n.language === 'he' ? "הזן שם משפחה" : "Enter last name")}
                              />
                            </div>

                            {/* Custom Fields */}
                            {event?.customFields && event.customFields.length > 0 && (
                              <>
                                {event.customFields.map(renderCustomField)}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedGender || !hasRequiredFields()}
                    className="
                      w-full text-lg py-7 font-semibold
                      bg-gradient-to-r from-primary via-primary/90 to-primary
                      hover:shadow-2xl hover:scale-[1.02] 
                      active:scale-[0.98]
                      transition-all duration-300 
                      shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      relative overflow-hidden
                      group
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    {submitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('rsvp.submitting')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>{!isTextHidden('rsvp.submitButton') && getCustomText('rsvp.submitButton', i18n.language, t('rsvp.submitButton'))}</span>
                      </div>
                    )}
                  </Button>

                  {/* Validation Message */}
                  {(!selectedGender || !hasRequiredFields()) && (
                    <p className="text-center text-sm text-muted-foreground">
                      {!selectedGender 
                        ? getCustomText('rsvp.pleaseSelectGender', i18n.language, t('rsvp.pleaseSelectGender'))
                        : (i18n.language === 'he' ? 'יש למלא את כל השדות הנדרשים' : 'Please fill all required fields')
                      }
                    </p>
                  )}
                </>
              ) : (
                /* Regular Form Style */
                <>
                  {/* Personal Details Section */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {getCustomText('open_rsvp.first_name', i18n.language, i18n.language === 'he' ? "שם פרטי" : "First Name")}
                        <span className="text-destructive mr-1">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={getCustomText('open_rsvp.first_name', i18n.language, i18n.language === 'he' ? "הזן שם פרטי" : "Enter first name")}
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {getCustomText('open_rsvp.last_name', i18n.language, i18n.language === 'he' ? "שם משפחה" : "Last Name")}
                        <span className="text-destructive mr-1">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={getCustomText('open_rsvp.last_name', i18n.language, i18n.language === 'he' ? "הזן שם משפחה" : "Enter last name")}
                      />
                    </div>

                    {/* Custom Fields */}
                    {event?.customFields && event.customFields.length > 0 && (
                      <>
                        {event.customFields.map(renderCustomField)}
                      </>
                    )}
                  </div>

                  {/* Default Guest Counters */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                    <h3 className="font-medium text-center text-foreground mb-4">
                      {getCustomText('rsvp.numberOfParticipants', i18n.language, i18n.language === 'he' ? "מספר משתתפים" : "Number of Participants")}
                    </h3>
                    
                    {/* Men Counter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {getCustomText('rsvp.menLabel', i18n.language, i18n.language === 'he' ? "גברים" : "Men")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setMenCount(Math.max(0, menCount - 1))}
                          disabled={menCount <= 0}
                          className="h-10 w-10 shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={menCount}
                          onChange={(e) => setMenCount(Math.max(0, Number(e.target.value)))}
                          className="text-center text-lg border-border/50 focus:border-primary"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setMenCount(Math.min(20, menCount + 1))}
                          disabled={menCount >= 20}
                          className="h-10 w-10 shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Women Counter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {getCustomText('rsvp.womenLabel', i18n.language, i18n.language === 'he' ? "נשים" : "Women")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setWomenCount(Math.max(0, womenCount - 1))}
                          disabled={womenCount <= 0}
                          className="h-10 w-10 shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={womenCount}
                          onChange={(e) => setWomenCount(Math.max(0, Number(e.target.value)))}
                          className="text-center text-lg border-border/50 focus:border-primary"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setWomenCount(Math.min(20, womenCount + 1))}
                          disabled={womenCount >= 20}
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
                        {getCustomText('rsvp.totalGuests', i18n.language, t('rsvp.totalGuests', { count: totalGuests })).replace('{{count}}', totalGuests.toString())}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={submitting || !hasRequiredFields() || totalGuests === 0}
                    className="
                      w-full text-lg py-7 font-semibold
                      bg-gradient-to-r from-primary via-primary/90 to-primary
                      hover:shadow-2xl hover:scale-[1.02] 
                      active:scale-[0.98]
                      transition-all duration-300 
                      shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      relative overflow-hidden
                      group
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    {submitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('rsvp.submitting')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>{!isTextHidden('rsvp.submitButton') && getCustomText('rsvp.submitButton', i18n.language, t('rsvp.submitButton'))}</span>
                      </div>
                    )}
                  </Button>

                  {(totalGuests === 0 || !hasRequiredFields()) && (
                    <p className="text-center text-sm text-muted-foreground">
                      {totalGuests === 0 
                        ? getCustomText('rsvp.pleaseEnterGuests', i18n.language, t('rsvp.pleaseEnterGuests'))
                        : (i18n.language === 'he' ? "יש למלא את כל השדות הנדרשים" : "Please fill all required fields")
                      }
                    </p>
                  )}
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenRSVP;